import { helmetShippingRegions, siteConfig } from "@/config/site";
import type { ResolvedCartItem } from "@/types/product";

export type ShippingQuote =
  | {
      available: true;
      methodId: string;
      label: string;
      amount: number;
      pickup: boolean;
    }
  | {
      available: false;
      code: "SHIPPING_REQUIRED" | "SHIPPING_QUOTE_REQUIRED" | "SHIPPING_METHOD_INVALID";
      message: string;
    };

export const cartHasHelmet = (items: ResolvedCartItem[]) =>
  items.some((item) => item.product.category === "helmet" || item.product.category === "bundle");

export const standaloneGoggleQuantity = (items: ResolvedCartItem[]) =>
  items
    .filter((item) => item.product.category === "goggles")
    .reduce((total, item) => total + item.quantity, 0);

export function calculateShipping(
  items: ResolvedCartItem[],
  methodId: unknown,
): ShippingQuote {
  if (typeof methodId !== "string" || !methodId.trim()) {
    return {
      available: false,
      code: "SHIPPING_REQUIRED",
      message: "Choose pickup or a delivery area before checkout.",
    };
  }

  if (methodId === "pickup") {
    return {
      available: true,
      methodId,
      label: `${siteConfig.pickupSuburb} pickup`,
      amount: 0,
      pickup: true,
    };
  }

  const hasHelmet = cartHasHelmet(items);
  const goggleQuantity = standaloneGoggleQuantity(items);

  if (!hasHelmet) {
    if (methodId !== "goggles-australia") {
      return {
        available: false,
        code: "SHIPPING_METHOD_INVALID",
        message: "Choose the Australia-wide goggles delivery option.",
      };
    }
    return {
      available: true,
      methodId,
      label: "Goggles delivery — Australia-wide",
      amount: siteConfig.gogglesShippingPrice,
      pickup: false,
    };
  }

  if (goggleQuantity > siteConfig.maxIncludedGogglesWithHelmet) {
    return {
      available: false,
      code: "SHIPPING_QUOTE_REQUIRED",
      message: `Orders with more than ${siteConfig.maxIncludedGogglesWithHelmet} standalone goggles and a helmet need a shipping quote.`,
    };
  }

  const region = helmetShippingRegions.find((item) => item.id === methodId);
  if (!region) {
    return {
      available: false,
      code: "SHIPPING_METHOD_INVALID",
      message: "Choose a listed helmet delivery area.",
    };
  }
  if (region.quoteRequired || region.price === null) {
    return {
      available: false,
      code: "SHIPPING_QUOTE_REQUIRED",
      message: `${region.label} delivery needs an exact address quote before payment.`,
    };
  }

  return {
    available: true,
    methodId,
    label: `${region.label} delivery`,
    amount: region.price,
    pickup: false,
  };
}
