import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secretKey || !webhookSecret) {
    return Response.json({ state: "NOT_CONFIGURED" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ state: "SIGNATURE_REQUIRED" }, { status: 400 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1_000_000) return Response.json({ state: "PAYLOAD_TOO_LARGE" }, { status: 413 });

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = new Stripe(secretKey).webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return Response.json({ state: "SIGNATURE_INVALID" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    // Signature verification is complete. Phase 1 intentionally has no database
    // transaction, so this handler does not claim inventory was decremented.
    return Response.json({ state: "VERIFIED_NO_INVENTORY_MUTATION" });
  }
  if (event.type === "checkout.session.async_payment_succeeded") {
    return Response.json({ state: "VERIFIED_NO_INVENTORY_MUTATION" });
  }
  return Response.json({ state: "VERIFIED_IGNORED" });
}
