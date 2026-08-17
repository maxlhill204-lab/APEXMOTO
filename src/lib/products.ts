import { products } from "@/data/products";
import type { Product, ProductVariant, StockStatus } from "@/types/product";

export function validateProducts(catalogue: Product[]): Product[] {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const product of catalogue) {
    if (!product.id.trim() || !product.slug.trim() || !product.name.trim()) {
      throw new Error("Every product needs a non-empty id, slug, and name.");
    }
    if (ids.has(product.id)) throw new Error(`Duplicate product id: ${product.id}`);
    if (slugs.has(product.slug)) throw new Error(`Duplicate product slug: ${product.slug}`);
    ids.add(product.id);
    slugs.add(product.slug);

    if (!Number.isInteger(product.price) || product.price < 0) {
      throw new Error(`Invalid price for ${product.id}; use non-negative whole cents.`);
    }
    if (product.compareAtPrice !== undefined && product.compareAtPrice <= product.price) {
      throw new Error(`compareAtPrice must exceed price for ${product.id}.`);
    }
    if (!product.images.length) throw new Error(`Missing product image for ${product.id}.`);
    if (!product.variants.length) throw new Error(`Missing variants for ${product.id}.`);
    if (product.certification?.verified && !product.certification.standard?.trim()) {
      throw new Error(`Verified certification needs a standard for ${product.id}.`);
    }

    const optionIds = new Set(product.options.map((option) => option.id));
    const variantIds = new Set<string>();
    const combinations = new Set<string>();
    for (const variant of product.variants) {
      if (variantIds.has(variant.id)) {
        throw new Error(`Duplicate variant id ${variant.id} on ${product.id}.`);
      }
      variantIds.add(variant.id);
      if (!Number.isInteger(variant.stock) || variant.stock < 0) {
        throw new Error(`Invalid stock on ${product.id}/${variant.id}.`);
      }
      const suppliedIds = Object.keys(variant.options);
      if (suppliedIds.some((id) => !optionIds.has(id)) || suppliedIds.length !== optionIds.size) {
        throw new Error(`Variant ${variant.id} does not match options on ${product.id}.`);
      }
      const combination = product.options
        .map((option) => `${option.id}:${variant.options[option.id]}`)
        .join("|");
      if (combinations.has(combination)) {
        throw new Error(`Duplicate variant combination on ${product.id}: ${combination}`);
      }
      combinations.add(combination);
    }
  }

  return catalogue;
}

export const catalog = validateProducts(products);

export const getProductById = (id: string) => catalog.find((product) => product.id === id);
export const getProductBySlug = (slug: string) =>
  catalog.find((product) => product.slug === slug);
export const getVariantById = (product: Product, variantId: string) =>
  product.variants.find((variant) => variant.id === variantId);

export const totalStock = (product: Product) =>
  product.variants.reduce((total, variant) => total + variant.stock, 0);

export const getStockStatus = (product: Product): StockStatus => {
  const stock = totalStock(product);
  if (stock === 0) return "out-of-stock";
  if (stock <= 3) return "low-stock";
  return "in-stock";
};

export const getStockLabel = (stock: number) => {
  if (stock === 0) return "Out of stock";
  if (stock === 1) return "Only 1 left";
  if (stock <= 3) return "Low stock";
  return "In stock";
};

export function findMatchingVariant(
  product: Product,
  selection: Record<string, string>,
): ProductVariant | undefined {
  return product.variants.find((variant) =>
    product.options.every((option) => variant.options[option.id] === selection[option.id]),
  );
}

export const getOptionLabel = (product: Product, optionId: string, value: string) =>
  product.options
    .find((option) => option.id === optionId)
    ?.values.find((optionValue) => optionValue.value === value)?.label ?? value;

export const getVariantLabel = (product: Product, variant: ProductVariant) =>
  product.options
    .map((option) => getOptionLabel(product, option.id, variant.options[option.id]))
    .join(" / ");

export const bundleIndividualTotal = (bundle: Product) => {
  if (!bundle.bundleComponentIds?.length) return null;
  const components = bundle.bundleComponentIds.map(getProductById);
  if (components.some((component) => !component)) return null;
  return components.reduce((sum, component) => sum + (component?.price ?? 0), 0);
};
