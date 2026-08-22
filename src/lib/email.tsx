import { getSql } from "@/lib/db";
import { createOrderAccessToken } from "@/lib/order-access";
import { operationalLog } from "@/lib/operational-log";
import { OrderEmail } from "@/emails/order-email";
import type { EmailKind, PublicOrder } from "@/types/order";
import { siteConfig } from "@/config/site";
import { render } from "@react-email/render";
import { Models, ServerClient } from "postmark";

export function configuredEmailFrom() {
  const explicit = process.env.ORDER_EMAIL_FROM?.trim();
  return explicit || null;
}

export const isEmailConfigured = () => Boolean(process.env.POSTMARK_SERVER_TOKEN?.trim() && configuredEmailFrom());

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
  const apiKey = process.env.POSTMARK_SERVER_TOKEN?.trim();
  const from = configuredEmailFrom();
  if (!apiKey || !from) return { sent: 0, failed: 0, configured: false };
  const sql = getSql();
  const pending = await sql`
    SELECT id, email_kind, recipient
    FROM email_outbox
    WHERE business_id = ${businessId} AND order_id = ${order.id}
      AND status IN ('PENDING', 'FAILED') AND attempts < 5
    ORDER BY created_at
  `;
  const postmark = new ServerClient(apiKey);
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
      const email = <OrderEmail
          kind={kind}
          order={order}
          accessToken={createOrderAccessToken(businessId, order.id, order.customerEmail)}
          privatePickupAddress={process.env.PICKUP_ADDRESS_PRIVATE?.trim()}
        />;
      const [htmlBody, textBody] = await Promise.all([
        render(email),
        render(email, { plainText: true }),
      ]);
      const response = await postmark.sendEmail({
        From: from,
        To: String(row.recipient),
        ReplyTo: siteConfig.email,
        Subject: emailSubject(kind, order.orderNumber),
        HtmlBody: htmlBody,
        TextBody: textBody,
        MessageStream: "outbound",
        TrackOpens: false,
        TrackLinks: Models.LinkTrackingOptions.None,
        Metadata: {
          business_id: businessId,
          order_id: order.id,
          email_kind: kind,
          outbox_id: String(row.id),
        },
      });
      await sql`UPDATE email_outbox SET status = 'SENT', provider_message_id = ${response.MessageID}, sent_at = now(), last_error = null WHERE business_id = ${businessId} AND id = ${String(row.id)}`;
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
