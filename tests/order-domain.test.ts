import { beforeAll, describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site";
import { resolveCartItems } from "@/lib/cart";
import { catalogueInventorySeed, inventoryRequirements, orderStatusLabel } from "@/lib/order-domain";
import { createOrderAccessToken, verifyOrderAccessToken } from "@/lib/order-access";

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
    expect(seed.find((item) => item.sku === "orz-helmet-black-m")).toEqual({ sku: "orz-helmet-black-m", stockOnHand: 1 });
    expect(seed.find((item) => item.sku === "orz-helmet-white-s")).toEqual({ sku: "orz-helmet-white-s", stockOnHand: 0 });
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
});
