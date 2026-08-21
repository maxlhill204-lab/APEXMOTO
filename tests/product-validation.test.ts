import { describe, expect, it } from "vitest";
import { validateProducts } from "@/lib/products";
import type { Product } from "@/types/product";

const TEST_PRODUCT: Product = {
  businessId: "TEST_BUSINESS",
  id: "TEST_PRODUCT",
  slug: "test-product",
  name: "TEST Product",
  category: "helmet",
  description: "TEST description",
  shortDescription: "TEST short description",
  price: 10000,
  images: [{ src: "/TEST.webp", alt: "TEST image", width: 100, height: 100, placeholder: true }],
  options: [{ id: "size", label: "Size", values: [{ value: "M", label: "M" }] }],
  variants: [{ id: "TEST_VARIANT", options: { size: "M" }, stock: 1, inventory: [{ sku: "TEST_SKU", quantity: 1 }] }],
};

describe("product catalogue validation", () => {
  it("accepts a valid product", () => {
    expect(validateProducts([structuredClone(TEST_PRODUCT)])).toHaveLength(1);
  });

  it("rejects duplicate product ids and slugs", () => {
    expect(() => validateProducts([structuredClone(TEST_PRODUCT), { ...structuredClone(TEST_PRODUCT), id: "TEST_OTHER" }])).toThrow(/duplicate product slug/i);
  });

  it("rejects negative stock", () => {
    const product = structuredClone(TEST_PRODUCT);
    product.variants[0].stock = -1;
    expect(() => validateProducts([product])).toThrow(/invalid stock/i);
  });

  it("rejects an unsubstantiated verified certification", () => {
    const product = { ...structuredClone(TEST_PRODUCT), certification: { verified: true } };
    expect(() => validateProducts([product])).toThrow(/verified certification needs a standard/i);
  });

  it("rejects duplicate variant combinations", () => {
    const product = structuredClone(TEST_PRODUCT);
    product.variants.push({ id: "TEST_VARIANT_2", options: { size: "M" }, stock: 2, inventory: [{ sku: "TEST_SKU_2", quantity: 1 }] });
    expect(() => validateProducts([product])).toThrow(/duplicate variant combination/i);
  });
});
