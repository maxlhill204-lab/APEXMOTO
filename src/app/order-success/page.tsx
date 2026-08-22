import { OrderCartReconciler } from "@/components/commerce/order-cart-reconciler";
import { formatPrice, siteConfig } from "@/config/site";
import { deliverPendingEmails } from "@/lib/email";
import { formatPickupDate, orderStatusLabel } from "@/lib/order-domain";
import { getAccessibleOrder, processPaidCheckout } from "@/lib/orders";
import { checkoutDiscountDetails, checkoutPaymentMethodLabel, retrieveCheckoutSessionForFulfilment, stripeObjectId } from "@/lib/stripe";
import type { PublicOrder } from "@/types/order";
import { CheckCircle2, CircleAlert, MailCheck, MapPin, PackageCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Order confirmed", description: "Your APEX MOTO order confirmation and fulfilment details.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function loadConfirmedOrder(orderNumber?: string, token?: string, sessionId?: string): Promise<PublicOrder | null> {
  if (!orderNumber || !token) return null;
  let order = await getAccessibleOrder(orderNumber, token);
  if (!order) return null;
  if (order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED") return order;
  if (!sessionId || !/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) return order;
  try {
    const session = await retrieveCheckoutSessionForFulfilment(sessionId);
    if (session.metadata?.businessId !== siteConfig.businessId || session.metadata.orderId !== order.id) return order;
    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return order;
    const discount = checkoutDiscountDetails(session);
    const confirmed = await processPaidCheckout({
      eventId: `checkout-return:${session.id}`,
      eventType: "checkout.return",
      sessionId: session.id,
      clientReferenceId: session.client_reference_id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      discountAmount: discount.discountAmount,
      promotionCode: discount.promotionCode,
      stripePromotionCodeId: discount.stripePromotionCodeId,
      paymentMethodLabel: checkoutPaymentMethodLabel(session),
      currency: session.currency,
      paymentIntentId: stripeObjectId(session.payment_intent),
      customerId: stripeObjectId(session.customer),
      shippingDetails: session.collected_information?.shipping_details ? JSON.parse(JSON.stringify(session.collected_information.shipping_details)) as Record<string, unknown> : null,
    });
    await deliverPendingEmails(confirmed.order);
    order = confirmed.order;
  } catch {
    // The signed webhook remains authoritative and will retry independently.
  }
  return order;
}

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string; order?: string; token?: string }> }) {
  const params = await searchParams;
  let order: PublicOrder | null = null;
  try { order = await loadConfirmedOrder(params.order, params.token, params.session_id); } catch { order = null; }
  const confirmed = order?.paymentStatus === "PAID" || order?.paymentStatus === "REFUNDED";
  if (!order) return <div className="page-shell status-page"><div className="status-card status-card--unverified"><CircleAlert aria-hidden="true" /><p className="eyebrow">Order status</p><h1>Order not verified.</h1><p>This link does not identify a valid APEX MOTO order. If Stripe charged you, contact us with the payment date and the email used at checkout.</p><div className="button-row"><Link className="button button--primary" href="/order-help">Get order help</Link><Link className="button button--secondary" href="/">Back home</Link></div></div></div>;

  return <div className="page-shell order-confirmation"><OrderCartReconciler purchasedKeys={confirmed ? order.items.map((item) => item.cartItemKey) : []} />
    <div className="container order-confirmation__hero">{confirmed ? <CheckCircle2 aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}<div><p className="eyebrow eyebrow--accent">{confirmed ? "PAYMENT CONFIRMED" : "PAYMENT PROCESSING"}</p><h1>{confirmed ? "Order received." : "We’re checking your payment."}</h1><p>{confirmed ? `Thanks, ${order.customerName}. Your items are allocated and confirmation is being sent to ${order.customerEmail}.` : "Do not pay again. Stripe or your payment method may still be completing the payment."}</p></div></div>
    <div className="container order-confirmation__layout">
      <section className="confirmation-panel"><div className="confirmation-panel__heading"><div><small>ORDER NUMBER</small><strong>{order.orderNumber}</strong></div><span>{orderStatusLabel(order.status)}</span></div>
        <div className="confirmation-lines">{order.items.map((item) => <div key={item.cartItemKey}><span><strong>{item.quantity} × {item.productName}</strong><small>{item.variantLabel}</small></span><strong>{formatPrice(item.lineTotal)}</strong></div>)}</div>
        <div className="confirmation-totals"><div><span>Subtotal</span><strong>{formatPrice(order.subtotalAmount)}</strong></div><div><span>{order.fulfilmentLabel}</span><strong>{order.shippingAmount ? formatPrice(order.shippingAmount) : "Free"}</strong></div>{order.discountAmount > 0 ? <div><span>Discount{order.promotionCode ? ` (${order.promotionCode})` : ""}</span><strong>−{formatPrice(order.discountAmount)}</strong></div> : null}<div><span>Total paid</span><strong>{formatPrice(order.totalAmount)}</strong></div></div>
      </section>
      <aside className="next-steps-panel"><h2>What happens next</h2>
        <div><MailCheck aria-hidden="true" /><span><strong>Confirmation email</strong><small>Sent automatically after payment confirmation. Check spam or promotions, then contact us if it has not arrived.</small></span></div>
        {order.fulfilmentMethodId === "pickup" ? <div><MapPin aria-hidden="true" /><span><strong>Pickup: {formatPickupDate(order.pickupDate)}</strong><small>{order.pickupWindow}. Pickup is in {siteConfig.pickupLocationLabel}. Wait for the confirmed time and private address before travelling.</small></span></div> : <div><PackageCheck aria-hidden="true" /><span><strong>{order.fulfilmentLabel}</strong><small>{order.shippingDetails ? [order.shippingDetails.line1, order.shippingDetails.line2, order.shippingDetails.city, order.shippingDetails.state, order.shippingDetails.postalCode].filter(Boolean).join(", ") : "Your delivery address is recorded securely with the order."}</small></span></div>}
        <p>Need to change or cancel something? Use order help as soon as possible. Replies are normally within {siteConfig.supportResponseHoursMin}–{siteConfig.supportResponseHoursMax} hours.</p>
        <div className="button-row"><Link className="button button--primary" href={`/order-status/${encodeURIComponent(order.orderNumber)}?token=${encodeURIComponent(params.token ?? "")}`}>View order status</Link><Link className="button button--secondary" href={`/order-help?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(params.token ?? "")}`}>Order help</Link></div>
      </aside>
    </div>
  </div>;
}
