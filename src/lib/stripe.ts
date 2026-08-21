import Stripe from "stripe";
import { StoreConfigurationError } from "@/lib/db";

export const STRIPE_API_VERSION = "2026-07-29.dahlia" as const;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) throw new StoreConfigurationError("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION, typescript: true });
}

export function checkoutReadiness() {
  const missing = [
    ["DATABASE_URL", process.env.DATABASE_URL],
    ["STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY],
    ["STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET],
    ["ORDER_ACCESS_SECRET", process.env.ORDER_ACCESS_SECRET],
    ["RESEND_API_KEY", process.env.RESEND_API_KEY],
    ["ORDER_EMAIL_FROM", process.env.ORDER_EMAIL_FROM],
    ["ADMIN_PASSWORD", process.env.ADMIN_PASSWORD],
    ["ADMIN_SESSION_SECRET", process.env.ADMIN_SESSION_SECRET],
    ["CRON_SECRET", process.env.CRON_SECRET],
  ].filter(([, value]) => !value?.trim()).map(([name]) => name);
  if ((process.env.ORDER_ACCESS_SECRET?.trim().length ?? 0) < 32) missing.push("ORDER_ACCESS_SECRET_LENGTH");
  if ((process.env.ADMIN_SESSION_SECRET?.trim().length ?? 0) < 32) missing.push("ADMIN_SESSION_SECRET_LENGTH");
  if ((process.env.ADMIN_PASSWORD?.trim().length ?? 0) < 12) missing.push("ADMIN_PASSWORD_LENGTH");
  if ((process.env.CRON_SECRET?.trim().length ?? 0) < 16) missing.push("CRON_SECRET_LENGTH");
  return { ready: missing.length === 0, missing };
}

export const stripeObjectId = (value: string | { id: string } | null) =>
  typeof value === "string" ? value : value?.id ?? null;
