import type { Metadata } from "next";
import { AlertCircle, FileCheck2, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "ORZ helmet information",
  description: "APEX MOTO information about the supplied ORZ helmet specifications, DOT marking, fit, condition, and intended use.",
  alternates: { canonical: "/safety" },
};

export default function SafetyPage() {
  return (
    <div className="page-shell content-page">
      <div className="container page-hero"><p className="eyebrow eyebrow--accent">HELMET INFORMATION</p><h1>Ride informed.</h1><p>The supplied ORZ product image shows a rear DOT FMVSS No. 218 marking. Check the requirements that apply to where you intend to ride.</p></div>
      <div className="container information-cards">
        <article><FileCheck2 aria-hidden="true" /><h2>DOT marking shown</h2><p>The rear label visible in the owner-supplied image reads DOT FMVSS No. 218. No separate certification document or approval number has been supplied.</p></article>
        <article><ShieldCheck aria-hidden="true" /><h2>Use matters</h2><p>A DOT marking does not by itself confirm Australian road legality, club eligibility, or approval for a specific event. Check the rules for your intended use.</p></article>
        <article><AlertCircle aria-hidden="true" /><h2>Fit and condition</h2><p>Choose a firm, correct fit. Replace protective equipment after a significant impact or when damage, wear, or age means it should no longer be relied on.</p></article>
      </div>
    </div>
  );
}
