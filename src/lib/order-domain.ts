import { catalog, getVariantLabel } from "@/lib/products";
import type { ResolvedCartItem } from "@/types/product";
import type { OrderItemSnapshot, OrderStatus, StoreSettings } from "@/types/order";

export const RESERVATION_MINUTES = 35;
export const NORMALISED_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normaliseCustomerName = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 120) : "";

export const normaliseCustomerEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";

export function inventoryRequirements(items: ResolvedCartItem[]) {
  const totals = new Map<string, number>();
  for (const item of items) {
    for (const requirement of item.variant.inventory) {
      totals.set(requirement.sku, (totals.get(requirement.sku) ?? 0) + requirement.quantity * item.quantity);
    }
  }
  return [...totals].map(([sku, quantity]) => ({ sku, quantity })).sort((a, b) => a.sku.localeCompare(b.sku));
}

export function catalogueInventorySeed() {
  const stock = new Map<string, number>();
  for (const product of catalog.filter((item) => item.category !== "bundle")) {
    for (const variant of product.variants) {
      for (const requirement of variant.inventory) {
        const units = Math.floor(variant.stock / requirement.quantity);
        stock.set(requirement.sku, Math.max(stock.get(requirement.sku) ?? 0, units));
      }
    }
  }
  return [...stock].map(([sku, stockOnHand]) => ({ sku, stockOnHand })).sort((a, b) => a.sku.localeCompare(b.sku));
}

export function snapshotOrderItems(items: ResolvedCartItem[]): OrderItemSnapshot[] {
  return items.map((item) => ({
    productId: item.product.id,
    variantId: item.variant.id,
    productName: item.product.name,
    variantLabel: getVariantLabel(item.product, item.variant),
    unitAmount: item.product.price,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
    cartItemKey: item.key,
  }));
}

export const orderStatusLabel = (status: OrderStatus) => ({
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid — order received",
  PREPARING: "Preparing your order",
  READY_FOR_PICKUP: "Ready for pickup",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
  CANCELLATION_REQUESTED: "Cancellation requested",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  PAYMENT_FAILED: "Payment failed",
  EXPIRED: "Checkout expired",
})[status];

export function formatPickupDate(value: string | null) {
  if (!value) return "To be confirmed";
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeZone: "Australia/Melbourne" })
    .format(new Date(`${value}T12:00:00+10:00`));
}

export function settingsFallback(config: {
  pickupLocationLabel: string;
  pickupExactAddressDisclosure: string;
  pickupNextAvailableDate: string;
  pickupWindow: string;
  pickupSameDayAvailable: boolean;
  pickupAppointmentRequired: boolean;
  supportResponseHoursMin: number;
  supportResponseHoursMax: number;
}): StoreSettings {
  return {
    pickupEnabled: true,
    pickupLocationLabel: config.pickupLocationLabel,
    pickupAddressDisclosure: config.pickupExactAddressDisclosure,
    pickupNextAvailableDate: config.pickupNextAvailableDate,
    pickupWindow: config.pickupWindow,
    pickupSameDayAvailable: config.pickupSameDayAvailable,
    pickupAppointmentRequired: config.pickupAppointmentRequired,
    supportResponseMinHours: config.supportResponseHoursMin,
    supportResponseMaxHours: config.supportResponseHoursMax,
  };
}
