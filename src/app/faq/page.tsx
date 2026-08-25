import type { Metadata } from "next";
import { formatPrice, siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Frequently asked questions", description: "APEX MOTO answers about pickup, shipping, helmet sizing, goggles, and bundles.", alternates: { canonical: "/faq" } };

const faqs = [
  ["Why are APEX MOTO prices lower?", "We keep the range tight, sell directly and avoid the retail layers and prestige pricing built around larger labels. You are paying for the product, fulfilment and local support—not a famous logo."],
  ["Do you claim these helmets match an $800 helmet?", "No. Price alone does not prove protection, and we do not invent comparison claims. We publish the supplied materials, approximate weight and visible marking, then clearly explain what has not been independently documented."],
  ["Where can I pick up?", `Pickup is available in ${siteConfig.pickupSuburb}, Melbourne. Exact details are arranged directly.`],
  ["How much is goggle shipping?", `${formatPrice(siteConfig.gogglesShippingPrice)} Australia-wide when ordered alone. Up to three standalone pairs add no cost when travelling with a helmet.`],
  ["What comes in the bundle?", "One APEX MOTO helmet, one pair of APEX MOTO goggles in your selected colour, and a free helmet storage bag."],
  ["How do I choose my size?", "Measure above your eyebrows and around the widest part at the back of your head, then use the APEX MOTO size chart."],
  ["Which helmet sizes are available?", "Matte black currently has one each in S, M, L and XL. Gloss white is sold out in S, L and XL; check the product page for current selectable stock."],
  ["Is the helmet DOT marked?", "The supplied product image shows a rear DOT FMVSS No. 218 marking. That does not by itself confirm Australian road legality or event approval."],
] as const;

export default function FaqPage() {
  return <div className="page-shell content-page"><div className="container page-hero"><p className="eyebrow eyebrow--accent">STRAIGHT ANSWERS</p><h1>FAQ.</h1><p>No smoke, no inflated claims and no runaround.</p></div><div className="container faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{String(index + 1).padStart(2, "0")}</span><strong>{question}</strong><i aria-hidden="true">+</i></summary><p>{answer}</p></details>)}</div></div>;
}
