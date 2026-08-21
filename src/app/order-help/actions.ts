"use server";

import { requestOrderCancellation } from "@/lib/orders";
import { redirect } from "next/navigation";

export async function submitCancellationRequest(formData: FormData) {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim().slice(0, 40);
  const token = String(formData.get("token") ?? "").trim().slice(0, 100);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  if (!/^APX-[A-Z0-9-]+$/.test(orderNumber) || !/^[A-Za-z0-9_-]{43}$/.test(token)) redirect("/order-help?state=invalid");
  const order = await requestOrderCancellation(orderNumber, token, reason);
  if (!order) redirect("/order-help?state=unavailable");
  redirect(`/order-help?order=${encodeURIComponent(orderNumber)}&token=${encodeURIComponent(token)}&state=requested`);
}
