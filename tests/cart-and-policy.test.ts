import { describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site";
import { addCartItem, cartSubtotal, sanitiseCartItems, setCartItemQuantity } from "@/lib/cart";
import { validateCheckoutRequest } from "@/lib/checkout-policy";
import { bundleIndividualTotal, getProductById } from "@/lib/products";
import { calculateShipping } from "@/lib/shipping";

const TEST_CART_ITEM = {
  businessId: siteConfig.businessId,
  productId: "helmet-matte-black",
  variantId: "black-l",
  quantity: 1,
};

describe("cart workflow", () => {
  it("adds a valid variant and derives price from server catalogue data", () => {
    const cart = addCartItem([], TEST_CART_ITEM);
    expect(cart).toEqual([TEST_CART_ITEM]);
    expect(cartSubtotal(cart)).toBe(12495);
  });

  it("never allows cart quantity above exact variant stock", () => {
    const cart = setCartItemQuantity([TEST_CART_ITEM], "helmet-matte-black:black-l", 9);
    expect(cart[0].quantity).toBe(1);
  });

  it("drops unknown variants and cross-business items", () => {
    expect(sanitiseCartItems([{ ...TEST_CART_ITEM, variantId: "TEST_UNKNOWN" }])).toEqual([]);
    expect(sanitiseCartItems([{ ...TEST_CART_ITEM, businessId: "TEST_OTHER_BUSINESS" }])).toEqual([]);
  });

  it("calculates genuine bundle savings from component catalogue prices", () => {
    const bundle = getProductById("bundle-helmet-goggles")!;
    expect(bundleIndividualTotal(bundle)).toBe(14995);
    expect(bundleIndividualTotal(bundle)! - bundle.price).toBe(500);
  });

  it("uses owner-supplied helmet stock by exact size and colour", () => {
    const black = getProductById("helmet-matte-black")!;
    const white = getProductById("helmet-gloss-white")!;
    expect(black.variants.map(({ id, stock }) => [id, stock])).toEqual([
      ["black-s", 1], ["black-m", 1], ["black-l", 1], ["black-xl", 1], ["black-xxl", 0],
    ]);
    expect(white.variants.find((variant) => variant.id === "white-m")?.stock).toBe(1);
    expect(white.variants.filter((variant) => ["white-s", "white-l", "white-xl"].includes(variant.id)).every((variant) => variant.stock === 0)).toBe(true);
  });

  it("applies the supplied goggle and helmet shipping rules", () => {
    const helmetItems = addCartItem([], TEST_CART_ITEM);
    const resolvedHelmet = helmetItems.flatMap((item) => {
      const product = getProductById(item.productId)!;
      const variant = product.variants.find((candidate) => candidate.id === item.variantId)!;
      return [{ ...item, key: `${item.productId}:${item.variantId}`, product, variant, lineTotal: product.price }];
    });
    expect(calculateShipping(resolvedHelmet, "melbourne")).toMatchObject({ available: true, amount: 2520 });
    expect(calculateShipping(resolvedHelmet, "regional-wa")).toMatchObject({ available: false, code: "SHIPPING_QUOTE_REQUIRED" });

    const goggles = getProductById("goggles-orz")!;
    const goggleVariant = goggles.variants[0];
    const resolvedGoggles = { businessId: siteConfig.businessId, productId: goggles.id, variantId: goggleVariant.id, quantity: 1, key: `${goggles.id}:${goggleVariant.id}`, product: goggles, variant: goggleVariant, lineTotal: goggles.price };
    expect(calculateShipping([resolvedGoggles], "goggles-australia")).toMatchObject({ available: true, amount: 800 });
    expect(calculateShipping([...resolvedHelmet, { ...resolvedGoggles, quantity: 3 }], "melbourne")).toMatchObject({ available: true, amount: 2520 });
    expect(calculateShipping([...resolvedHelmet, { ...resolvedGoggles, quantity: 4 }], "melbourne")).toMatchObject({ available: false, code: "SHIPPING_QUOTE_REQUIRED" });
  });
});

describe("checkout policy", () => {
  it("requires an origin for browser checkout", () => {
    const result = validateCheckoutRequest(
      { businessId: siteConfig.businessId, items: [TEST_CART_ITEM], shippingMethodId: "pickup" },
      null,
      "https://store.example",
    );
    expect(result).toMatchObject({ allowed: false, code: "ORIGIN_REQUIRED" });
  });

  it("denies cross-origin requests", () => {
    const result = validateCheckoutRequest(
      { businessId: siteConfig.businessId, items: [TEST_CART_ITEM], shippingMethodId: "pickup" },
      "https://TEST-ATTACKER.invalid",
      "https://store.example",
    );
    expect(result).toMatchObject({ allowed: false, code: "ORIGIN_DENIED" });
  });

  it("denies cross-business carts", () => {
    const result = validateCheckoutRequest(
      { businessId: "TEST_OTHER_BUSINESS", items: [TEST_CART_ITEM], shippingMethodId: "pickup" },
      "https://store.example",
      "https://store.example",
    );
    expect(result).toMatchObject({ allowed: false, code: "BUSINESS_SCOPE_DENIED" });
  });

  it("does not accept browser prices and refuses checkout without Stripe Price IDs", () => {
    const result = validateCheckoutRequest(
      { businessId: siteConfig.businessId, items: [{ ...TEST_CART_ITEM, price: 1 }], shippingMethodId: "pickup" },
      "https://store.example",
      "https://store.example",
    );
    expect(result).toMatchObject({ allowed: false, code: "PRICE_NOT_CONFIGURED" });
  });
});
