"use client";

import { CheckoutButton } from "@/components/commerce/checkout-button";
import { QuantityControl } from "@/components/commerce/quantity-control";
import { useCart } from "@/components/commerce/cart-provider";
import { ProductVisual } from "@/components/product/product-visual";
import { formatPrice, helmetShippingRegions, siteConfig } from "@/config/site";
import { cartQuantityLimit } from "@/lib/cart";
import { trackEvent } from "@/lib/analytics";
import { getProductById, getVariantLabel } from "@/lib/products";
import { calculateShipping, cartHasHelmet } from "@/lib/shipping";
import type { ShippingPublicConfig, ShippingQuoteOption } from "@/types/shipping";
import { ArrowRight, LoaderCircle, MailCheck, PackageCheck, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const legacyShippingConfig: ShippingPublicConfig = {
  mode: "legacy", provider: "Australia Post", originCountry: "AU",
  countries: [{ code: "AU", name: "Australia", priority: true }],
  internationalEnabled: false, message: null,
};

export default function CartPage() {
  const { items, resolvedItems, subtotal, updateQuantity, removeItem, hydrated } = useCart();
  const [legacyMethodId, setLegacyMethodId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingConfig, setShippingConfig] = useState<ShippingPublicConfig>(legacyShippingConfig);
  const [destinationPostalCode, setDestinationPostalCode] = useState("");
  const [quotes, setQuotes] = useState<ShippingQuoteOption[]>([]);
  const [quoteContext, setQuoteContext] = useState("");
  const [selectedQuoteToken, setSelectedQuoteToken] = useState("");
  const [quoteStatus, setQuoteStatus] = useState<"idle" | "loading" | "error">("idle");
  const [quoteMessage, setQuoteMessage] = useState("");

  useEffect(() => {
    if (hydrated) trackEvent("view_cart", { item_count: resolvedItems.length });
  }, [hydrated, resolvedItems.length]);

  useEffect(() => {
    let active = true;
    fetch("/api/shipping/config")
      .then((response) => response.ok ? response.json() as Promise<ShippingPublicConfig> : null)
      .then((config) => { if (active && config) setShippingConfig(config); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const cartSignature = useMemo(
    () => resolvedItems.map((item) => `${item.key}:${item.quantity}`).sort().join("|"),
    [resolvedItems],
  );
  const hasHelmet = cartHasHelmet(resolvedItems);
  const hasStandaloneGoggles = resolvedItems.some((item) => item.product.category === "goggles");
  const currentQuoteContext = `${cartSignature}|${destinationPostalCode.trim().toUpperCase()}`;
  const validQuotes = quoteContext === currentQuoteContext ? quotes : [];
  const selectedQuote = validQuotes.find((quote) => quote.token === selectedQuoteToken) ?? null;
  const legacyShipping = calculateShipping(resolvedItems, legacyMethodId);
  const shippingAvailable = shippingConfig.mode === "calculated" ? Boolean(selectedQuote) : legacyShipping.available;
  const shippingAmount = shippingConfig.mode === "calculated"
    ? selectedQuote?.amount ?? 0
    : legacyShipping.available ? legacyShipping.amount : 0;
  const shippingMethodId = selectedQuote?.methodId ?? legacyMethodId;
  const shippingLabel = selectedQuote?.label ?? (legacyShipping.available ? legacyShipping.label : "Delivery");
  const bundle = getProductById("bundle-helmet-goggles");
  const baseHelmet = getProductById("helmet-matte-black");
  const bundledGogglesPrice = bundle && baseHelmet ? bundle.price - baseHelmet.price : null;

  const requestShippingQuote = async () => {
    if (quoteStatus === "loading") return;
    const postalCode = destinationPostalCode.trim();
    if (!/^\d{4}$/.test(postalCode)) {
      setQuoteStatus("error");
      setQuoteMessage("Enter a valid four-digit Australian postcode.");
      document.getElementById("destination-postal-code")?.focus();
      return;
    }
    setQuoteStatus("loading");
    setQuoteMessage("");
    setQuotes([]);
    setSelectedQuoteToken("");
    const requestedContext = currentQuoteContext;
    try {
      const response = await fetch("/api/shipping/quote", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: siteConfig.businessId, items, destination: { country: "AU", postalCode } }),
      });
      const data = await response.json() as { quotes?: ShippingQuoteOption[]; message?: string };
      if (!response.ok || !data.quotes?.length) throw new Error(data.message || "No delivery service is available for that destination.");
      setQuotes(data.quotes);
      setQuoteContext(requestedContext);
      setSelectedQuoteToken(data.quotes[0].token);
      setQuoteStatus("idle");
      trackEvent("shipping_quote", { destination_country: "AU", option_count: data.quotes.length });
    } catch (error) {
      setQuoteStatus("error");
      setQuoteMessage(error instanceof Error ? error.message : "Delivery could not be calculated right now.");
    }
  };

  if (!hydrated) return <div className="page-shell"><div className="empty-state"><p>Loading your cart…</p></div></div>;
  if (!resolvedItems.length) return <div className="page-shell"><div className="empty-state"><ShoppingBag size={42} aria-hidden="true" /><h1>Your cart is empty.</h1><p>Choose a helmet, goggles, or the complete bundle.</p><Link className="button button--primary" href="/shop">Shop the range</Link></div></div>;

  const legacyChoices = hasHelmet
    ? helmetShippingRegions.map((region) => ({ id: region.id, label: region.label, detail: region.price === null ? `${region.estimate} estimate — exact quote required` : formatPrice(region.price) }))
    : [{ id: "goggles-australia", label: "Australia-wide goggles delivery", detail: formatPrice(siteConfig.gogglesShippingPrice) }];

  return (
    <div className="page-shell cart-page">
      <div className="container page-hero page-hero--compact"><p className="eyebrow eyebrow--accent">YOUR ORDER</p><h1>Cart.</h1><p>Get your Australian postage price before payment.</p></div>
      <div className="container cart-layout">
        <div>
          <div className="cart-lines">
            {resolvedItems.map((item) => (
              <article className="cart-line" key={item.key}>
                <Link href={`/product/${item.product.slug}`} className="cart-line__visual"><ProductVisual product={item.product} /></Link>
                <div className="cart-line__details"><p className="eyebrow">{item.product.category}</p><h2><Link href={`/product/${item.product.slug}`}>{item.product.name}</Link></h2><p>{getVariantLabel(item.product, item.variant)}</p><strong>{formatPrice(item.product.price)}</strong></div>
                <div className="cart-line__actions"><QuantityControl value={item.quantity} max={cartQuantityLimit(item.product, item.variant)} onChange={(quantity) => updateQuantity(item.key, quantity)} label={`Quantity for ${item.product.name}`} /><button type="button" className="remove-button" onClick={() => removeItem(item.key)}><Trash2 size={16} aria-hidden="true" /> Remove</button></div>
                <strong className="cart-line__total">{formatPrice(item.lineTotal)}</strong>
              </article>
            ))}
          </div>
          {hasHelmet && !hasStandaloneGoggles && !resolvedItems.some((item) => item.product.category === "bundle") ? <Link href="/product/apex-moto-helmet-goggles-bundle" className="cart-page-upsell"><span><small>Want the complete setup?</small><strong>{bundledGogglesPrice !== null ? `Add goggles for ${formatPrice(bundledGogglesPrice)} and get the helmet bag free.` : "View the helmet, goggles and bag bundle."}</strong></span><span>View bundle <ArrowRight size={17} aria-hidden="true" /></span></Link> : null}
        </div>

        <aside className="order-summary">
          <h2>Order summary</h2>
          {resolvedItems.some((item) => item.variant.preorder) ? <p>Orders with preorder items are expected to dispatch in 7–14 days. Allow an estimated 3–5 business days for delivery after dispatch.</p> : null}
          <div className="order-summary__row"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
          <div className="shipping-selector">
            <h3 className="shipping-selector__label">Australia-wide postage</h3>
            {shippingConfig.mode === "calculated" ? <div className="calculated-shipping">
              <div className="shipping-destination-grid">
                <label htmlFor="destination-postal-code">Australian postcode</label>
                <input id="destination-postal-code" autoComplete="postal-code" value={destinationPostalCode} onChange={(event) => setDestinationPostalCode(event.target.value)} placeholder="e.g. 3000" inputMode="numeric" maxLength={4} />
              </div>
              <button className="button button--secondary button--wide" type="button" onClick={requestShippingQuote} disabled={quoteStatus === "loading"}>{quoteStatus === "loading" ? <><LoaderCircle className="spin" size={17} aria-hidden="true" /> Calculating with Australia Post…</> : "Calculate delivery"}</button>
              {quoteMessage ? <p className="form-message form-message--error" role="alert">{quoteMessage}</p> : null}
              {validQuotes.length ? <div className="shipping-rate-options" role="radiogroup" aria-label="Australia Post delivery services">
                {validQuotes.map((quote) => <label key={quote.token} className={selectedQuoteToken === quote.token ? "is-selected" : ""}><input type="radio" name="shipping-rate" checked={selectedQuoteToken === quote.token} onChange={() => setSelectedQuoteToken(quote.token)} /><PackageCheck size={18} aria-hidden="true" /><span><strong>{quote.label}</strong><small>{quote.deliveryEstimate ?? `${quote.parcelCount} ${quote.parcelCount === 1 ? "parcel" : "parcels"}`}</small></span><b>{formatPrice(quote.amount)}</b></label>)}
              </div> : null}
              <p className="shipping-helper">Your full delivery address is collected securely in Stripe. Use the same postcode as your delivery address.</p>
            </div> : null}

            {shippingConfig.mode === "legacy" ? <div className="legacy-shipping">
              <label htmlFor="shipping-method">Delivery area</label>
              <select id="shipping-method" value={legacyMethodId} onChange={(event) => setLegacyMethodId(event.target.value)}>
                <option value="">Choose an option</option>
                {legacyChoices.map((choice) => <option key={choice.id} value={choice.id}>{choice.label} — {choice.detail}</option>)}
              </select>
            </div> : null}
          </div>
          <div className="checkout-contact">
            <h3>Confirmation details</h3>
            <p><MailCheck aria-hidden="true" size={17} /> Your receipt, exact order and next steps are sent here automatically after Stripe confirms payment.</p>
            <label htmlFor="customer-name">Full name</label>
            <input id="customer-name" name="name" autoComplete="name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Name for this order" required />
            <label htmlFor="customer-email">Email</label>
            <input id="customer-email" name="email" type="email" autoComplete="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="order-summary__row"><span>Shipping</span><strong>{shippingAvailable ? (shippingAmount === 0 ? "Free" : formatPrice(shippingAmount)) : shippingConfig.mode === "calculated" ? "Calculate above" : "Choose above"}</strong></div>
          {shippingAvailable ? <div className="order-summary__total"><span>Total</span><strong>{formatPrice(subtotal + shippingAmount)}</strong></div> : null}
          {shippingConfig.mode === "legacy" && !legacyShipping.available && legacyMethodId ? <p className="form-message form-message--error">{legacyShipping.message} <a href={`mailto:${siteConfig.email}?subject=APEX MOTO shipping quote`}>Email for a quote.</a></p> : null}
          <CheckoutButton shippingMethodId={shippingMethodId} shippingQuoteToken={shippingConfig.mode === "calculated" ? selectedQuoteToken : undefined} customerName={customerName} customerEmail={customerEmail} disabled={!shippingAvailable} />
          <p>{shippingAvailable ? `${shippingLabel} is included in the total above. ` : ""}Secure checkout opens with Stripe. Have a discount code? Enter it on the Stripe payment screen. Payment is only accepted when our order record, stock allocation and confirmation emails are all available. Need help? Email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>. Replies are normally within 12–48 hours.</p>
          <Link href="/shop" className="text-link">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
