"use server";

import { authenticateAdmin, endAdminSession, requireAdmin } from "@/lib/admin-auth";
import { deliverPendingEmails } from "@/lib/email";
import { operationalLog } from "@/lib/operational-log";
import { getAdminOrderCheckoutContext, issueAdminRefund, processPaidCheckout, resetFailedEmails, setAdminOrderStatus, setInventoryStock, updateStoreSettings } from "@/lib/orders";
import { checkoutDiscountDetails, checkoutPaymentMethodLabel, retrieveCheckoutSessionForFulfilment, stripeObjectId } from "@/lib/stripe";
import { siteConfig } from "@/config/site";
import type { OrderStatus } from "@/types/order";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "").slice(0, 500);
  let result: Awaited<ReturnType<typeof authenticateAdmin>>;
  try {
    result = await authenticateAdmin(password);
  } catch { redirect("/admin/login?error=config"); }
  if (!result.ok) redirect(`/admin/login?error=${result.rateLimited ? "rate" : "invalid"}`);
  redirect("/admin");
}

export async function logoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}

export async function statusAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "") as OrderStatus;
  const order = await setAdminOrderStatus(orderId, nextStatus);
  if (order) await deliverPendingEmails(order);
  revalidatePath("/admin");
}

export async function retryEmailAction(formData: FormData) {
  await requireAdmin();
  const order = await resetFailedEmails(String(formData.get("orderId") ?? ""));
  if (order) await deliverPendingEmails(order);
  revalidatePath("/admin");
}

export async function reconcilePaidOrderAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const context = await getAdminOrderCheckoutContext(orderId);
  if (!context?.stripeSessionId) throw new Error("This order has no Stripe Checkout Session to verify.");
  const session = await retrieveCheckoutSessionForFulfilment(context.stripeSessionId);
  if (session.metadata?.businessId !== siteConfig.businessId || session.metadata.orderId !== context.orderId) {
    throw new Error("Stripe Checkout does not match this APEX MOTO order.");
  }
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    throw new Error("Stripe has not confirmed this order as paid.");
  }
  const discount = checkoutDiscountDetails(session);
  const result = await processPaidCheckout({
    eventId: `admin-reconcile:${session.id}`,
    eventType: "admin.reconcile_paid_checkout",
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
  const delivery = await deliverPendingEmails(result.order);
  operationalLog(delivery.failed ? "error" : "info", "admin.order_reconciled", {
    businessId: siteConfig.businessId,
    orderId,
    emailsSent: delivery.sent,
    emailsFailed: delivery.failed,
  });
  if (!delivery.configured || delivery.failed) throw new Error("Payment was reconciled, but one or more confirmation emails still need attention.");
  revalidatePath("/admin");
}

export async function refundAction(formData: FormData) {
  await requireAdmin();
  await issueAdminRefund(String(formData.get("orderId") ?? ""), String(formData.get("confirmation") ?? ""));
  revalidatePath("/admin");
}

export async function settingsAction(formData: FormData) {
  await requireAdmin();
  await updateStoreSettings({
    pickupEnabled: formData.get("pickupEnabled") === "on",
    pickupLocationLabel: String(formData.get("pickupLocationLabel") ?? "").slice(0, 200),
    pickupAddressDisclosure: String(formData.get("pickupAddressDisclosure") ?? "").slice(0, 500),
    pickupNextAvailableDate: String(formData.get("pickupNextAvailableDate") ?? "") || null,
    pickupWindow: String(formData.get("pickupWindow") ?? "").slice(0, 300),
    pickupSameDayAvailable: formData.get("pickupSameDayAvailable") === "on",
    pickupAppointmentRequired: formData.get("pickupAppointmentRequired") === "on",
    supportResponseMinHours: Number(formData.get("supportResponseMinHours")),
    supportResponseMaxHours: Number(formData.get("supportResponseMaxHours")),
  });
  revalidatePath("/admin");
  revalidatePath("/cart");
}

export async function inventoryAction(formData: FormData) {
  await requireAdmin();
  await setInventoryStock(String(formData.get("sku") ?? ""), Number(formData.get("stockOnHand")));
  revalidatePath("/admin");
}
