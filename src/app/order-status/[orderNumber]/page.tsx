import { formatPrice, siteConfig } from "@/config/site";
import { formatPickupDate, orderStatusLabel } from "@/lib/order-domain";
import { getAccessibleOrder } from "@/lib/orders";
import { CircleAlert, ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { formatShippingAddress } from "@/lib/shipping-display";

export const metadata: Metadata = { title: "Order status", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OrderStatusPage({ params, searchParams }: { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ token?: string }> }) {
  const [{ orderNumber }, { token }] = await Promise.all([params, searchParams]);
  let order = null;
  try { if (token) order = await getAccessibleOrder(orderNumber, token); } catch { order = null; }
  if (!order) return <div className="page-shell status-page"><div className="status-card status-card--unverified"><CircleAlert aria-hidden="true" /><h1>Private link required.</h1><p>This order could not be opened. Use the order-status link in your confirmation email or contact {siteConfig.email}.</p><Link className="button button--primary" href="/order-help">Order help</Link></div></div>;
  return <div className="page-shell"><div className="container page-hero page-hero--compact"><p className="eyebrow eyebrow--accent">{order.orderNumber}</p><h1>{orderStatusLabel(order.status)}.</h1><p>Paid {order.paidAt ? new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" }).format(new Date(order.paidAt)) : "status pending"}.</p></div>
    <div className="container order-status-grid"><section className="confirmation-panel"><h2>Order</h2>{order.items.map((item) => <div className="status-line" key={item.cartItemKey}><span><strong>{item.quantity} × {item.productName}</strong><small>{item.variantLabel}</small></span><strong>{formatPrice(item.lineTotal)}</strong></div>)}{order.discountAmount > 0 ? <div className="status-total"><span>Discount{order.promotionCode ? ` (${order.promotionCode})` : ""}</span><strong>−{formatPrice(order.discountAmount)}</strong></div> : null}<div className="status-total"><span>Total paid</span><strong>{formatPrice(order.totalAmount)}</strong></div></section>
      <aside className="support-card"><ClipboardCheck aria-hidden="true" /><h2>Fulfilment</h2><p><strong>{order.fulfilmentLabel}</strong></p>{order.fulfilmentMethodId === "pickup" ? <p>Earliest: {formatPickupDate(order.pickupDate)}<br />{order.pickupWindow}<br />Wait for your confirmed time and private address.</p> : <p>{formatShippingAddress(order.shippingDetails) ?? "Delivery details are attached to the order."}{order.shippingTrackingNumber ? <><br />Tracking: {order.shippingTrackingNumber}</> : null}</p>}<Link className="button button--secondary" href={`/order-help?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(token ?? "")}`}>Order help</Link></aside>
    </div></div>;
}
