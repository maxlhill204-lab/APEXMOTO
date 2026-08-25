import type { Metadata } from "next";
import { formatPrice, helmetShippingRegions, siteConfig } from "@/config/site";
import { MapPin, Truck } from "lucide-react";
import { calculatedShippingReadiness, configuredShippingCountries } from "@/config/shipping";

export const metadata: Metadata = {
  title: "Shipping and Newport pickup",
  description: "APEX MOTO delivery prices for helmets and goggles, plus Newport pickup.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  const readiness = calculatedShippingReadiness();
  if (readiness.domesticReady) {
    const countries = configuredShippingCountries().filter((country) => country.code !== "AU");
    return (
      <div className="page-shell content-page">
        <div className="container page-hero">
          <p className="eyebrow eyebrow--accent">WORLDWIDE DELIVERY</p>
          <h1>Shipping.</h1>
          <p>Australia Post delivery is calculated from your destination, parcel size, parcel weight and the products in your cart. You see the exact shipping charge before payment.</p>
        </div>
        <div className="container shipping-layout">
          <section>
            <div className="shipping-layout__heading"><Truck aria-hidden="true" /><div><p className="eyebrow">AUSTRALIA POST</p><h2>Calculated delivery</h2></div></div>
            <div className="shipping-price-list">
              <div><span>Australia</span><strong>Postcode-based</strong></div>
              {readiness.internationalReady ? <><div><span>New Zealand, United Kingdom and Germany</span><strong>Available</strong></div><div><span>Europe and other major destinations</span><strong>Available</strong></div></> : null}
            </div>
            <p className="fine-print">Available services and prices are requested from Australia Post for the parcel or parcels in your order. International availability can vary by destination and product restrictions.</p>
            {readiness.internationalReady ? <p className="fine-print">Currently enabled: {countries.map((country) => country.name).join(", ")}.</p> : null}
          </section>
          <aside className="shipping-notes">
            <article><p className="eyebrow eyebrow--accent">BEFORE PAYMENT</p><h2>Know the total</h2><p>Enter the destination country and postal code in your cart, choose an Australia Post service, then continue to Stripe with that country locked to the quote.</p></article>
            <article><p className="eyebrow eyebrow--accent">INTERNATIONAL</p><h2>Customs-ready</h2><p>International orders retain the shipping service, parcel data and customs item details needed for fulfilment. Destination duties and import taxes are not included unless explicitly shown.</p></article>
            <article><MapPin aria-hidden="true" /><p className="eyebrow eyebrow--accent">LOCAL</p><h2>Free pickup</h2><p>Pickup remains available by appointment in {siteConfig.pickupSuburb}. It is only offered separately from delivery.</p></article>
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
