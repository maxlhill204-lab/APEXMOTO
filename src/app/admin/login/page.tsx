import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAction } from "../actions";

export const metadata: Metadata = { title: "Owner sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdminAuthenticated().catch(() => false)) redirect("/admin");
  const { error } = await searchParams;
  const message = error === "rate" ? "Too many attempts. Wait 15 minutes before trying again." : error === "config" ? "Owner access is not configured yet. Complete the production setup first." : error ? "That password was not accepted." : "";
  return <div className="page-shell admin-login"><form action={loginAction} className="admin-login__card"><p className="eyebrow eyebrow--accent">APEX MOTO OWNER</p><h1>Order desk.</h1><p>Private access to customer orders, fulfilment, stock, email delivery and refunds.</p><label htmlFor="admin-password">Six-digit owner passcode</label><input id="admin-password" name="password" type="password" inputMode="numeric" pattern="[0-9]{6}" autoComplete="current-password" required minLength={6} maxLength={6} />{message ? <p className="form-message form-message--error" role="alert">{message}</p> : null}<button className="button button--primary button--wide" type="submit">Sign in</button></form></div>;
}
