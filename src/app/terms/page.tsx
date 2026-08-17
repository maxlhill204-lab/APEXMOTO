import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Terms", description: "APEX MOTO order, pricing, stock, fulfilment, and product information terms.", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return <div className="page-shell content-page"><div className="container page-hero"><p className="eyebrow eyebrow--accent">Store terms</p><h1>Terms.</h1><p>Straightforward conditions that must be completed with the owner’s verified business details before launch.</p></div><article className="container prose prose--narrow legal-copy">
    <section><h2>Store identity</h2><p>This storefront operates as {siteConfig.businessName}. Contact <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> for order and product enquiries. Legal entity and ABN details remain to be added before online payment opens.</p></section>
    <section><h2>Products, pricing, and stock</h2><p>Prices are shown in Australian dollars. Stock is recorded at variant level in the catalogue, but phase-one inventory is repository-managed rather than transactional. An item is not reserved until payment is confirmed. If a stock error occurs, the store will contact the customer and provide an appropriate resolution.</p></section>
    <section><h2>Orders and payment</h2><p>Guest checkout is used; no account is required. Payment is processed through Stripe only after the integration is configured. An order is accepted when payment is confirmed and the store can fulfil it. The store may contact a customer if information needs clarification.</p></section>
    <section><h2>Shipping and pickup</h2><p>Australia-wide shipping and {siteConfig.pickupSuburb}-area pickup are available as listed on the shipping page. Address-based regional estimates require an exact quote before payment. Dispatch timing, pickup arrangements, and tracking details are confirmed with the order.</p></section>
    <section><h2>Product information and intended use</h2><p>Customers should review the exact product listing and choose equipment appropriate for their intended use. Certification or approval information is displayed only when verified for that exact product. The absence of a claim must not be treated as an approval.</p></section>
    <section><h2>Returns and consumer rights</h2><p>The returns page sets out the provisional store policy. Nothing in these terms is intended to exclude rights that cannot lawfully be excluded, including applicable rights under Australian Consumer Law.</p></section>
    <aside className="inline-notice"><strong>Not ready for legal publication</strong><p>The owner must verify business identity, support details, fulfilment, returns, and any advice appropriate to the actual business before launch.</p></aside>
  </article></div>;
}
