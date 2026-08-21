import { deliverPendingEmails } from "@/lib/email";
import { getOrderById, listDueEmailOrderIds } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ state: "UNAUTHORIZED" }, { status: 401 });
  let sent = 0;
  let failed = 0;
  for (const orderId of await listDueEmailOrderIds()) {
    const order = await getOrderById(orderId);
    if (!order) continue;
    const result = await deliverPendingEmails(order);
    sent += result.sent;
    failed += result.failed;
  }
  return Response.json({ state: failed ? "RETRY_REMAINS" : "COMPLETE", sent, failed }, { status: failed ? 500 : 200 });
}
