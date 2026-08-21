import { getSiteUrl } from "@/config/site";
import { getAccessibleOrder } from "@/lib/orders";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).origin !== new URL(getSiteUrl()).origin) return Response.json({ message: "Request not accepted." }, { status: 403 });
  } catch { return Response.json({ message: "Request not accepted." }, { status: 403 }); }
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ message: "JSON required." }, { status: 415 });
  let body: { orderNumber?: unknown; token?: unknown };
  try { body = await request.json() as typeof body; } catch { return Response.json({ message: "Request not accepted." }, { status: 400 }); }
  if (typeof body.orderNumber !== "string" || body.orderNumber.length > 40 || typeof body.token !== "string" || body.token.length > 100) return Response.json({ message: "Request not accepted." }, { status: 400 });
  try {
    const order = await getAccessibleOrder(body.orderNumber, body.token);
    if (!order) return Response.json({ found: false }, { status: 404, headers: { "Cache-Control": "no-store" } });
    return Response.json({ found: true, status: order.status, paymentStatus: order.paymentStatus, confirmed: order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED", terminal: ["EXPIRED", "PAYMENT_FAILED", "CANCELLED"].includes(order.status) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ message: "Order status is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
