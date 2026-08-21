import { getSql } from "@/lib/db";
import { createOrderAccessToken } from "@/lib/order-access";
import { operationalLog } from "@/lib/operational-log";
import { OrderEmail } from "@/emails/order-email";
import type { EmailKind, PublicOrder } from "@/types/order";
import { siteConfig } from "@/config/site";
import { Resend } from "resend";

export const isEmailConfigured = () => Boolean(
  process.env.RESEND_API_KEY?.trim() && process.env.ORDER_EMAIL_FROM?.trim(),
);

function emailSubject(kind: EmailKind, orderNumber: string) {
  const subjects: Record<EmailKind, string> = {
    CUSTOMER_ORDER_CONFIRMATION: `${orderNumber} — payment confirmed`,
    OWNER_NEW_ORDER: `New paid order ${orderNumber}`,
    CUSTOMER_CANCELLATION_RECEIVED: `${orderNumber} — cancellation request received`,
    OWNER_CANCELLATION_REQUEST: `${orderNumber} — cancellation requested`,
    CUSTOMER_READY_FOR_PICKUP: `${orderNumber} is ready for pickup`,
    CUSTOMER_SHIPPED: `${orderNumber} has shipped`,
    CUSTOMER_REFUNDED: `${orderNumber} — refund confirmed`,
  };
  return subjects[kind];
}

export async function deliverPendingEmails(order: PublicOrder, businessId = siteConfig.businessId) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ORDER_EMAIL_FROM?.trim();
  if (!apiKey || !from) return { sent: 0, failed: 0, configured: false };
  const sql = getSql();
  const pending = await sql`
    SELECT id, email_kind, recipient
    FROM email_outbox
    WHERE business_id = ${businessId} AND order_id = ${order.id}
      AND status IN ('PENDING', 'FAILED') AND attempts < 5
    ORDER BY created_at
  `;
  const resend = new Resend(apiKey);
  let sent = 0;
  let failed = 0;
  for (const row of pending) {
    const claimed = await sql`
      UPDATE email_outbox SET status = 'SENDING', attempts = attempts + 1
      WHERE business_id = ${businessId} AND id = ${String(row.id)} AND status IN ('PENDING', 'FAILED')
      RETURNING id
    `;
    if (!claimed.length) continue;
    const kind = String(row.email_kind) as EmailKind;
    try {
      const response = await resend.emails.send({
        from,
        to: String(row.recipient),
        replyTo: siteConfig.email,
        subject: emailSubject(kind, order.orderNumber),
        react: <OrderEmail
          kind={kind}
          order={order}
          accessToken={createOrderAccessToken(businessId, order.id, order.customerEmail)}
          privatePickupAddress={process.env.PICKUP_ADDRESS_PRIVATE?.trim()}
        />,
      }, { idempotencyKey: `${businessId}/${order.id}/${kind}` });
      if (response.error) throw new Error(response.error.message);
      await sql`UPDATE email_outbox SET status = 'SENT', provider_message_id = ${response.data?.id ?? null}, sent_at = now(), last_error = null WHERE business_id = ${businessId} AND id = ${String(row.id)}`;
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Email provider error";
      await sql`UPDATE email_outbox SET status = 'FAILED', last_error = ${message}, next_attempt_at = now() + interval '5 minutes' WHERE business_id = ${businessId} AND id = ${String(row.id)}`;
      operationalLog("error", "email.delivery_failed", { businessId, orderId: order.id, kind });
      failed += 1;
    }
  }
  return { sent, failed, configured: true };
}
