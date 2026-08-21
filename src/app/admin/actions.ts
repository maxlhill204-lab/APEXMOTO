"use server";

import { authenticateAdmin, endAdminSession, requireAdmin } from "@/lib/admin-auth";
import { deliverPendingEmails } from "@/lib/email";
import { issueAdminRefund, resetFailedEmails, setAdminOrderStatus, setInventoryStock, updateStoreSettings } from "@/lib/orders";
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
