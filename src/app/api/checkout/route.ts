import { getSiteUrl, siteConfig } from "@/config/site";
import { validateCheckoutRequest } from "@/lib/checkout-policy";
import { attachStripeSession, checkoutFingerprint, CheckoutConflictError, getStoreSettings, releaseCheckoutOrder, reserveCheckoutOrder, StockUnavailableError } from "@/lib/orders";
import { formatPickupDate } from "@/lib/order-domain";
import { operationalLog } from "@/lib/operational-log";
import { getVariantLabel } from "@/lib/products";
import { checkoutReadiness, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const jsonError = (message: string, status: number, code?: string) =>
  Response.json({ message, code }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return jsonError("Checkout expects a JSON cart.", 415);
  if (Number(request.headers.get("content-length") ?? 0) > 32_000) return jsonError("Checkout request is too large.", 413);
  let payload: unknown;
  try { payload = await request.json(); } catch { return jsonError("Your cart could not be read.", 400); }
  // Validate against the origin that actually served this request. This keeps
  // production same-origin only while still allowing Vercel preview deployments
  // and local development to exercise the real checkout path.
  const policy = validateCheckoutRequest(payload, request.headers.get("origin"), new URL(request.url).origin);
  if (!policy.allowed) return jsonError(policy.message, 400, policy.code);

  const requestKey = request.headers.get("x-checkout-idempotency-key")?.trim();
  if (!requestKey || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) return jsonError("Checkout request needs a valid retry key.", 400);
  const readiness = checkoutReadiness();
  if (!readiness.ready) {
    operationalLog("error", "checkout.not_ready", { missing: readiness.missing });
    return jsonError("Online checkout is temporarily unavailable while order notifications are being configured. Please contact APEX MOTO to order.", 503, "CHECKOUT_NOT_READY");
  }

  const fingerprint = checkoutFingerprint({ customerName: policy.customerName, customerEmail: policy.customerEmail, shippingMethodId: policy.shipping.methodId, items: policy.items });
  let reserved: Awaited<ReturnType<typeof reserveCheckoutOrder>> | null = null;
  let stripeRequestAttempted = false;
  try {
    const settings = await getStoreSettings();
    if (policy.shipping.pickup && !settings.pickupEnabled) return jsonError("Pickup is currently unavailable. Choose delivery instead.", 409, "PICKUP_UNAVAILABLE");
    if (policy.shipping.pickup && !process.env.PICKUP_ADDRESS_PRIVATE?.trim()) return jsonError("Pickup checkout is temporarily unavailable until the collection address is configured. Choose delivery or contact APEX MOTO.", 503, "PICKUP_ADDRESS_NOT_CONFIGURED");
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    if (policy.shipping.pickup && (!settings.pickupNextAvailableDate || settings.pickupNextAvailableDate < today)) return jsonError("Pickup checkout is temporarily unavailable until the next collection date is confirmed. Choose delivery or contact APEX MOTO.", 503, "PICKUP_SCHEDULE_REQUIRED");
    const shipping = policy.shipping.pickup ? { ...policy.shipping, label: `${settings.pickupLocationLabel} pickup` } : policy.shipping;
    reserved = await reserveCheckoutOrder({ checkoutKey: requestKey, requestFingerprint: fingerprint, customerName: policy.customerName, customerEmail: policy.customerEmail, items: policy.items, shipping });
    const stripe = getStripe();
    if (reserved.existingSessionId) {
      stripeRequestAttempted = true;
      const existing = await stripe.checkout.sessions.retrieve(reserved.existingSessionId);
      if (existing.url && existing.status === "open") return Response.json({ url: existing.url, orderNumber: reserved.orderNumber, accessToken: reserved.accessToken, purchasedKeys: policy.items.map((item) => item.key) }, { headers: { "Cache-Control": "no-store" } });
    }

    const siteUrl = getSiteUrl();
    stripeRequestAttempted = true;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true,
      client_reference_id: reserved.orderId,
      line_items: policy.items.map((item) => ({
        price_data: { currency: "aud", unit_amount: item.product.price, product_data: { name: item.product.name, description: getVariantLabel(item.product, item.variant), metadata: { businessId: siteConfig.businessId, productId: item.product.id, variantId: item.variant.id } } },
        quantity: item.quantity,
      })),
      customer_email: policy.customerEmail,
      customer_creation: "always",
      name_collection: { individual: { enabled: true, optional: false } },
      billing_address_collection: "auto",
      ...(policy.shipping.pickup ? {} : {
        shipping_address_collection: { allowed_countries: ["AU"] as ["AU"] },
        shipping_options: [{ shipping_rate_data: { type: "fixed_amount" as const, fixed_amount: { amount: policy.shipping.amount, currency: "aud" }, display_name: policy.shipping.label } }],
      }),
      custom_text: { submit: { message: policy.shipping.pickup
        ? `Pickup is in ${settings.pickupLocationLabel}, no earlier than ${formatPickupDate(settings.pickupNextAvailableDate)}, and only at a time confirmed by email. ${settings.pickupAddressDisclosure}`
        : `Delivery method: ${shipping.label}. Order and dispatch confirmations are sent to ${policy.customerEmail}.` } },
      payment_intent_data: {
        receipt_email: policy.customerEmail,
        metadata: { businessId: siteConfig.businessId, orderId: reserved.orderId, orderNumber: reserved.orderNumber },
      },
      integration_identifier: "apexmoto_kzqtrvpm",
      expires_at: Math.floor(new Date(reserved.reservationExpiresAt).getTime() / 1000),
      success_url: `${siteUrl}/order-success?session_id={CHECKOUT_SESSION_ID}&order=${encodeURIComponent(reserved.orderNumber)}&token=${encodeURIComponent(reserved.accessToken)}`,
      cancel_url: `${siteUrl}/cart?checkout=cancelled`,
      metadata: { businessId: siteConfig.businessId, orderId: reserved.orderId, orderNumber: reserved.orderNumber, fulfilmentMethod: policy.shipping.methodId },
    }, { idempotencyKey: `${siteConfig.businessId}:${requestKey}` });
    if (!session.url) throw new Error("Stripe did not provide a checkout link.");
    await attachStripeSession(reserved.orderId, session.id).catch(() => undefined);
    return Response.json({ url: session.url, orderNumber: reserved.orderNumber, accessToken: reserved.accessToken, purchasedKeys: policy.items.map((item) => item.key) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (reserved && !stripeRequestAttempted) await releaseCheckoutOrder(reserved.orderId).catch(() => undefined);
    if (error instanceof StockUnavailableError) return jsonError(error.message, 409, "STOCK_UNAVAILABLE");
    if (error instanceof CheckoutConflictError) return jsonError(error.message, 409, "CHECKOUT_CONFLICT");
    return jsonError("Secure checkout could not be started. No payment was taken. Please try again or contact us.", 502, "CHECKOUT_START_FAILED");
  }
}
