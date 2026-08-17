export type ProductCategory = "helmet" | "goggles" | "bundle";

export type ProductImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  placeholder?: boolean;
  colour?: string;
};

export type ProductOptionValue = {
  value: string;
  label: string;
  swatch?: string;
};

export type ProductOption = {
  id: string;
  label: string;
  values: ProductOptionValue[];
};

export type ProductVariant = {
  id: string;
  options: Record<string, string>;
  stock: number;
  stripePriceId?: string;
};

export type Product = {
  businessId: string;
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  category: ProductCategory;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  features?: string[];
  specifications?: { label: string; value: string }[];
  inTheBox?: string[];
  certification?: {
    standard?: string;
    approvalNumber?: string;
    verified?: boolean;
    documentationUrl?: string;
  };
  featured?: boolean;
  bestSeller?: boolean;
  relatedProductIds?: string[];
  bundleComponentIds?: string[];
  seo?: { title?: string; description?: string };
};

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export type CartItemInput = {
  businessId: string;
  productId: string;
  variantId: string;
  quantity: number;
};

export type ResolvedCartItem = CartItemInput & {
  key: string;
  product: Product;
  variant: ProductVariant;
  lineTotal: number;
};
