import { getSiteUrl, siteConfig } from "@/config/site";
import { resolveCartItems, sanitiseCartItems } from "@/lib/cart";
import { calculateShipping, type ShippingQuote } from "@/lib/shipping";
import type { CartItemInput } from "@/types/product";
import { NORMALISED_EMAIL, normaliseCustomerEmail, normaliseCustomerName } from "@/lib/order-domain";

export type CheckoutPolicyResult =
  | {
      allowed: true;
      items: ReturnType<typeof resolveCartItems>;
      shipping: Extract<ShippingQuote, { available: true }>;
      customerName: string;
      customerEmail: string;
    }
  | { allowed: false; code: string; message: string };

export function validateCheckoutRequest(
  payload: unknown,
  requestOrigin?: string | null,
  expectedOrigin = getSiteUrl(),
): CheckoutPolicyResult {
  if (!requestOrigin) {
    return { allowed: false, code: "ORIGIN_REQUIRED", message: "Checkout request was not accepted." };
  }
  try {
    if (new URL(requestOrigin).origin !== new URL(expectedOrigin).origin) {
      return { allowed: false, code: "ORIGIN_DENIED", message: "Checkout request was not accepted." };
    }
  } catch {
    return { allowed: false, code: "ORIGIN_INVALID", message: "Checkout request was not accepted." };
  }

  if (!payload || typeof payload !== "object") {
    return { allowed: false, code: "INVALID_BODY", message: "Your cart could not be read." };
  }
  const body = payload as { businessId?: unknown; items?: unknown; shippingMethodId?: unknown; customerName?: unknown; customerEmail?: unknown; pickupAcknowledged?: unknown };
  if (body.businessId !== siteConfig.businessId) {
    return { allowed: false, code: "BUSINESS_SCOPE_DENIED", message: "Your cart could not be verified." };
  }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 25) {
    return { allowed: false, code: "INVALID_ITEMS", message: "Your cart is empty or too large." };
  }
  const originalCount = body.items.length;
  const safeItems = sanitiseCartItems(body.items as CartItemInput[]);
  if (safeItems.length !== originalCount) {
    return { allowed: false, code: "ITEM_REJECTED", message: "One or more cart items are no longer available." };
  }
  const resolved = resolveCartItems(safeItems);
  if (resolved.some((item) => item.quantity > item.variant.stock)) {
    return { allowed: false, code: "STOCK_EXCEEDED", message: "Requested quantity exceeds current stock." };
  }

  const customerName = normaliseCustomerName(body.customerName);
  if (customerName.length < 2) return { allowed: false, code: "NAME_REQUIRED", message: "Enter the name for this order." };
  const customerEmail = normaliseCustomerEmail(body.customerEmail);
  if (!NORMALISED_EMAIL.test(customerEmail)) return { allowed: false, code: "EMAIL_REQUIRED", message: "Enter a valid email for the order confirmation." };

  const shipping = calculateShipping(resolved, body.shippingMethodId);
  if (!shipping.available) {
    return { allowed: false, code: shipping.code, message: shipping.message };
  }

  if (shipping.pickup && body.pickupAcknowledged !== true) return { allowed: false, code: "PICKUP_ACK_REQUIRED", message: "Confirm the pickup date and appointment terms before checkout." };

  return { allowed: true, items: resolved, shipping, customerName, customerEmail };
}
