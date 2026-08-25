export type AnalyticsEventName =
  | "view_product"
  | "select_colour"
  | "select_size"
  | "add_to_cart"
  | "view_cart"
  | "shipping_quote"
  | "begin_checkout"
  | "purchase"
  | "click_contact"
  | "view_size_guide";

export function trackEvent(
  name: AnalyticsEventName,
  detail: Record<string, string | number | boolean | undefined> = {},
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("apex-moto:analytics", { detail: { name, ...detail } }));
  // No analytics provider is loaded by default. This event boundary keeps the
  // storefront functional and privacy-conscious until the owner opts in.
}
