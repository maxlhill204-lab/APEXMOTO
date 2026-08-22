import { createHash, randomBytes, randomUUID } from "node:crypto";
import { siteConfig } from "@/config/site";
import { MAX_EMAIL_ATTEMPTS } from "@/lib/email-policy";
import { getSql, withDbTransaction } from "@/lib/db";
import { createOrderAccessToken, verifyOrderAccessToken } from "@/lib/order-access";
import {
  catalogueInventorySeed,
  inventoryRequirements,
  reconcileStripeCheckoutTotal,
  RESERVATION_MINUTES,
  settingsFallback,
  snapshotOrderItems,
} from "@/lib/order-domain";
import type { ShippingQuote } from "@/lib/shipping";
import type { ResolvedCartItem } from "@/types/product";
import type { AdminOrder, EmailKind, OrderItemSnapshot, OrderStatus, PaymentStatus, PublicOrder, StoreSettings } from "@/types/order";
import type { PoolClient } from "@neondatabase/serverless";

type Row = Record<string, unknown>;
type PaidCheckout = {
  eventId: string;
  eventType: string;
  sessionId: string;
  clientReferenceId: string | null;
  paymentStatus: string;
  amountTotal: number | null;
  discountAmount: number;
  promotionCode: string | null;
  stripePromotionCodeId: string | null;
  paymentMethodLabel: string | null;
  currency: string | null;
  paymentIntentId: string | null;
  customerId: string | null;
  shippingDetails: Record<string, unknown> | null;
};

export class StockUnavailableError extends Error {
  constructor() {
    super("One or more selected items have just sold out. Please review your cart.");
    this.name = "StockUnavailableError";
  }
}

export class CheckoutConflictError extends Error {
  constructor() {
    super("This checkout retry key was already used for a different cart.");
    this.name = "CheckoutConflictError";
  }
}

const isoDate = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const isoDateTime = (value: unknown) => value instanceof Date ? value.toISOString() : value ? String(value) : null;

const toShippingDetails = (value: unknown): Record<string, string> | null => {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const address = source.address && typeof source.address === "object" ? source.address as Record<string, unknown> : {};
  const allowed = {
    name: typeof source.name === "string" ? source.name : "",
    line1: typeof address.line1 === "string" ? address.line1 : "",
    line2: typeof address.line2 === "string" ? address.line2 : "",
    city: typeof address.city === "string" ? address.city : "",
    state: typeof address.state === "string" ? address.state : "",
    postalCode: typeof address.postal_code === "string" ? address.postal_code : "",
    country: typeof address.country === "string" ? address.country : "",
  };
  return Object.values(allowed).some(Boolean) ? allowed : null;
};

function mapSettings(row: Row): StoreSettings {
  return {
    pickupEnabled: Boolean(row.pickup_enabled),
    pickupLocationLabel: String(row.pickup_location_label),
    pickupAddressDisclosure: String(row.pickup_address_disclosure),
    pickupNextAvailableDate: isoDate(row.pickup_next_available_date),
    pickupWindow: String(row.pickup_window),
    pickupSameDayAvailable: Boolean(row.pickup_same_day_available),
    pickupAppointmentRequired: Boolean(row.pickup_appointment_required),
    supportResponseMinHours: Number(row.support_response_min_hours),
    supportResponseMaxHours: Number(row.support_response_max_hours),
  };
}

async function ensureStoreData(client: PoolClient) {
  await client.query(
    `INSERT INTO store_settings (
      business_id, pickup_location_label, pickup_address_disclosure, pickup_next_available_date,
      pickup_window, pickup_same_day_available, pickup_appointment_required,
      support_response_min_hours, support_response_max_hours
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (business_id) DO NOTHING`,
    [
      siteConfig.businessId,
      siteConfig.pickupLocationLabel,
      siteConfig.pickupExactAddressDisclosure,
      siteConfig.pickupNextAvailableDate,
      siteConfig.pickupWindow,
      siteConfig.pickupSameDayAvailable,
      siteConfig.pickupAppointmentRequired,
      siteConfig.supportResponseHoursMin,
      siteConfig.supportResponseHoursMax,
    ],
  );
  for (const item of catalogueInventorySeed()) {
    await client.query(
      "INSERT INTO inventory (business_id, sku, stock_on_hand) VALUES ($1,$2,$3) ON CONFLICT (business_id, sku) DO NOTHING",
      [siteConfig.businessId, item.sku, item.stockOnHand],
    );
  }
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const fallback = settingsFallback(siteConfig);
  if (!process.env.DATABASE_URL?.trim()) return fallback;
  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM store_settings WHERE business_id = ${siteConfig.businessId}`;
    return rows[0] ? mapSettings(rows[0] as Row) : fallback;
  } catch {
    return fallback;
  }
}

export function checkoutFingerprint(input: {
  customerName: string;
  customerEmail: string;
  shippingMethodId: string;
  items: ResolvedCartItem[];
}) {
  const canonical = JSON.stringify({
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    shippingMethodId: input.shippingMethodId,
    items: input.items.map((item) => ({ key: item.key, quantity: item.quantity })).sort((a, b) => a.key.localeCompare(b.key)),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

function newOrderNumber() {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne", year: "2-digit", month: "2-digit", day: "2-digit" })
    .format(new Date()).replaceAll("-", "");
  return `APX-${day}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function reserveCheckoutOrder(input: {
  checkoutKey: string;
  requestFingerprint: string;
  customerName: string;
  customerEmail: string;
  items: ResolvedCartItem[];
  shipping: Extract<ShippingQuote, { available: true }>;
}): Promise<{ orderId: string; orderNumber: string; accessToken: string; reservationExpiresAt: string; existingSessionId: string | null }> {
  return withDbTransaction(async (client) => {
    await ensureStoreData(client);
    const existingResult = await client.query(
      "SELECT id, order_number, request_fingerprint, customer_email, reservation_expires_at, stripe_session_id FROM orders WHERE business_id=$1 AND checkout_key=$2 FOR UPDATE",
      [siteConfig.businessId, input.checkoutKey],
    );
    const existing = existingResult.rows[0] as Row | undefined;
    if (existing) {
      if (existing.request_fingerprint !== input.requestFingerprint) throw new CheckoutConflictError();
      const orderId = String(existing.id);
      return {
        orderId,
        orderNumber: String(existing.order_number),
        accessToken: createOrderAccessToken(siteConfig.businessId, orderId, String(existing.customer_email)),
        reservationExpiresAt: String(isoDateTime(existing.reservation_expires_at)),
        existingSessionId: existing.stripe_session_id ? String(existing.stripe_session_id) : null,
      };
    }

    const requirements = inventoryRequirements(input.items);
    for (const requirement of requirements) {
      const inventoryResult = await client.query(
        "SELECT stock_on_hand FROM inventory WHERE business_id=$1 AND sku=$2 FOR UPDATE",
        [siteConfig.businessId, requirement.sku],
      );
      const inventoryRow = inventoryResult.rows[0] as Row | undefined;
      if (!inventoryRow) throw new StockUnavailableError();
      const reservedResult = await client.query(
        "SELECT COALESCE(SUM(quantity),0)::integer AS reserved FROM inventory_reservations WHERE business_id=$1 AND sku=$2 AND status='ACTIVE'",
        [siteConfig.businessId, requirement.sku],
      );
      const reserved = Number((reservedResult.rows[0] as Row).reserved);
      if (Number(inventoryRow.stock_on_hand) - reserved < requirement.quantity) throw new StockUnavailableError();
    }

    const orderId = randomUUID();
    const orderNumber = newOrderNumber();
    const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60_000);
    const subtotal = input.items.reduce((total, item) => total + item.lineTotal, 0);
    const settingsResult = await client.query("SELECT * FROM store_settings WHERE business_id=$1", [siteConfig.businessId]);
    const settings = mapSettings(settingsResult.rows[0] as Row);
    await client.query(
      `INSERT INTO orders (
        id,business_id,order_number,checkout_key,request_fingerprint,status,payment_status,currency,
        subtotal_amount,shipping_amount,total_amount,customer_name,customer_email,fulfilment_method_id,
        fulfilment_label,pickup_date,pickup_window,reservation_expires_at
      ) VALUES ($1,$2,$3,$4,$5,'PENDING_PAYMENT','UNPAID','aud',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        orderId, siteConfig.businessId, orderNumber, input.checkoutKey, input.requestFingerprint,
        subtotal, input.shipping.amount, subtotal + input.shipping.amount, input.customerName, input.customerEmail,
        input.shipping.methodId, input.shipping.label,
        input.shipping.pickup ? settings.pickupNextAvailableDate : null,
        input.shipping.pickup ? settings.pickupWindow : null,
        expiresAt,
      ],
    );
    for (const item of snapshotOrderItems(input.items)) {
      await client.query(
        `INSERT INTO order_items (id,business_id,order_id,product_id,variant_id,product_name,variant_label,unit_amount,quantity,line_total,cart_item_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [randomUUID(), siteConfig.businessId, orderId, item.productId, item.variantId, item.productName, item.variantLabel, item.unitAmount, item.quantity, item.lineTotal, item.cartItemKey],
      );
    }
    for (const requirement of requirements) {
      await client.query(
        "INSERT INTO inventory_reservations (id,business_id,order_id,sku,quantity,status,expires_at) VALUES ($1,$2,$3,$4,$5,'ACTIVE',$6)",
        [randomUUID(), siteConfig.businessId, orderId, requirement.sku, requirement.quantity, expiresAt],
      );
    }
    await client.query(
      "INSERT INTO order_events (id,business_id,order_id,event_type,actor,details) VALUES ($1,$2,$3,'CHECKOUT_RESERVED','storefront',$4::jsonb)",
      [randomUUID(), siteConfig.businessId, orderId, JSON.stringify({ expiresAt: expiresAt.toISOString() })],
    );
    return {
      orderId,
      orderNumber,
      accessToken: createOrderAccessToken(siteConfig.businessId, orderId, input.customerEmail),
      reservationExpiresAt: expiresAt.toISOString(),
      existingSessionId: null,
    };
  });
}

export async function attachStripeSession(orderId: string, sessionId: string) {
  const sql = getSql();
  await sql`UPDATE orders SET stripe_session_id=${sessionId}, updated_at=now() WHERE business_id=${siteConfig.businessId} AND id=${orderId} AND status='PENDING_PAYMENT'`;
}

export async function releaseCheckoutOrder(orderId: string, eventType = "CHECKOUT_CREATION_FAILED") {
  await withDbTransaction(async (client) => {
    await client.query("UPDATE inventory_reservations SET status='RELEASED', updated_at=now() WHERE business_id=$1 AND order_id=$2 AND status='ACTIVE'", [siteConfig.businessId, orderId]);
    await client.query("UPDATE orders SET status='EXPIRED', updated_at=now() WHERE business_id=$1 AND id=$2 AND status='PENDING_PAYMENT'", [siteConfig.businessId, orderId]);
    await client.query("INSERT INTO order_events (id,business_id,order_id,event_type,actor) VALUES ($1,$2,$3,$4,'system')", [randomUUID(), siteConfig.businessId, orderId, eventType]);
  });
}

function mapOrder(row: Row, items: OrderItemSnapshot[]): PublicOrder {
  return {
    id: String(row.id),
    orderNumber: String(row.order_number),
    status: String(row.status) as OrderStatus,
    paymentStatus: String(row.payment_status) as PaymentStatus,
    subtotalAmount: Number(row.subtotal_amount),
    shippingAmount: Number(row.shipping_amount),
    discountAmount: Number(row.discount_amount ?? 0),
    totalAmount: Number(row.total_amount),
    promotionCode: row.promotion_code ? String(row.promotion_code) : null,
    stripePromotionCodeId: row.stripe_promotion_code_id ? String(row.stripe_promotion_code_id) : null,
    paymentMethodLabel: row.payment_method_label ? String(row.payment_method_label) : null,
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    fulfilmentMethodId: String(row.fulfilment_method_id),
    fulfilmentLabel: String(row.fulfilment_label),
    pickupDate: isoDate(row.pickup_date),
    pickupWindow: row.pickup_window ? String(row.pickup_window) : null,
    shippingDetails: toShippingDetails(row.shipping_details),
    createdAt: String(isoDateTime(row.created_at)),
    paidAt: isoDateTime(row.paid_at),
    refundedAt: isoDateTime(row.refunded_at),
    items,
  };
}

export async function getOrderById(orderId: string): Promise<PublicOrder | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM orders WHERE business_id=${siteConfig.businessId} AND id=${orderId}`;
  if (!rows[0]) return null;
  const itemRows = await sql`SELECT * FROM order_items WHERE business_id=${siteConfig.businessId} AND order_id=${orderId} ORDER BY id`;
  const items = itemRows.map((row) => ({
    productId: String(row.product_id), variantId: String(row.variant_id), productName: String(row.product_name),
    variantLabel: String(row.variant_label), unitAmount: Number(row.unit_amount), quantity: Number(row.quantity),
    lineTotal: Number(row.line_total), cartItemKey: String(row.cart_item_key),
  }));
  return mapOrder(rows[0] as Row, items);
}

export async function getAccessibleOrder(orderNumber: string, token: string) {
  const sql = getSql();
  const rows = await sql`SELECT id, customer_email FROM orders WHERE business_id=${siteConfig.businessId} AND order_number=${orderNumber}`;
  if (!rows[0]) return null;
  const orderId = String(rows[0].id);
  if (!verifyOrderAccessToken(siteConfig.businessId, orderId, String(rows[0].customer_email), token)) return null;
  return getOrderById(orderId);
}

async function enqueueEmail(client: PoolClient, orderId: string, kind: EmailKind, recipient: string) {
  await client.query(
    `INSERT INTO email_outbox (id,business_id,order_id,email_kind,recipient,status)
     VALUES ($1,$2,$3,$4,$5,'PENDING') ON CONFLICT (business_id,order_id,email_kind) DO NOTHING`,
    [randomUUID(), siteConfig.businessId, orderId, kind, recipient],
  );
}

export async function processPaidCheckout(input: PaidCheckout): Promise<{ order: PublicOrder; duplicate: boolean }> {
  const result = await withDbTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO webhook_events (id,business_id,provider,provider_event_id,event_type,status)
       VALUES ($1,$2,'stripe',$3,$4,'PROCESSING') ON CONFLICT (business_id,provider,provider_event_id) DO NOTHING RETURNING id`,
      [randomUUID(), siteConfig.businessId, input.eventId, input.eventType],
    );
    if (!inserted.rowCount) {
      const known = await client.query("SELECT status FROM webhook_events WHERE business_id=$1 AND provider='stripe' AND provider_event_id=$2", [siteConfig.businessId, input.eventId]);
      if ((known.rows[0] as Row | undefined)?.status === "PROCESSED") {
        const existing = await client.query("SELECT id FROM orders WHERE business_id=$1 AND (stripe_session_id=$2 OR id::text=$3)", [siteConfig.businessId, input.sessionId, input.clientReferenceId ?? ""]);
        return { orderId: String((existing.rows[0] as Row).id), duplicate: true };
      }
      throw new Error("Stripe event is already processing or previously failed.");
    }

    const orderResult = await client.query(
      "SELECT * FROM orders WHERE business_id=$1 AND (stripe_session_id=$2 OR id::text=$3) FOR UPDATE",
      [siteConfig.businessId, input.sessionId, input.clientReferenceId ?? ""],
    );
    const order = orderResult.rows[0] as Row | undefined;
    if (!order) throw new Error("Paid Stripe session does not map to an APEX MOTO order.");
    const orderId = String(order.id);
    if (input.paymentStatus !== "paid" && input.paymentStatus !== "no_payment_required") throw new Error("Stripe session is not paid.");
    const reconciled = reconcileStripeCheckoutTotal({
      subtotalAmount: Number(order.subtotal_amount),
      shippingAmount: Number(order.shipping_amount),
      discountAmount: input.discountAmount,
      amountTotal: input.amountTotal,
    });
    if (input.currency?.toLowerCase() !== String(order.currency).toLowerCase()) throw new Error("Stripe currency does not match the reserved order.");
    const alreadyPaid = order.payment_status === "PAID";
    if (!alreadyPaid) {
      const reservations = await client.query(
        "SELECT sku,quantity FROM inventory_reservations WHERE business_id=$1 AND order_id=$2 AND status='ACTIVE' ORDER BY sku FOR UPDATE",
        [siteConfig.businessId, orderId],
      );
      if (!reservations.rowCount) throw new Error("Paid order has no active stock reservation.");
      for (const reservation of reservations.rows as Row[]) {
        const beforeResult = await client.query("SELECT stock_on_hand FROM inventory WHERE business_id=$1 AND sku=$2", [siteConfig.businessId, String(reservation.sku)]);
        const before = Number((beforeResult.rows[0] as Row).stock_on_hand);
        const updated = await client.query(
          "UPDATE inventory SET stock_on_hand=stock_on_hand-$3, updated_at=now() WHERE business_id=$1 AND sku=$2 AND stock_on_hand >= $3 RETURNING sku",
          [siteConfig.businessId, String(reservation.sku), Number(reservation.quantity)],
        );
        if (!updated.rowCount) throw new Error("Inventory could not be allocated to a paid order.");
        await client.query("INSERT INTO inventory_events (id,business_id,sku,event_type,quantity_before,quantity_after,order_id,actor) VALUES ($1,$2,$3,'ORDER_PAID',$4,$5,$6,'stripe')", [randomUUID(), siteConfig.businessId, String(reservation.sku), before, before - Number(reservation.quantity), orderId]);
      }
      await client.query("UPDATE inventory_reservations SET status='CONSUMED',updated_at=now() WHERE business_id=$1 AND order_id=$2 AND status='ACTIVE'", [siteConfig.businessId, orderId]);
      await client.query(
        `UPDATE orders SET status='PAID',payment_status='PAID',paid_at=now(),updated_at=now(),stripe_session_id=$3,
         stripe_payment_intent_id=$4,stripe_customer_id=$5,shipping_details=$6::jsonb,discount_amount=$7,total_amount=$8,
         promotion_code=$9,stripe_promotion_code_id=$10,payment_method_label=$11 WHERE business_id=$1 AND id=$2`,
        [siteConfig.businessId, orderId, input.sessionId, input.paymentIntentId, input.customerId, JSON.stringify(input.shippingDetails),
          reconciled.discountAmount, reconciled.totalAmount, input.promotionCode, input.stripePromotionCodeId, input.paymentMethodLabel],
      );
      await client.query(
        "INSERT INTO order_events (id,business_id,order_id,event_type,provider_event_id,actor,details) VALUES ($1,$2,$3,'PAYMENT_CONFIRMED',$4,'stripe',$5::jsonb)",
        [randomUUID(), siteConfig.businessId, orderId, input.eventId, JSON.stringify({
          sessionId: input.sessionId,
          grossAmount: reconciled.grossAmount,
          discountAmount: reconciled.discountAmount,
          totalAmount: reconciled.totalAmount,
          promotionCode: input.promotionCode,
          stripePromotionCodeId: input.stripePromotionCodeId,
        })],
      );
    }
    await enqueueEmail(client, orderId, "CUSTOMER_ORDER_CONFIRMATION", String(order.customer_email));
    await enqueueEmail(client, orderId, "OWNER_NEW_ORDER", process.env.STORE_ORDER_EMAIL?.trim() || siteConfig.email);
    await client.query("UPDATE webhook_events SET status='PROCESSED',processed_at=now(),last_error=null WHERE business_id=$1 AND provider='stripe' AND provider_event_id=$2", [siteConfig.businessId, input.eventId]);
    return { orderId, duplicate: alreadyPaid };
  });
  const order = await getOrderById(result.orderId);
  if (!order) throw new Error("Confirmed order could not be reloaded.");
  return { order, duplicate: result.duplicate };
}

export async function processTerminalCheckout(eventId: string, eventType: string, sessionId: string, clientReferenceId: string | null, finalStatus: "EXPIRED" | "PAYMENT_FAILED") {
  await withDbTransaction(async (client) => {
    const inserted = await client.query(
      "INSERT INTO webhook_events (id,business_id,provider,provider_event_id,event_type,status) VALUES ($1,$2,'stripe',$3,$4,'PROCESSING') ON CONFLICT DO NOTHING RETURNING id",
      [randomUUID(), siteConfig.businessId, eventId, eventType],
    );
    if (!inserted.rowCount) return;
    const result = await client.query("SELECT id,status FROM orders WHERE business_id=$1 AND (stripe_session_id=$2 OR id::text=$3) FOR UPDATE", [siteConfig.businessId, sessionId, clientReferenceId ?? ""]);
    const order = result.rows[0] as Row | undefined;
    if (order && order.status === "PENDING_PAYMENT") {
      await client.query("UPDATE inventory_reservations SET status='RELEASED',updated_at=now() WHERE business_id=$1 AND order_id=$2 AND status='ACTIVE'", [siteConfig.businessId, String(order.id)]);
      await client.query("UPDATE orders SET status=$3,payment_status=$4,updated_at=now() WHERE business_id=$1 AND id=$2", [siteConfig.businessId, String(order.id), finalStatus, finalStatus === "PAYMENT_FAILED" ? "FAILED" : "UNPAID"]);
      await client.query("INSERT INTO order_events (id,business_id,order_id,event_type,provider_event_id,actor) VALUES ($1,$2,$3,$4,$5,'stripe')", [randomUUID(), siteConfig.businessId, String(order.id), finalStatus === "PAYMENT_FAILED" ? "PAYMENT_FAILED" : "CHECKOUT_EXPIRED", eventId]);
    }
    await client.query("UPDATE webhook_events SET status='PROCESSED',processed_at=now() WHERE business_id=$1 AND provider='stripe' AND provider_event_id=$2", [siteConfig.businessId, eventId]);
  });
}

export async function processRefundEvent(input: { eventId: string; eventType: string; refundId: string; paymentIntentId: string | null; amount: number; status: string | null }) {
  if (!input.paymentIntentId) throw new Error("Refund is missing its PaymentIntent.");
  const result = await withDbTransaction(async (client) => {
    const inserted = await client.query(
      "INSERT INTO webhook_events (id,business_id,provider,provider_event_id,event_type,status) VALUES ($1,$2,'stripe',$3,$4,'PROCESSING') ON CONFLICT DO NOTHING RETURNING id",
      [randomUUID(), siteConfig.businessId, input.eventId, input.eventType],
    );
    if (!inserted.rowCount) {
      const known = await client.query("SELECT status FROM webhook_events WHERE business_id=$1 AND provider='stripe' AND provider_event_id=$2", [siteConfig.businessId, input.eventId]);
      if ((known.rows[0] as Row | undefined)?.status !== "PROCESSED") throw new Error("Refund event is already processing or previously failed.");
      const existing = await client.query("SELECT id FROM orders WHERE business_id=$1 AND stripe_payment_intent_id=$2", [siteConfig.businessId, input.paymentIntentId]);
      return existing.rows[0] ? String((existing.rows[0] as Row).id) : null;
    }
    const orderResult = await client.query("SELECT * FROM orders WHERE business_id=$1 AND stripe_payment_intent_id=$2 FOR UPDATE", [siteConfig.businessId, input.paymentIntentId]);
    const order = orderResult.rows[0] as Row | undefined;
    if (!order) throw new Error("Refund does not map to an APEX MOTO order.");
    const orderId = String(order.id);
    const fullSucceeded = input.status === "succeeded" && input.amount >= Number(order.total_amount);
    await client.query(
      "INSERT INTO order_events (id,business_id,order_id,event_type,provider_event_id,actor,details) VALUES ($1,$2,$3,$4,$5,'stripe',$6::jsonb)",
      [randomUUID(), siteConfig.businessId, orderId, fullSucceeded ? "REFUND_CONFIRMED" : "REFUND_UPDATED", input.eventId, JSON.stringify({ refundId: input.refundId, amount: input.amount, status: input.status })],
    );
    if (fullSucceeded && order.status !== "REFUNDED") {
      await client.query("UPDATE orders SET status='REFUNDED',payment_status='REFUNDED',stripe_refund_id=$3,refunded_at=now(),updated_at=now() WHERE business_id=$1 AND id=$2", [siteConfig.businessId, orderId, input.refundId]);
      await enqueueEmail(client, orderId, "CUSTOMER_REFUNDED", String(order.customer_email));
      await client.query("UPDATE cancellation_requests SET status='APPROVED',resolved_at=now() WHERE business_id=$1 AND order_id=$2 AND status='OPEN'", [siteConfig.businessId, orderId]);
    }
    await client.query("UPDATE webhook_events SET status='PROCESSED',processed_at=now() WHERE business_id=$1 AND provider='stripe' AND provider_event_id=$2", [siteConfig.businessId, input.eventId]);
    return orderId;
  });
  return result ? getOrderById(result) : null;
}

export async function recordIgnoredWebhook(eventId: string, eventType: string) {
  const sql = getSql();
  await sql`INSERT INTO webhook_events (id,business_id,provider,provider_event_id,event_type,status,processed_at)
    VALUES (${randomUUID()},${siteConfig.businessId},'stripe',${eventId},${eventType},'IGNORED',now()) ON CONFLICT DO NOTHING`;
}

export async function requestOrderCancellation(orderNumber: string, token: string, reason: string) {
  const accessible = await getAccessibleOrder(orderNumber, token);
  if (!accessible) return null;
  const result = await withDbTransaction(async (client) => {
    const orderResult = await client.query("SELECT * FROM orders WHERE business_id=$1 AND id=$2 FOR UPDATE", [siteConfig.businessId, accessible.id]);
    const order = orderResult.rows[0] as Row | undefined;
    if (!order) return false;
    if (["CANCELLED", "REFUNDED", "EXPIRED", "PAYMENT_FAILED"].includes(String(order.status))) return false;
    const inserted = await client.query(
      `INSERT INTO cancellation_requests (id,business_id,order_id,reason,status) VALUES ($1,$2,$3,$4,'OPEN')
       ON CONFLICT (business_id,order_id) WHERE status='OPEN' DO NOTHING RETURNING id`,
      [randomUUID(), siteConfig.businessId, accessible.id, reason.trim().slice(0, 1000) || null],
    );
    if (inserted.rowCount) {
      await client.query("UPDATE orders SET status='CANCELLATION_REQUESTED',updated_at=now() WHERE business_id=$1 AND id=$2", [siteConfig.businessId, accessible.id]);
      await client.query("INSERT INTO order_events (id,business_id,order_id,event_type,actor) VALUES ($1,$2,$3,'CANCELLATION_REQUESTED','customer')", [randomUUID(), siteConfig.businessId, accessible.id]);
      await enqueueEmail(client, accessible.id, "CUSTOMER_CANCELLATION_RECEIVED", String(order.customer_email));
      await enqueueEmail(client, accessible.id, "OWNER_CANCELLATION_REQUEST", process.env.STORE_ORDER_EMAIL?.trim() || siteConfig.email);
    }
    return true;
  });
  const order = await getOrderById(accessible.id);
  if (order) await import("@/lib/email").then(({ deliverPendingEmails }) => deliverPendingEmails(order));
  return result ? order : null;
}

export async function listAdminOrders(limit = 100): Promise<AdminOrder[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM orders WHERE business_id=${siteConfig.businessId} ORDER BY created_at DESC LIMIT ${Math.min(Math.max(limit, 1), 100)}`;
  const orders: AdminOrder[] = [];
  for (const row of rows as Row[]) {
    const order = await getOrderById(String(row.id));
    if (!order) continue;
    const emailRows = await sql`SELECT email_kind,recipient,status,attempts,last_error FROM email_outbox WHERE business_id=${siteConfig.businessId} AND order_id=${order.id} ORDER BY created_at`;
    const cancellations = await sql`SELECT id FROM cancellation_requests WHERE business_id=${siteConfig.businessId} AND order_id=${order.id} AND status='OPEN' LIMIT 1`;
    orders.push({
      ...order,
      stripePaymentIntentId: row.stripe_payment_intent_id ? String(row.stripe_payment_intent_id) : null,
      cancellationRequested: cancellations.length > 0,
      emails: emailRows.map((email) => ({ kind: String(email.email_kind) as EmailKind, recipient: String(email.recipient), status: String(email.status), attempts: Number(email.attempts), lastError: email.last_error ? String(email.last_error) : null })),
    });
  }
  return orders;
}

const ADMIN_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID: ["PREPARING", "READY_FOR_PICKUP", "SHIPPED", "COMPLETED"],
  PREPARING: ["READY_FOR_PICKUP", "SHIPPED", "COMPLETED"],
  READY_FOR_PICKUP: ["COMPLETED"],
  SHIPPED: ["COMPLETED"],
  CANCELLATION_REQUESTED: ["PAID", "PREPARING", "READY_FOR_PICKUP", "SHIPPED"],
};

export async function setAdminOrderStatus(orderId: string, nextStatus: OrderStatus) {
  const result = await withDbTransaction(async (client) => {
    const rows = await client.query("SELECT * FROM orders WHERE business_id=$1 AND id=$2 FOR UPDATE", [siteConfig.businessId, orderId]);
    const row = rows.rows[0] as Row | undefined;
    if (!row) throw new Error("Order not found.");
    const current = String(row.status) as OrderStatus;
    if (!ADMIN_TRANSITIONS[current]?.includes(nextStatus)) throw new Error(`Order cannot move from ${current} to ${nextStatus}.`);
    await client.query("UPDATE orders SET status=$3,updated_at=now() WHERE business_id=$1 AND id=$2", [siteConfig.businessId, orderId, nextStatus]);
    await client.query("INSERT INTO order_events (id,business_id,order_id,event_type,actor,details) VALUES ($1,$2,$3,'STATUS_CHANGED','admin',$4::jsonb)", [randomUUID(), siteConfig.businessId, orderId, JSON.stringify({ from: current, to: nextStatus })]);
    if (nextStatus === "READY_FOR_PICKUP") await enqueueEmail(client, orderId, "CUSTOMER_READY_FOR_PICKUP", String(row.customer_email));
    if (nextStatus === "SHIPPED") await enqueueEmail(client, orderId, "CUSTOMER_SHIPPED", String(row.customer_email));
    return orderId;
  });
  return getOrderById(result);
}

export async function updateStoreSettings(input: Pick<StoreSettings, "pickupEnabled" | "pickupLocationLabel" | "pickupAddressDisclosure" | "pickupNextAvailableDate" | "pickupWindow" | "pickupSameDayAvailable" | "pickupAppointmentRequired" | "supportResponseMinHours" | "supportResponseMaxHours">) {
  if (!input.pickupLocationLabel.trim() || !input.pickupAddressDisclosure.trim() || !input.pickupWindow.trim()) throw new Error("Pickup fields cannot be blank.");
  if (input.pickupNextAvailableDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.pickupNextAvailableDate)) throw new Error("Pickup date must use YYYY-MM-DD.");
  if (!Number.isInteger(input.supportResponseMinHours) || !Number.isInteger(input.supportResponseMaxHours) || input.supportResponseMinHours < 0 || input.supportResponseMaxHours < input.supportResponseMinHours) throw new Error("Support response hours are invalid.");
  const sql = getSql();
  await sql`UPDATE store_settings SET pickup_enabled=${input.pickupEnabled},pickup_location_label=${input.pickupLocationLabel.trim()},pickup_address_disclosure=${input.pickupAddressDisclosure.trim()},pickup_next_available_date=${input.pickupNextAvailableDate},pickup_window=${input.pickupWindow.trim()},pickup_same_day_available=${input.pickupSameDayAvailable},pickup_appointment_required=${input.pickupAppointmentRequired},support_response_min_hours=${input.supportResponseMinHours},support_response_max_hours=${input.supportResponseMaxHours},updated_at=now() WHERE business_id=${siteConfig.businessId}`;
  return getStoreSettings();
}

export async function resetFailedEmails(orderId: string) {
  const sql = getSql();
  await sql`UPDATE email_outbox SET status='PENDING',attempts=0,next_attempt_at=now(),last_error=null WHERE business_id=${siteConfig.businessId} AND order_id=${orderId} AND status='FAILED'`;
  return getOrderById(orderId);
}

export async function listDueEmailOrderIds(limit = 25) {
  const sql = getSql();
  const rows = await sql`SELECT DISTINCT order_id FROM email_outbox WHERE business_id=${siteConfig.businessId} AND status IN ('PENDING','FAILED') AND attempts < ${MAX_EMAIL_ATTEMPTS} AND next_attempt_at <= now() ORDER BY order_id LIMIT ${Math.min(Math.max(limit, 1), 25)}`;
  return rows.map((row) => String(row.order_id));
}

export async function initialiseOrderSystemData() {
  return withDbTransaction(async (client) => { await ensureStoreData(client); });
}

export async function listInventory() {
  const sql = getSql();
  const rows = await sql`
    SELECT i.sku,i.stock_on_hand,COALESCE(SUM(r.quantity) FILTER (WHERE r.status='ACTIVE'),0)::integer AS reserved
    FROM inventory i LEFT JOIN inventory_reservations r ON r.business_id=i.business_id AND r.sku=i.sku
    WHERE i.business_id=${siteConfig.businessId}
    GROUP BY i.sku,i.stock_on_hand ORDER BY i.sku
  `;
  return rows.map((row) => ({ sku: String(row.sku), stockOnHand: Number(row.stock_on_hand), reserved: Number(row.reserved), available: Math.max(0, Number(row.stock_on_hand) - Number(row.reserved)) }));
}

export async function setInventoryStock(sku: string, stockOnHand: number) {
  if (!/^[a-z0-9-]{3,100}$/.test(sku) || !Number.isInteger(stockOnHand) || stockOnHand < 0 || stockOnHand > 10000) throw new Error("Inventory adjustment is invalid.");
  await withDbTransaction(async (client) => {
    const rows = await client.query("SELECT stock_on_hand FROM inventory WHERE business_id=$1 AND sku=$2 FOR UPDATE", [siteConfig.businessId, sku]);
    const row = rows.rows[0] as Row | undefined;
    if (!row) throw new Error("Inventory SKU not found.");
    const before = Number(row.stock_on_hand);
    const reservations = await client.query("SELECT COALESCE(SUM(quantity),0)::integer AS reserved FROM inventory_reservations WHERE business_id=$1 AND sku=$2 AND status='ACTIVE'", [siteConfig.businessId, sku]);
    if (stockOnHand < Number((reservations.rows[0] as Row).reserved)) throw new Error("Stock on hand cannot be lower than units currently reserved in open Stripe checkouts.");
    await client.query("UPDATE inventory SET stock_on_hand=$3,updated_at=now() WHERE business_id=$1 AND sku=$2", [siteConfig.businessId, sku, stockOnHand]);
    await client.query("INSERT INTO inventory_events (id,business_id,sku,event_type,quantity_before,quantity_after,actor) VALUES ($1,$2,$3,'ADMIN_ADJUSTMENT',$4,$5,'admin')", [randomUUID(), siteConfig.businessId, sku, before, stockOnHand]);
  });
}

export async function issueAdminRefund(orderId: string, orderNumberConfirmation: string) {
  const sql = getSql();
  const rows = await sql`SELECT order_number,stripe_payment_intent_id,total_amount,status FROM orders WHERE business_id=${siteConfig.businessId} AND id=${orderId}`;
  const row = rows[0];
  if (!row || String(row.order_number) !== orderNumberConfirmation.trim()) throw new Error("Order confirmation did not match.");
  if (!row.stripe_payment_intent_id || !["PAID", "PREPARING", "READY_FOR_PICKUP", "CANCELLATION_REQUESTED"].includes(String(row.status))) throw new Error("This order is not eligible for an automatic full refund.");
  const { getStripe } = await import("@/lib/stripe");
  const refund = await getStripe().refunds.create({ payment_intent: String(row.stripe_payment_intent_id), metadata: { businessId: siteConfig.businessId, orderId } }, { idempotencyKey: `${siteConfig.businessId}:full-refund:${orderId}` });
  const order = await processRefundEvent({ eventId: `admin-refund:${refund.id}`, eventType: "admin.refund", refundId: refund.id, paymentIntentId: String(row.stripe_payment_intent_id), amount: refund.amount, status: refund.status });
  if (order) await import("@/lib/email").then(({ deliverPendingEmails }) => deliverPendingEmails(order));
  return order;
}
