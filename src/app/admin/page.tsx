import { requireAdmin } from "@/lib/admin-auth";
import { formatPrice } from "@/config/site";
import { formatPickupDate, orderStatusLabel } from "@/lib/order-domain";
import { getStoreSettings, initialiseOrderSystemData, listAdminOrders, listInventory } from "@/lib/orders";
import type { OrderStatus } from "@/types/order";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { inventoryAction, logoutAction, refundAction, retryEmailAction, settingsAction, statusAction } from "./actions";

export const metadata: Metadata = { title: "Order desk", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "PREPARING", label: "Mark preparing" },
  { value: "READY_FOR_PICKUP", label: "Mark ready for pickup + email" },
  { value: "SHIPPED", label: "Mark shipped + email" },
  { value: "COMPLETED", label: "Mark completed" },
  { value: "PAID", label: "Decline cancellation / restore paid" },
];

export default async function AdminPage() {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  await initialiseOrderSystemData();
  const [orders, inventory, settings] = await Promise.all([listAdminOrders(), listInventory(), getStoreSettings()]);
  return <div className="admin-shell"><header className="admin-topbar"><div><p className="eyebrow eyebrow--accent">APEX MOTO OWNER</p><h1>Order desk</h1></div><form action={logoutAction}><button className="button button--secondary" type="submit">Sign out</button></form></header>
    <main className="admin-main">
      <section className="admin-section"><div className="admin-section__heading"><div><h2>Orders</h2><p>{orders.length} most recent orders. Stripe-confirmed payment is the fulfilment authority.</p></div></div>
        <div className="admin-orders">{orders.length ? orders.map((order) => <details className={`admin-order${order.cancellationRequested ? " admin-order--urgent" : ""}`} key={order.id} open={order.cancellationRequested}><summary><span><strong>{order.orderNumber}</strong><small>{order.customerName} · {order.customerEmail}</small></span><span><strong>{formatPrice(order.totalAmount)}</strong><small>{orderStatusLabel(order.status)}</small></span></summary>
          <div className="admin-order__body"><div className="admin-order__facts"><p><strong>Created</strong>{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" }).format(new Date(order.createdAt))}</p><p><strong>Fulfilment</strong>{order.fulfilmentLabel}</p>{order.discountAmount > 0 ? <p><strong>Discount</strong>−{formatPrice(order.discountAmount)}{order.promotionCode ? ` · ${order.promotionCode}` : ""}</p> : null}{order.fulfilmentMethodId === "pickup" ? <p><strong>Pickup</strong>{formatPickupDate(order.pickupDate)} · {order.pickupWindow}</p> : <p><strong>Ship to</strong>{order.shippingDetails ? [order.shippingDetails.name, order.shippingDetails.line1, order.shippingDetails.line2, order.shippingDetails.city, order.shippingDetails.state, order.shippingDetails.postalCode, order.shippingDetails.country].filter(Boolean).join(", ") : "Address pending from Stripe"}</p>}</div>
            <div className="admin-order__items">{order.items.map((item) => <p key={item.cartItemKey}><span><strong>{item.quantity} × {item.productName}</strong><small>{item.variantLabel}</small></span><strong>{formatPrice(item.lineTotal)}</strong></p>)}</div>
            {order.cancellationRequested ? <div className="admin-alert"><strong>Cancellation requested</strong><span>Review before preparing or shipping. A refund is not complete until Stripe confirms it.</span></div> : null}
            <div className="admin-actions"><form action={statusAction}><input type="hidden" name="orderId" value={order.id} /><label>Status<select name="nextStatus" defaultValue="" required><option value="" disabled>Choose next status</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><button className="button button--secondary" type="submit">Update status</button></form>
              <form action={retryEmailAction}><input type="hidden" name="orderId" value={order.id} /><button className="button button--secondary" type="submit">Retry failed emails</button></form>
              <form action={refundAction} className="admin-refund"><input type="hidden" name="orderId" value={order.id} /><label>Type {order.orderNumber} to issue a full Stripe refund<input name="confirmation" required autoComplete="off" /></label><button className="button button--danger" type="submit">Full refund</button></form></div>
            <div className="admin-email-status"><strong>Email delivery</strong>{order.emails.length ? order.emails.map((email) => <p key={`${email.kind}:${email.recipient}`}><span>{email.kind.replaceAll("_", " ").toLowerCase()} → {email.recipient}</span><b data-state={email.status}>{email.status} · {email.attempts} attempt{email.attempts === 1 ? "" : "s"}</b>{email.lastError ? <small>{email.lastError}</small> : null}</p>) : <p>No email jobs yet.</p>}</div>
          </div></details>) : <div className="empty-state"><h3>No orders yet.</h3><p>Paid orders will appear here after the signed Stripe webhook confirms them.</p></div>}</div>
      </section>

      <section className="admin-section"><h2>Physical inventory</h2><p>Bundles and individual listings consume these same SKUs. “Reserved” means an open Stripe checkout; “available” is what another customer can buy.</p><div className="admin-inventory">{inventory.map((item) => <form action={inventoryAction} key={item.sku}><input type="hidden" name="sku" value={item.sku} /><label><strong>{item.sku}</strong><small>{item.reserved} reserved · {item.available} available</small></label><input type="number" name="stockOnHand" min={0} max={10000} defaultValue={item.stockOnHand} aria-label={`Stock on hand for ${item.sku}`} /><button className="button button--secondary" type="submit">Save</button></form>)}</div></section>

      <section className="admin-section"><h2>Pickup and support</h2><form action={settingsAction} className="admin-settings"><label><span>Pickup enabled</span><input type="checkbox" name="pickupEnabled" defaultChecked={settings.pickupEnabled} /></label><label>Public location<input name="pickupLocationLabel" defaultValue={settings.pickupLocationLabel} required /></label><label>Address disclosure<textarea name="pickupAddressDisclosure" defaultValue={settings.pickupAddressDisclosure} required rows={3} /></label><label>Next available date<input name="pickupNextAvailableDate" type="date" defaultValue={settings.pickupNextAvailableDate ?? ""} /></label><label>Pickup window<input name="pickupWindow" defaultValue={settings.pickupWindow} required /></label><label><span>Appointment required</span><input type="checkbox" name="pickupAppointmentRequired" defaultChecked={settings.pickupAppointmentRequired} /></label><label><span>Same-day available</span><input type="checkbox" name="pickupSameDayAvailable" defaultChecked={settings.pickupSameDayAvailable} /></label><label>Minimum response hours<input name="supportResponseMinHours" type="number" min={0} defaultValue={settings.supportResponseMinHours} /></label><label>Maximum response hours<input name="supportResponseMaxHours" type="number" min={0} defaultValue={settings.supportResponseMaxHours} /></label><p>The exact private pickup address is only included in order emails when <code>PICKUP_ADDRESS_PRIVATE</code> is configured on Vercel.</p><button className="button button--primary" type="submit">Save store settings</button></form></section>
    </main>
  </div>;
}
