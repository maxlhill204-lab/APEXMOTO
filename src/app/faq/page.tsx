import type { Metadata } from "next";
import { formatPrice, siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Frequently asked questions", description: "APEX MOTO answers about pickup, shipping, helmet sizing, goggles, and bundles.", alternates: { canonical: "/faq" } };

const faqs = [
  ["Where can I pick up?", `Pickup is available in ${siteConfig.pickupSuburb}, Melbourne. Exact details are arranged directly.`],
  ["How much is goggle shipping?", `${formatPrice(siteConfig.gogglesShippingPrice)} Australia-wide when ordered alone. Up to three standalone pairs add no cost when travelling with a helmet.`],
  ["What comes in the bundle?", "One ORZ helmet, one pair of ORZ goggles in your selected colour, and a free helmet storage bag."],
  ["How do I choose my size?", "Measure above your eyebrows and around the widest part at the back of your head, then use the ORZ size chart."],
  ["Which helmet sizes are available?", "Matte black currently has one each in S, M, L and XL. Gloss white is sold out in S, L and XL; check the product page for current selectable stock."],
  ["Is the helmet DOT marked?", "The supplied product image shows a rear DOT FMVSS No. 218 marking. That does not by itself confirm Australian road legality or event approval."],
] as const;

export default function FaqPage() {
  return <div className="page-shell content-page"><div className="container page-hero"><p className="eyebrow eyebrow--accent">QUICK ANSWERS</p><h1>FAQ.</h1><p>The useful details, without the runaround.</p></div><div className="container faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{String(index + 1).padStart(2, "0")}</span><strong>{question}</strong><i aria-hidden="true">+</i></summary><p>{answer}</p></details>)}</div></div>;
}
