import type { Metadata } from "next";
import { formatPrice, helmetShippingRegions, siteConfig } from "@/config/site";
import { Truck } from "lucide-react";
import { calculatedShippingReadiness } from "@/config/shipping";

export const metadata: Metadata = {
  title: "Australia-wide postage",
  description: "APEX MOTO postage for helmets, goggles and bundles within Australia.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  const readiness = calculatedShippingReadiness();
  if (readiness.domesticReady) {
    return (
      <div className="page-shell content-page">
        <div className="container page-hero">
          <p className="eyebrow eyebrow--accent">AUSTRALIA-WIDE POSTAGE</p>
          <h1>Shipping.</h1>
          <p>Australia Post delivery is calculated from your destination, parcel size, parcel weight and the products in your cart. You see the exact shipping charge before payment.</p>
        </div>
        <div className="container shipping-layout">
          <section>
            <div className="shipping-layout__heading"><Truck aria-hidden="true" /><div><p className="eyebrow">AUSTRALIA POST</p><h2>Calculated delivery</h2></div></div>
            <div className="shipping-price-list">
              <div><span>Australia</span><strong>Postcode-based</strong></div>
            </div>
            <p className="fine-print">Available services and prices are requested from Australia Post for the parcel or parcels in your order.</p>
          </section>
          <aside className="shipping-notes">
            <article><p className="eyebrow eyebrow--accent">BEFORE PAYMENT</p><h2>Know the total</h2><p>Enter your Australian postcode in the cart, choose an Australia Post service, then enter the matching delivery address in Stripe.</p></article>
          </aside>
        </div>
      </div>
    );
  }
  return (
    <div className="page-shell content-page">
      <div className="container page-hero">
        <p className="eyebrow eyebrow--accent">DELIVERY</p>
        <h1>Shipping.</h1>
        <p>Simple prices based on what you order and where it is going.</p>
      </div>
      <div className="container shipping-layout">
        <section>
          <div className="shipping-layout__heading"><Truck aria-hidden="true" /><div><p className="eyebrow">HELMETS</p><h2>Helmet delivery</h2></div></div>
          <div className="shipping-price-list">
            {helmetShippingRegions.map((region) => (
              <div key={region.id}><span>{region.label}</span><strong>{region.price === null ? `${region.estimate} estimate` : formatPrice(region.price)}</strong></div>
            ))}
          </div>
          <p className="fine-print">Dispatch timing is confirmed with your order. For regional Queensland, regional Western Australia, or any area without a listed price, <a className="text-link" href={`mailto:${siteConfig.email}?subject=APEX%20MOTO%20postage%20quote`}>email us for a quote</a> before payment.</p>
        </section>
        <aside className="shipping-notes">
          <article><p className="eyebrow eyebrow--accent">GOGGLES ONLY</p><h2>{formatPrice(siteConfig.gogglesShippingPrice)}</h2><p>Flat Australia-wide shipping when goggles are ordered without a helmet.</p></article>
          <article><p className="eyebrow eyebrow--accent">WITH A HELMET</p><h2>No extra cost</h2><p>Up to three standalone goggles can travel with a helmet at the helmet delivery price. Larger goggle quantities need a quote.</p></article>
        </aside>
      </div>
    </div>
  );
}
