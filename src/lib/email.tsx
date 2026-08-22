import { getSql } from "@/lib/db";
import { createOrderAccessToken } from "@/lib/order-access";
import { operationalLog } from "@/lib/operational-log";
import { OrderEmail } from "@/emails/order-email";
import type { EmailKind, PublicOrder } from "@/types/order";
import { siteConfig } from "@/config/site";
import { render } from "@react-email/render";
import { Models, ServerClient } from "postmark";
import { MAX_EMAIL_ATTEMPTS } from "@/lib/email-policy";

export function configuredEmailFrom() {
  const explicit = process.env.ORDER_EMAIL_FROM?.trim();
  return explicit || null;
}

export const isEmailConfigured = () => Boolean(
  configuredEmailFrom()
  && (process.env.POSTMARK_SERVER_TOKEN?.trim() || process.env.RESEND_API_KEY?.trim()),
);

function providerError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "Email provider error";
}

async function sendWithResend(input: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      reply_to: siteConfig.email,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await response.json().catch(() => null) as { id?: string; message?: string } | null;
  if (!response.ok || !payload?.id) {
    throw new Error(payload?.message?.slice(0, 400) || `Resend returned HTTP ${response.status}.`);
  }
  return payload.id;
}

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
  const postmarkApiKey = process.env.POSTMARK_SERVER_TOKEN?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const from = configuredEmailFrom();
  if ((!postmarkApiKey && !resendApiKey) || !from) return { sent: 0, failed: 0, configured: false };
  const sql = getSql();
  const pending = await sql`
    SELECT id, email_kind, recipient
    FROM email_outbox
    WHERE business_id = ${businessId} AND order_id = ${order.id}
      AND status IN ('PENDING', 'FAILED')
      AND attempts < ${MAX_EMAIL_ATTEMPTS}
      AND next_attempt_at <= now()
    ORDER BY created_at
  `;
  const postmark = postmarkApiKey ? new ServerClient(postmarkApiKey) : null;
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
      const subject = emailSubject(kind, order.orderNumber);
      let providerMessageId: string | null = null;
      let postmarkFailure: string | null = null;

      if (postmark) {
        try {
          const response = await postmark.sendEmail({
            From: from,
            To: String(row.recipient),
            ReplyTo: siteConfig.email,
            Subject: subject,
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
          providerMessageId = `postmark:${response.MessageID}`;
        } catch (error) {
          postmarkFailure = providerError(error);
          operationalLog("warn", "email.postmark_failed_using_fallback", { businessId, orderId: order.id, kind });
        }
      }

      if (!providerMessageId && resendApiKey) {
        const resendId = await sendWithResend({
          apiKey: resendApiKey,
          from,
          to: String(row.recipient),
          subject,
          html: htmlBody,
          text: textBody,
          idempotencyKey: `apexmoto/${businessId}/${String(row.id)}`,
        });
        providerMessageId = `resend:${resendId}`;
      }

      if (!providerMessageId) throw new Error(postmarkFailure || "No email provider accepted the message.");
      await sql`UPDATE email_outbox SET status = 'SENT', provider_message_id = ${providerMessageId}, sent_at = now(), last_error = null WHERE business_id = ${businessId} AND id = ${String(row.id)}`;
      sent += 1;
    } catch (error) {
      const message = providerError(error);
      await sql`
        UPDATE email_outbox
        SET status = 'FAILED', last_error = ${message},
          next_attempt_at = now() + CASE attempts
            WHEN 1 THEN interval '5 minutes'
            WHEN 2 THEN interval '30 minutes'
            WHEN 3 THEN interval '2 hours'
            WHEN 4 THEN interval '6 hours'
            WHEN 5 THEN interval '24 hours'
            WHEN 6 THEN interval '48 hours'
            ELSE interval '72 hours'
          END
        WHERE business_id = ${businessId} AND id = ${String(row.id)}
      `;
      operationalLog("error", "email.delivery_failed", { businessId, orderId: order.id, kind });
      failed += 1;
    }
  }
  return { sent, failed, configured: true };
}
