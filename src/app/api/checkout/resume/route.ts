import { getResumableCheckout, releaseCheckoutOrder } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).origin !== new URL(request.url).origin) return json({ message: "Request not accepted." }, 403);
  } catch {
    return json({ message: "Request not accepted." }, 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ message: "JSON required." }, 415);
  let body: { orderNumber?: unknown; token?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ message: "Request not accepted." }, 400);
  }
  if (typeof body.orderNumber !== "string" || body.orderNumber.length > 40 || typeof body.token !== "string" || body.token.length > 100) {
    return json({ message: "Request not accepted." }, 400);
  }

  try {
    const order = await getResumableCheckout(body.orderNumber, body.token);
    if (!order) return json({ terminal: true, message: "That checkout could not be found." }, 404);
    if (order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED") {
      return json({ confirmed: true, terminal: true, message: "This order has already been paid. Do not pay again." }, 409);
    }
    if (order.status !== "PENDING_PAYMENT") {
      return json({ terminal: true, message: "That checkout has ended. Start a new checkout from your cart." }, 410);
    }
    if (!order.stripeSessionId) {
      await releaseCheckoutOrder(order.orderId, "CHECKOUT_MISSING_SESSION_ON_RESUME");
      return json({ terminal: true, message: "That checkout has ended. Start a new checkout from your cart." }, 410);
    }

    const session = await getStripe().checkout.sessions.retrieve(order.stripeSessionId);
    if (session.status === "open" && session.metadata?.checkoutFlowVersion !== "card-address-v2") {
      await getStripe().checkout.sessions.expire(session.id);
      await releaseCheckoutOrder(order.orderId, "CHECKOUT_REPLACED_FOR_PRIVACY_UPDATE");
      return json({ terminal: true, message: "Your previous checkout was safely closed. A fresh card form is being prepared." }, 410);
    }
    if (session.status === "open" && session.url) return json({ url: session.url, resumed: true });
    if (session.status === "complete") {
      return json({ confirmed: false, terminal: false, message: "Your payment is being confirmed. Do not pay again." }, 409);
    }
    await releaseCheckoutOrder(order.orderId, "CHECKOUT_EXPIRED_ON_RESUME");
    return json({ terminal: true, message: "That checkout expired. Start a new checkout from your cart." }, 410);
  } catch {
    return json({ message: "Your existing checkout could not be checked. No payment was taken. Please try again." }, 503);
  }
}
