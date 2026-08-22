import { siteConfig } from "@/config/site";
import { deliverPendingEmails } from "@/lib/email";
import { operationalLog } from "@/lib/operational-log";
import { processPaidCheckout, processRefundEvent, processTerminalCheckout, recordIgnoredWebhook } from "@/lib/orders";
import { checkoutDiscountDetails, checkoutPaymentMethodLabel, getStripe, retrieveCheckoutSessionForFulfilment, stripeObjectId } from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY?.trim() || !process.env.DATABASE_URL?.trim()) {
    return Response.json({ state: "NOT_CONFIGURED" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ state: "SIGNATURE_REQUIRED" }, { status: 400 });
  if (Number(request.headers.get("content-length") ?? 0) > 1_000_000) return Response.json({ state: "PAYLOAD_TOO_LARGE" }, { status: 413 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return Response.json({ state: "SIGNATURE_INVALID" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const eventSession = event.data.object;
      if (eventSession.metadata?.businessId !== siteConfig.businessId) {
        await recordIgnoredWebhook(event.id, event.type);
        return Response.json({ state: "VERIFIED_IGNORED" });
      }
      const session = await retrieveCheckoutSessionForFulfilment(eventSession.id);
      if (session.metadata?.businessId !== siteConfig.businessId) {
        await recordIgnoredWebhook(event.id, event.type);
        return Response.json({ state: "VERIFIED_IGNORED" });
      }
      if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
        await recordIgnoredWebhook(event.id, event.type);
        return Response.json({ state: "VERIFIED_AWAITING_PAYMENT" });
      }
      const discount = checkoutDiscountDetails(session);
      const result = await processPaidCheckout({
        eventId: event.id,
        eventType: event.type,
        sessionId: session.id,
        clientReferenceId: session.client_reference_id,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        discountAmount: discount.discountAmount,
        promotionCode: discount.promotionCode,
        stripePromotionCodeId: discount.stripePromotionCodeId,
        paymentMethodLabel: checkoutPaymentMethodLabel(session),
        currency: session.currency,
        paymentIntentId: stripeObjectId(session.payment_intent),
        customerId: stripeObjectId(session.customer),
        shippingDetails: session.collected_information?.shipping_details
          ? JSON.parse(JSON.stringify(session.collected_information.shipping_details)) as Record<string, unknown>
          : null,
      });
      const email = await deliverPendingEmails(result.order);
      operationalLog("info", "stripe.order_confirmed", { businessId: siteConfig.businessId, orderId: result.order.id, duplicate: result.duplicate, emailsSent: email.sent, emailsFailed: email.failed });
      if (email.failed > 0) return Response.json({ state: "EMAIL_RETRY_REQUIRED" }, { status: 500 });
      return Response.json({ state: "PROCESSED" });
    }
    if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object;
      if (session.metadata?.businessId === siteConfig.businessId) {
        await processTerminalCheckout(event.id, event.type, session.id, session.client_reference_id, event.type === "checkout.session.expired" ? "EXPIRED" : "PAYMENT_FAILED");
      } else {
        await recordIgnoredWebhook(event.id, event.type);
      }
      return Response.json({ state: "PROCESSED" });
    }
    if (event.type === "refund.updated") {
      const refund = event.data.object;
      const order = await processRefundEvent({
        eventId: event.id,
        eventType: event.type,
        refundId: refund.id,
        paymentIntentId: stripeObjectId(refund.payment_intent),
        amount: refund.amount,
        status: refund.status,
      });
      if (order) {
        const email = await deliverPendingEmails(order);
        if (email.failed > 0) return Response.json({ state: "EMAIL_RETRY_REQUIRED" }, { status: 500 });
      }
      return Response.json({ state: "PROCESSED" });
    }
    await recordIgnoredWebhook(event.id, event.type);
    return Response.json({ state: "VERIFIED_IGNORED" });
  } catch (error) {
    operationalLog("error", "stripe.webhook_processing_failed", { businessId: siteConfig.businessId, eventId: event.id, eventType: event.type, errorType: error instanceof Error ? error.name : "UnknownError" });
    return Response.json({ state: "RETRY_REQUIRED" }, { status: 500 });
  }
}
