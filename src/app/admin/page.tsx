import { requireAdmin } from "@/lib/admin-auth";
import Image from "next/image";
import { getOptionLabel, getProductById, getVariantById } from "@/lib/products";
import { formatPrice } from "@/config/site";
import { formatPickupDate, orderStatusLabel } from "@/lib/order-domain";
import { getStoreSettings, initialiseOrderSystemData, listAdminOrders, listInventory } from "@/lib/orders";
import type { OrderStatus } from "@/types/order";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InventoryTable } from "./inventory-table";
import { logoutAction, reconcilePaidOrderAction, refundAction, retryEmailAction, settingsAction, statusAction } from "./actions";

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
  return <div className="admin-shell"><header className="admin-topbar"><div><h1>Order desk</h1></div><form action={logoutAction}><button className="button button--secondary" type="submit">Sign out</button></form></header>
    <main className="admin-main">
      <nav className="admin-jump" aria-label="Order desk sections"><a href="#inventory">Stock on hand</a><a href="#orders">Orders</a><a href="#support-settings">Support settings</a></nav>
      <InventoryTable inventory={inventory} />
      <section className="admin-section" id="orders"><div className="admin-section__heading"><div><h2>Orders</h2><p>{orders.length} most recent orders. Stripe-confirmed payment is the fulfilment authority.</p></div></div>
        <div className="admin-orders">{orders.length ? orders.map((order) => <details className={`admin-order${order.cancellationRequested ? " admin-order--urgent" : ""}`} key={order.id} open={order.cancellationRequested}><summary><span><strong>{order.orderNumber}</strong><small>{order.customerName} · {order.customerEmail}</small></span><span><strong>{formatPrice(order.totalAmount)}</strong><small>{orderStatusLabel(order.status)}</small></span></summary>
          <div className="admin-order__body"><div className="admin-order__facts"><p><strong>Created</strong>{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" }).format(new Date(order.createdAt))}</p><p><strong>Fulfilment</strong>{order.fulfilmentLabel}</p>{order.discountAmount > 0 ? <p><strong>Discount</strong>−{formatPrice(order.discountAmount)}{order.promotionCode ? ` · ${order.promotionCode}` : ""}</p> : null}{order.fulfilmentMethodId === "pickup" ? <p><strong>Pickup</strong>{formatPickupDate(order.pickupDate)} · {order.pickupWindow}</p> : <p><strong>Ship to</strong>{order.shippingDetails ? [order.shippingDetails.name, order.shippingDetails.line1, order.shippingDetails.line2, order.shippingDetails.city, order.shippingDetails.state, order.shippingDetails.postalCode, order.shippingDetails.country].filter(Boolean).join(", ") : "Address pending from Stripe"}</p>}</div>
            <div className="admin-order__items">
              {order.items.map((item) => {
                const product = getProductById(item.productId);
                const variant = product && getVariantById(product, item.variantId);
                const colour = product && variant?.options.colour
                  ? getOptionLabel(product, "colour", variant.options.colour)
                  : undefined;
                const image = product?.images.find((photo) => photo.colour === colour) ?? product?.images[0];
                const bundlePhotos = product?.category === "bundle" && variant
                  ? ["helmet-colour", "goggles"].flatMap((option) => {
                    const label = getOptionLabel(product, option, variant.options[option]);
                    return product.images.filter((photo) => photo.colour === label).slice(0, 1);
                  })
                  : [];

                return (
                  <div className="admin-order-item" key={item.cartItemKey}>
                    <div className="admin-order-item__product">
                      {(bundlePhotos.length ? bundlePhotos : [image]).map((photo) => (
                        photo && !photo.placeholder ? <Image className="admin-product-photo" key={photo.src} src={photo.src} alt="" width={20} height={20} /> : null
                      ))}
                      <span>
                        <strong>{item.quantity} × {product?.name ?? item.productName}</strong>
                        {item.variantLabel && item.variantLabel !== product?.name ? <small>{item.variantLabel.startsWith(product?.name + " · ") ? item.variantLabel.slice((product?.name.length ?? 0) + 3) : item.variantLabel}</small> : null}
                      </span>
                    </div>
                    <strong>{formatPrice(item.lineTotal)}</strong>
                  </div>
                );
              })}
            </div>
            {order.fulfilmentMethodId !== "pickup" ? <div className="admin-email-status"><strong>Shipping record</strong><p><span>{order.shippingCarrier ?? "Legacy delivery"} · {order.shippingServiceCode ?? order.fulfilmentMethodId}</span><b>{order.shippingDestinationCountry} {order.shippingDestinationPostalCode}</b></p><p><span>Quoted parcels</span><b>{order.shippingParcels.length || "Legacy rate"}</b></p>{order.shippingTrackingNumber ? <p><span>Tracking</span><b>{order.shippingTrackingNumber}</b></p> : null}{order.customs ? <>{order.customs.items.map((item) => <p key={`${item.hsTariffCode}:${item.description}`}><span>{item.quantity} × {item.description}<small>HS {item.hsTariffCode} · origin {item.countryOfOrigin} · {item.totalWeightKg} kg</small></span><b>{formatPrice(item.totalValue)}</b></p>)}</> : null}</div> : null}
            {order.shippingAddressReview ? <div className="admin-alert"><strong>Shipping address needs review</strong><span>The country or Australian postcode entered in Stripe does not match the calculated quote. Do not create a label until the address and postage price are checked.</span></div> : null}
            {order.cancellationRequested ? <div className="admin-alert"><strong>Cancellation requested</strong><span>Review before preparing or shipping. A refund is not complete until Stripe confirms it.</span></div> : null}
            <div className="admin-actions"><form action={statusAction}><input type="hidden" name="orderId" value={order.id} /><label>Status<select name="nextStatus" defaultValue="" required><option value="" disabled>Choose next status</option>{statusOptions.filter((option) => option.value !== "READY_FOR_PICKUP" || order.fulfilmentMethodId === "pickup").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><button className="button button--secondary" type="submit">Update status</button></form>
              {order.status === "PENDING_PAYMENT" && order.stripeSessionId ? <form action={reconcilePaidOrderAction}><input type="hidden" name="orderId" value={order.id} /><button className="button button--primary" type="submit">Verify Stripe payment + send confirmation</button></form> : null}
              <form action={retryEmailAction}><input type="hidden" name="orderId" value={order.id} /><button className="button button--secondary" type="submit">Retry failed emails</button></form>
              <form action={refundAction} className="admin-refund"><input type="hidden" name="orderId" value={order.id} /><label>Type {order.orderNumber} to issue a full Stripe refund<input name="confirmation" required autoComplete="off" /></label><button className="button button--danger" type="submit">Full refund</button></form></div>
            <div className="admin-email-status"><strong>Email delivery</strong>{order.emails.length ? order.emails.map((email) => <p key={`${email.kind}:${email.recipient}`}><span>{email.kind.replaceAll("_", " ").toLowerCase()} → {email.recipient}</span><b data-state={email.status}>{email.status} · {email.attempts} attempt{email.attempts === 1 ? "" : "s"}</b>{email.lastError ? <small>{email.lastError}</small> : null}</p>) : <p>No email jobs yet.</p>}</div>
          </div></details>) : <div className="empty-state"><h3>No orders yet.</h3><p>Paid orders will appear here after the signed Stripe webhook confirms them.</p></div>}</div>
      </section>

      <section className="admin-section" id="support-settings"><h2>Support settings</h2><form action={settingsAction} className="admin-settings"><label>Minimum response hours<input name="supportResponseMinHours" type="number" min={0} defaultValue={settings.supportResponseMinHours} /></label><label>Maximum response hours<input name="supportResponseMaxHours" type="number" min={0} defaultValue={settings.supportResponseMaxHours} /></label><button className="button button--primary" type="submit">Save store settings</button></form></section>
    </main>
  </div>;
}
