import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { CheckCircle2, CircleAlert } from "lucide-react";
import Link from "next/link";
import Stripe from "stripe";

export const metadata: Metadata = { title: "Order status", description: "Check whether an APEX MOTO Stripe Checkout session has been confirmed.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Verification = "confirmed" | "pending" | "unverified";

async function verifySession(sessionId?: string): Promise<Verification> {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey || !sessionId || !/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) return "unverified";
  try {
    const session = await new Stripe(secretKey).checkout.sessions.retrieve(sessionId);
    if (session.metadata?.businessId !== siteConfig.businessId) return "unverified";
    if (session.payment_status === "paid" || session.payment_status === "no_payment_required") return "confirmed";
    return "pending";
  } catch {
    return "unverified";
  }
}

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const status = await verifySession(sessionId);
  const confirmed = status === "confirmed";
  return <div className="page-shell status-page"><div className={`status-card status-card--${status}`}>{confirmed ? <CheckCircle2 aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}<p className="eyebrow">Order status</p><h1>{confirmed ? "Order received." : status === "pending" ? "Payment pending." : "Order not verified."}</h1><p>{confirmed ? "Thank you. The store will use the contact details from checkout for fulfilment and next steps." : status === "pending" ? "Stripe has not marked this payment as complete. Check again later or contact the store if you need help." : "This page only confirms orders through a valid Stripe Checkout session. Opening the URL directly does not create or confirm an order."}</p><div className="button-row"><Link className="button button--primary" href="/">Back home</Link><Link className="button button--secondary" href="/contact">Contact</Link></div></div></div>;
}
