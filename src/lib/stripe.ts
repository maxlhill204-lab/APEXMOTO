import Stripe from "stripe";
import { StoreConfigurationError } from "@/lib/db";
import { isValidAdminPasscode } from "@/lib/admin-passcode";

export const STRIPE_API_VERSION = "2026-07-29.dahlia" as const;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) throw new StoreConfigurationError("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION, typescript: true });
}

export function checkoutReadiness() {
  const hasEmailProvider = Boolean(process.env.POSTMARK_SERVER_TOKEN?.trim() || process.env.RESEND_API_KEY?.trim());
  const missing = [
    ["DATABASE_URL", process.env.DATABASE_URL],
    ["STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY],
    ["STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET],
    ["ORDER_ACCESS_SECRET", process.env.ORDER_ACCESS_SECRET],
    ["ORDER_EMAIL_FROM", process.env.ORDER_EMAIL_FROM],
  ].filter(([, value]) => !value?.trim()).map(([name]) => name);
  if (!hasEmailProvider) missing.push("TRANSACTIONAL_EMAIL_PROVIDER");
  if ((process.env.ORDER_ACCESS_SECRET?.trim().length ?? 0) < 32) missing.push("ORDER_ACCESS_SECRET_LENGTH");
  return { ready: missing.length === 0, missing };
}

export function ownerOperationsReadiness() {
  const missing = [
    ["ADMIN_PASSWORD", process.env.ADMIN_PASSWORD],
    ["ADMIN_SESSION_SECRET", process.env.ADMIN_SESSION_SECRET],
    ["CRON_SECRET", process.env.CRON_SECRET],
  ].filter(([, value]) => !value?.trim()).map(([name]) => name);
  if ((process.env.ADMIN_SESSION_SECRET?.trim().length ?? 0) < 32) missing.push("ADMIN_SESSION_SECRET_LENGTH");
  if (!isValidAdminPasscode(process.env.ADMIN_PASSWORD)) missing.push("ADMIN_PASSWORD_FORMAT");
  if ((process.env.CRON_SECRET?.trim().length ?? 0) < 16) missing.push("CRON_SECRET_LENGTH");
  return { ready: missing.length === 0, missing };
}

export const stripeObjectId = (value: string | { id: string } | null) =>
  typeof value === "string" ? value : value?.id ?? null;

export async function retrieveCheckoutSessionForFulfilment(sessionId: string) {
  return getStripe().checkout.sessions.retrieve(sessionId, { expand: ["discounts.promotion_code", "payment_intent.payment_method"] });
}

export function checkoutDiscountDetails(session: Stripe.Checkout.Session) {
  const promotion = session.discounts?.find((discount) => discount.promotion_code)?.promotion_code ?? null;
  return {
    discountAmount: session.total_details?.amount_discount ?? 0,
    stripePromotionCodeId: typeof promotion === "string" ? promotion : promotion?.id ?? null,
    promotionCode: typeof promotion === "string" ? null : promotion?.code ?? null,
  };
}

export function checkoutPaymentMethodLabel(session: Stripe.Checkout.Session) {
  const paymentIntent = typeof session.payment_intent === "string" ? null : session.payment_intent;
  const paymentMethod = paymentIntent && typeof paymentIntent.payment_method !== "string" ? paymentIntent.payment_method : null;
  if (!paymentMethod) return null;
  if (paymentMethod.type === "card" && paymentMethod.card) {
    const brand = paymentMethod.card.brand.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    return `${brand} ending in ${paymentMethod.card.last4}`;
  }
  return paymentMethod.type.replaceAll("_", " ");
}
