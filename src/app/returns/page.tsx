import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Returns and size exchanges", description: "APEX MOTO change-of-mind, sizing exchange, and faulty-item information for Australian customers.", alternates: { canonical: "/returns" } };

export default function ReturnsPage() {
  return (
    <div className="page-shell content-page"><div className="container page-hero"><p className="eyebrow eyebrow--accent">Store policy</p><h1>Returns.</h1><p>Please check sizing and return conditions with APEX MOTO before ordering.</p></div><article className="container prose prose--narrow">
      <section><p className="eyebrow">Change of mind</p><h2>Owner confirmation required.</h2><p>{siteConfig.changeOfMindReturns ? "Change-of-mind returns are available subject to the final published conditions." : "The store’s change-of-mind period and item-condition requirements have not been confirmed yet. Contact the store before ordering if this affects your decision."}</p></section>
      <section><p className="eyebrow">Sizing exchanges</p><h2>Check before you order.</h2><p>{siteConfig.sizingExchanges ? "Sizing exchanges are available subject to stock and the final published conditions." : "Sizing exchange terms have not been confirmed. Use the size guide and ask about the exact product before purchasing."}</p></section>
      <section><p className="eyebrow">Faulty or incorrect items</p><h2>Applicable consumer rights still apply.</h2><p>If an item is faulty, damaged on arrival, or not what was ordered, contact the store promptly with the order details and clear photos where relevant. Nothing in this policy is intended to exclude rights that apply under Australian Consumer Law.</p></section>
      <aside className="inline-notice"><strong>Questions?</strong><p>Email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> before ordering.</p></aside>
    </article></div>
  );
}
