import { siteConfig } from "@/config/site";
import { getAccessibleOrder } from "@/lib/orders";
import { CircleAlert, Mail, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { submitCancellationRequest } from "./actions";

export const metadata: Metadata = { title: "Order help", description: "Get help with an APEX MOTO order or request cancellation." };
export const dynamic = "force-dynamic";

export default async function OrderHelpPage({ searchParams }: { searchParams: Promise<{ order?: string; token?: string; state?: string }> }) {
  const params = await searchParams;
  let order = null;
  try { if (params.order && params.token) order = await getAccessibleOrder(params.order, params.token); } catch { order = null; }
  return <div className="page-shell"><div className="container page-hero page-hero--compact"><p className="eyebrow eyebrow--accent">ORDER SUPPORT</p><h1>Need a change?</h1><p>Use your private order link for the fastest route. A cancellation request is not a refund until APEX MOTO confirms it.</p></div>
    <div className="container support-grid">
      <section className="support-card"><RotateCcw aria-hidden="true" /><h2>Request cancellation</h2>
        {params.state === "requested" ? <div className="notice notice--success"><strong>Request received.</strong><p>We have emailed an acknowledgement. The order is not automatically cancelled or refunded; we will review it and reply within {siteConfig.supportResponseHoursMin}–{siteConfig.supportResponseHoursMax} hours.</p></div> : order ? <form action={submitCancellationRequest} className="support-form"><input type="hidden" name="orderNumber" value={order.orderNumber} /><input type="hidden" name="token" value={params.token} /><p><strong>{order.orderNumber}</strong><br />Current status: {order.status.replaceAll("_", " ").toLowerCase()}</p><label htmlFor="cancel-reason">What would you like us to know? <small>(optional)</small></label><textarea id="cancel-reason" name="reason" maxLength={1000} rows={5} /><button className="button button--primary" type="submit">Send cancellation request</button></form> : <div className="notice"><CircleAlert aria-hidden="true" /><p>Open the private “View order status” link in your confirmation email, then choose Order help. This protects your order details.</p></div>}
      </section>
      <section className="support-card"><Mail aria-hidden="true" /><h2>Contact APEX MOTO</h2><p>Email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> with your order number. Typical response time is {siteConfig.supportResponseHoursMin}–{siteConfig.supportResponseHoursMax} hours.</p><p>If your order has already shipped, cancellation may no longer be possible. Your rights under Australian Consumer Law are not excluded.</p><Link className="button button--secondary" href="/returns">Returns policy</Link></section>
    </div>
  </div>;
}
