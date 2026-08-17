import type { Metadata } from "next";
import { publicContactEmail } from "@/config/site";
import { sizeCharts } from "@/config/size-guide";
import { ArrowRight, Ruler } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Motocross helmet size guide",
  description: "Measure your head correctly and use the verified manufacturer chart for the exact motocross helmet you want.",
  alternates: { canonical: "/size-guide" },
};

export default function SizeGuidePage() {
  const email = publicContactEmail();
  const verifiedCharts = sizeCharts.filter((chart) => chart.verified && chart.rows.length);
  return (
    <div className="page-shell content-page">
      <div className="container page-hero"><p className="eyebrow eyebrow--accent">Fit first</p><h1>Size guide.</h1><p>Helmet sizing is product-specific. Measure carefully, then compare against the verified manufacturer chart for the exact helmet.</p></div>
      <div className="container content-grid">
        <article className="prose">
          <p className="eyebrow">How to measure</p><h2>Measure once.<br />Order right.</h2>
          <ol className="measure-steps">
            <li><span>01</span><div><h3>Use a flexible tape</h3><p>A fabric measuring tape works best. Keep it flat and comfortably firm, not tight.</p></div></li>
            <li><span>02</span><div><h3>Find the widest point</h3><p>Measure around the widest part of your head, approximately above the eyebrows and around the back.</p></div></li>
            <li><span>03</span><div><h3>Check the number</h3><p>Take the measurement more than once. Use the largest consistent result.</p></div></li>
            <li><span>04</span><div><h3>Use the exact chart</h3><p>Compare with the manufacturer chart shown for the product you are buying. Do not assume sizes match across models.</p></div></li>
          </ol>
        </article>
        <aside className="head-measure-card"><div className="head-diagram" role="img" aria-label="Diagram showing a tape around the widest part of a head"><span className="head-diagram__head" /><span className="head-diagram__tape" /><Ruler aria-hidden="true" /></div><p>Place the tape above the eyebrows and level around the back of the head.</p></aside>
      </div>
      <section className="container chart-section">
        <p className="eyebrow">Verified product charts</p>
        {verifiedCharts.length ? verifiedCharts.map((chart) => <div key={chart.productId} className="size-table-wrap"><h2>{chart.manufacturer}</h2><table><thead><tr><th>Size</th><th>Head measurement</th></tr></thead><tbody>{chart.rows.map((row) => <tr key={row.size}><td>{row.size}</td><td>{row.minCm}–{row.maxCm} cm</td></tr>)}</tbody></table></div>) : <div className="notice-card"><Ruler aria-hidden="true" /><div><h2>Sizing chart pending product verification</h2><p>Contact us with your head measurement and the product you’re interested in. No universal centimetre chart has been invented for these starter products.</p>{email ? <a className="text-link" href={`mailto:${email}?subject=Sizing question`}>Ask about sizing <ArrowRight size={16} aria-hidden="true" /></a> : <Link className="text-link" href="/contact">View contact options <ArrowRight size={16} aria-hidden="true" /></Link>}</div></div>}
      </section>
    </div>
  );
}
