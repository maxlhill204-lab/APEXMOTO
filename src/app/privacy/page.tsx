import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy", description: "How the APEX MOTO storefront handles cart, contact, checkout, and technical data.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return <div className="page-shell content-page"><div className="container page-hero"><p className="eyebrow eyebrow--accent">Information handling</p><h1>Privacy.</h1><p>A practical small-business privacy template limited to the data this project actually uses.</p></div><article className="container prose prose--narrow legal-copy">
    <section><h2>What this site may collect</h2><p>The cart is stored on your device and contains product and variant identifiers plus quantities. If the contact form is configured and you use it, the store receives your name, email address, selected topic, and message. If checkout is configured, Stripe receives the contact, address, and payment information you provide in its hosted checkout.</p></section>
    <section><h2>How information is used</h2><p>Information is used to answer enquiries, arrange pickup, fulfil orders, provide customer support, prevent obvious form abuse, and meet applicable operational or legal obligations.</p></section>
    <section><h2>Analytics and technical data</h2><p>No analytics provider is configured by default. The hosting platform may process routine request, security, and diagnostic data needed to deliver the website. If the owner enables analytics later, this notice should be updated before collection begins.</p></section>
    <section><h2>Sharing</h2><p>Information is shared only with service providers needed to operate the store, such as hosting and payment providers when configured, or where required by law. The project does not include a customer-data sale feature.</p></section>
    <section><h2>Access and questions</h2><p>Contact {siteConfig.businessName} at <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> to ask about personal information held by the store.</p></section>
    <aside className="inline-notice"><strong>Owner verification required</strong><p>Confirm the final privacy wording, contact email, hosting arrangement, retention practices, and every optional provider before taking real orders.</p></aside>
  </article></div>;
}
