"use client";

import { CheckoutButton } from "@/components/commerce/checkout-button";
import { QuantityControl } from "@/components/commerce/quantity-control";
import { useCart } from "@/components/commerce/cart-provider";
import { ProductVisual } from "@/components/product/product-visual";
import { formatPrice, helmetShippingRegions, siteConfig } from "@/config/site";
import { trackEvent } from "@/lib/analytics";
import { getProductById, getVariantLabel } from "@/lib/products";
import { calculateShipping, cartHasHelmet } from "@/lib/shipping";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { resolvedItems, subtotal, updateQuantity, removeItem, hydrated } = useCart();
  const [shippingMethodId, setShippingMethodId] = useState("");

  useEffect(() => {
    if (hydrated) trackEvent("view_cart", { item_count: resolvedItems.length });
  }, [hydrated, resolvedItems.length]);

  const hasHelmet = cartHasHelmet(resolvedItems);
  const hasStandaloneGoggles = resolvedItems.some((item) => item.product.category === "goggles");
  const shipping = calculateShipping(resolvedItems, shippingMethodId);
  const shippingAmount = shipping.available ? shipping.amount : 0;
  const bundle = getProductById("bundle-helmet-goggles");
  const baseHelmet = getProductById("helmet-matte-black");
  const bundledGogglesPrice = bundle && baseHelmet ? bundle.price - baseHelmet.price : null;

  if (!hydrated) return <div className="page-shell"><div className="empty-state"><p>Loading your cart…</p></div></div>;
  if (!resolvedItems.length) return <div className="page-shell"><div className="empty-state"><ShoppingBag size={42} aria-hidden="true" /><h1>Your cart is empty.</h1><p>Choose a helmet, goggles, or the complete bundle.</p><Link className="button button--primary" href="/shop">Shop the range</Link></div></div>;

  const shippingChoices = hasHelmet
    ? helmetShippingRegions.map((region) => ({
        id: region.id,
        label: region.label,
        detail: region.price === null ? `${region.estimate} estimate — exact quote required` : formatPrice(region.price),
      }))
    : [{ id: "goggles-australia", label: "Australia-wide goggles delivery", detail: formatPrice(siteConfig.gogglesShippingPrice) }];

  return (
    <div className="page-shell cart-page">
      <div className="container page-hero page-hero--compact"><p className="eyebrow eyebrow--accent">YOUR ORDER</p><h1>Cart.</h1><p>Check your options, then choose pickup or delivery.</p></div>
      <div className="container cart-layout">
        <div>
          <div className="cart-lines">
            {resolvedItems.map((item) => (
              <article className="cart-line" key={item.key}>
                <Link href={`/product/${item.product.slug}`} className="cart-line__visual"><ProductVisual product={item.product} /></Link>
                <div className="cart-line__details"><p className="eyebrow">{item.product.category}</p><h2><Link href={`/product/${item.product.slug}`}>{item.product.name}</Link></h2><p>{getVariantLabel(item.product, item.variant)}</p><strong>{formatPrice(item.product.price)}</strong></div>
                <div className="cart-line__actions"><QuantityControl value={item.quantity} max={Math.min(item.variant.stock, 10)} onChange={(quantity) => updateQuantity(item.key, quantity)} label={`Quantity for ${item.product.name}`} /><button type="button" className="remove-button" onClick={() => removeItem(item.key)}><Trash2 size={16} aria-hidden="true" /> Remove</button></div>
                <strong className="cart-line__total">{formatPrice(item.lineTotal)}</strong>
              </article>
            ))}
          </div>
          {hasHelmet && !hasStandaloneGoggles && !resolvedItems.some((item) => item.product.category === "bundle") ? <Link href="/product/orz-helmet-goggles-bundle" className="cart-page-upsell"><span><small>Want the complete setup?</small><strong>{bundledGogglesPrice !== null ? `Add goggles for ${formatPrice(bundledGogglesPrice)} and get the helmet bag free.` : "View the helmet, goggles and bag bundle."}</strong></span><span>View bundle <ArrowRight size={17} aria-hidden="true" /></span></Link> : null}
        </div>

        <aside className="order-summary">
          <h2>Order summary</h2>
          <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
          <div className="shipping-selector">
            <label htmlFor="shipping-method">Pickup or delivery</label>
            <select id="shipping-method" value={shippingMethodId} onChange={(event) => setShippingMethodId(event.target.value)}>
              <option value="">Choose an option</option>
              <option value="pickup">Newport pickup — Free</option>
              {shippingChoices.map((choice) => <option key={choice.id} value={choice.id}>{choice.label} — {choice.detail}</option>)}
            </select>
            {shippingMethodId === "pickup" ? <small>Exact pickup details are arranged after ordering.</small> : null}
          </div>
          <div><span>Shipping</span><strong>{shipping.available ? (shipping.amount === 0 ? "Free" : formatPrice(shipping.amount)) : "Choose above"}</strong></div>
          {shipping.available ? <div className="order-summary__total"><span>Total</span><strong>{formatPrice(subtotal + shippingAmount)}</strong></div> : null}
          {!shipping.available && shippingMethodId ? <p className="form-message form-message--error">{shipping.message} <a href={`mailto:${siteConfig.email}?subject=APEX MOTO shipping quote`}>Email for a quote.</a></p> : null}
          <CheckoutButton shippingMethodId={shippingMethodId} disabled={!shipping.available} />
          <p>Online payment is being connected. You can email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> to order now.</p>
          <Link href="/shop" className="text-link">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
