import type { Metadata } from "next";
import { formatPrice, helmetShippingRegions, siteConfig } from "@/config/site";
import { MapPin, Truck } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping and Newport pickup",
  description: "APEX MOTO delivery prices for helmets and goggles, plus Newport pickup.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
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
          <p className="fine-print">Orders begin dispatching from 2 September 2026. Regional Queensland and Western Australia require an exact address quote before payment.</p>
        </section>
        <aside className="shipping-notes">
          <article><p className="eyebrow eyebrow--accent">GOGGLES ONLY</p><h2>{formatPrice(siteConfig.gogglesShippingPrice)}</h2><p>Flat Australia-wide shipping when goggles are ordered without a helmet.</p></article>
          <article><p className="eyebrow eyebrow--accent">WITH A HELMET</p><h2>No extra cost</h2><p>Up to three standalone goggles can travel with a helmet at the helmet delivery price. Larger goggle quantities need a quote.</p></article>
          <article><MapPin aria-hidden="true" /><p className="eyebrow eyebrow--accent">LOCAL</p><h2>Free pickup</h2><p>Pickup begins 2 September 2026 in {siteConfig.pickupSuburb}. Exact pickup details are arranged directly.</p></article>
        </aside>
      </div>
    </div>
  );
}
