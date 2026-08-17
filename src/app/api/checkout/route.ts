import { getSiteUrl, siteConfig } from "@/config/site";
import { validateCheckoutRequest } from "@/lib/checkout-policy";
import Stripe from "stripe";

export const runtime = "nodejs";

const jsonError = (message: string, status: number) =>
  Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return jsonError("Checkout expects a JSON cart.", 415);
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32_000) return jsonError("Checkout request is too large.", 413);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Your cart could not be read.", 400);
  }

  const policy = validateCheckoutRequest(payload, request.headers.get("origin"), getSiteUrl());
  if (!policy.allowed) {
    const status = policy.code === "PRICE_NOT_CONFIGURED" ? 503 : 400;
    return jsonError(policy.message, status);
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    return jsonError("Online payment is being connected. Please contact APEX MOTO to order now.", 503);
  }

  const requestKey = request.headers.get("x-checkout-idempotency-key")?.trim();
  if (!requestKey || !/^[0-9a-f-]{36}$/i.test(requestKey)) {
    return jsonError("Checkout request needs a valid retry key.", 400);
  }

  const siteUrl = getSiteUrl();
  const stripe = new Stripe(secretKey);
  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: policy.items.map((item) => ({
          price: item.variant.stripePriceId!,
          quantity: item.quantity,
        })),
        billing_address_collection: "auto",
        ...(policy.shipping.pickup
          ? {}
          : {
              shipping_address_collection: { allowed_countries: ["AU"] as ["AU"] },
              shipping_options: [
                {
                  shipping_rate_data: {
                    type: "fixed_amount" as const,
                    fixed_amount: { amount: policy.shipping.amount, currency: "aud" },
                    display_name: policy.shipping.label,
                  },
                },
              ],
            }),
        customer_creation: "always",
        allow_promotion_codes: true,
        success_url: `${siteUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/cart?checkout=cancelled`,
        metadata: {
          businessId: siteConfig.businessId,
          cartSchema: "v2",
          fulfilmentMethod: policy.shipping.methodId,
        },
      },
      { idempotencyKey: `${siteConfig.businessId}:${requestKey}` },
    );
    if (!session.url) return jsonError("Stripe did not provide a checkout link.", 502);
    return Response.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("Secure checkout could not be started. Please try again or contact us.", 502);
  }
}
