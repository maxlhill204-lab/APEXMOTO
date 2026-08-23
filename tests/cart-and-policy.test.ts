import { describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site";
import { addCartItem, cartSubtotal, sanitiseCartItems, setCartItemQuantity } from "@/lib/cart";
import { validateCheckoutRequest } from "@/lib/checkout-policy";
import { bundleIndividualTotal, getProductById } from "@/lib/products";
import { calculateShipping } from "@/lib/shipping";

const TEST_CART_ITEM = {
  businessId: siteConfig.businessId,
  productId: "helmet-matte-black",
  variantId: "black-s",
  quantity: 1,
};

describe("cart workflow", () => {
  it("adds a valid variant and derives price from server catalogue data", () => {
    const cart = addCartItem([], TEST_CART_ITEM);
    expect(cart).toEqual([TEST_CART_ITEM]);
    expect(cartSubtotal(cart)).toBe(12495);
  });

  it("never allows cart quantity above exact variant stock", () => {
    const cart = setCartItemQuantity([TEST_CART_ITEM], "helmet-matte-black:black-s", 9);
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

  it("uses genuine higher comparison prices for the 48-hour offer", () => {
    expect(getProductById("helmet-matte-black")).toMatchObject({ price: 12495, compareAtPrice: 14000 });
    expect(getProductById("goggles-orz")).toMatchObject({ price: 2500, compareAtPrice: 2800 });
    expect(getProductById("bundle-helmet-goggles")).toMatchObject({ price: 14495, compareAtPrice: 16200 });
  });

  it("has a matching bundle gallery image for every selectable colour", () => {
    const bundle = getProductById("bundle-helmet-goggles")!;
    const imageColours = new Set(bundle.images.map((image) => image.colour).filter(Boolean));
    const selectableColours = bundle.options
      .filter((option) => option.id === "helmet-colour" || option.id === "goggles")
      .flatMap((option) => option.values.map((value) => value.label));
    expect(selectableColours.every((colour) => imageColours.has(colour))).toBe(true);
  });

  it("uses owner-supplied helmet stock by exact size and colour", () => {
    const black = getProductById("helmet-matte-black")!;
    const white = getProductById("helmet-gloss-white")!;
    expect(black.variants.map(({ id, stock }) => [id, stock])).toEqual([
      ["black-s", 1], ["black-m", 2], ["black-l", 2], ["black-xl", 2], ["black-xxl", 0],
    ]);
    expect(white.variants.find((variant) => variant.id === "white-m")?.stock).toBe(1);
    expect(white.variants.find((variant) => variant.id === "white-l")).toMatchObject({ stock: 1, pickupAvailableFrom: "2026-09-07" });
    expect(white.variants.filter((variant) => ["white-s", "white-xl", "white-xxl"].includes(variant.id)).every((variant) => variant.stock === 0)).toBe(true);
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

  it("ignores browser prices and resolves the server-owned catalogue price", () => {
    const result = validateCheckoutRequest(
      { businessId: siteConfig.businessId, items: [{ ...TEST_CART_ITEM, price: 1 }], shippingMethodId: "pickup", customerName: "TEST CUSTOMER", customerEmail: "customer@TEST.invalid", pickupAcknowledged: true },
      "https://store.example",
      "https://store.example",
    );
    expect(result).toMatchObject({
      allowed: true,
      items: [{ productId: "helmet-matte-black", lineTotal: 12495 }],
      shipping: { amount: 0, pickup: true },
    });
  });

  it("requires a confirmation email and explicit pickup acknowledgement", () => {
    const base = { businessId: siteConfig.businessId, items: [TEST_CART_ITEM], shippingMethodId: "pickup", customerName: "TEST CUSTOMER" };
    expect(validateCheckoutRequest({ ...base, customerEmail: "invalid", pickupAcknowledged: true }, "https://store.example", "https://store.example")).toMatchObject({ allowed: false, code: "EMAIL_REQUIRED" });
    expect(validateCheckoutRequest({ ...base, customerEmail: "customer@TEST.invalid", pickupAcknowledged: false }, "https://store.example", "https://store.example")).toMatchObject({ allowed: false, code: "PICKUP_ACK_REQUIRED" });
  });
});
