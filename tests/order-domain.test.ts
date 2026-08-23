import { beforeAll, describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site";
import { resolveCartItems } from "@/lib/cart";
import { catalogueInventorySeed, inventoryRequirements, orderStatusLabel, pickupAvailableDate, reconcileStripeCheckoutTotal } from "@/lib/order-domain";
import { createOrderAccessToken, verifyOrderAccessToken } from "@/lib/order-access";
import { isValidAdminPasscode } from "@/lib/admin-passcode";
import { checkoutDiscountDetails, checkoutPaymentMethodLabel } from "@/lib/stripe";
import type Stripe from "stripe";

beforeAll(() => { process.env.ORDER_ACCESS_SECRET = "TEST_ORDER_ACCESS_SECRET_0123456789_ABCDEFGHIJ"; });

describe("order and inventory rules", () => {
  it("makes a bundle reserve both underlying physical SKUs", () => {
    const items = resolveCartItems([{ businessId: siteConfig.businessId, productId: "bundle-helmet-goggles", variantId: "bundle-black-m-black-gold", quantity: 1 }]);
    expect(inventoryRequirements(items)).toEqual([
      { sku: "orz-goggles-black-gold", quantity: 1 },
      { sku: "orz-helmet-black-m", quantity: 1 },
    ]);
  });

  it("seeds physical inventory from standalone products without double-counting bundles", () => {
    const seed = catalogueInventorySeed();
    expect(seed.find((item) => item.sku === "orz-helmet-black-m")).toEqual({ sku: "orz-helmet-black-m", stockOnHand: 2 });
    expect(seed.find((item) => item.sku === "orz-helmet-white-s")).toEqual({ sku: "orz-helmet-white-s", stockOnHand: 0 });
    expect(seed.find((item) => item.sku === "orz-helmet-white-l")).toEqual({ sku: "orz-helmet-white-l", stockOnHand: 1 });
    expect(seed.find((item) => item.sku === "orz-goggles-blue-black")).toEqual({ sku: "orz-goggles-blue-black", stockOnHand: 1 });
    expect(seed.find((item) => item.sku === "orz-goggles-black-silver")).toEqual({ sku: "orz-goggles-black-silver", stockOnHand: 1 });
  });

  it("uses the later variant pickup date for White / Blue Large", () => {
    const items = resolveCartItems([{ businessId: siteConfig.businessId, productId: "helmet-gloss-white", variantId: "white-l", quantity: 1 }]);
    expect(pickupAvailableDate(items, "2026-09-02")).toBe("2026-09-07");
    expect(pickupAvailableDate(resolveCartItems([{ businessId: siteConfig.businessId, productId: "helmet-matte-black", variantId: "black-s", quantity: 1 }]), "2026-09-02")).toBe("2026-09-02");
  });

  it("scopes private order tokens to the business and customer email", () => {
    const token = createOrderAccessToken(siteConfig.businessId, "TEST_ORDER_ID", "customer@TEST.invalid");
    expect(verifyOrderAccessToken(siteConfig.businessId, "TEST_ORDER_ID", "customer@TEST.invalid", token)).toBe(true);
    expect(verifyOrderAccessToken("TEST_OTHER_BUSINESS", "TEST_ORDER_ID", "customer@TEST.invalid", token)).toBe(false);
    expect(verifyOrderAccessToken(siteConfig.businessId, "TEST_ORDER_ID", "other@TEST.invalid", token)).toBe(false);
  });

  it("has a customer-readable label for every status", () => {
    expect(orderStatusLabel("CANCELLATION_REQUESTED")).toBe("Cancellation requested");
    expect(orderStatusLabel("REFUNDED")).toBe("Refunded");
  });

  it("accepts only an exact six-digit owner passcode", () => {
    expect(isValidAdminPasscode("482901")).toBe(true);
    expect(isValidAdminPasscode("48290")).toBe(false);
    expect(isValidAdminPasscode("4829017")).toBe(false);
    expect(isValidAdminPasscode("482A01")).toBe(false);
  });

  it("reconciles Stripe promotion discounts against the reserved gross total", () => {
    expect(reconcileStripeCheckoutTotal({ subtotalAmount: 19990, shippingAmount: 0, discountAmount: 1999, amountTotal: 17991 }))
      .toEqual({ grossAmount: 19990, discountAmount: 1999, totalAmount: 17991 });
    expect(() => reconcileStripeCheckoutTotal({ subtotalAmount: 19990, shippingAmount: 0, discountAmount: 1999, amountTotal: 19990 }))
      .toThrow("does not match");
    expect(() => reconcileStripeCheckoutTotal({ subtotalAmount: 19990, shippingAmount: 0, discountAmount: 20000, amountTotal: 0 }))
      .toThrow("does not match");
  });

  it("extracts promotion and safe payment-method display evidence from Stripe", () => {
    const session = {
      total_details: { amount_discount: 1999 },
      discounts: [{ promotion_code: { id: "promo_TEST_JIM10", code: "JIM10" } }],
      payment_intent: { payment_method: { type: "card", card: { brand: "mastercard", last4: "4242" } } },
    } as unknown as Stripe.Checkout.Session;
    expect(checkoutDiscountDetails(session)).toEqual({ discountAmount: 1999, stripePromotionCodeId: "promo_TEST_JIM10", promotionCode: "JIM10" });
    expect(checkoutPaymentMethodLabel(session)).toBe("Mastercard ending in 4242");
  });
});
