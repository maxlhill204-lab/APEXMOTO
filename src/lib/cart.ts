import { siteConfig } from "@/config/site";
import { getProductById, getVariantById } from "@/lib/products";
import type { CartItemInput, ResolvedCartItem } from "@/types/product";

export const cartItemKey = (item: Pick<CartItemInput, "productId" | "variantId">) =>
  `${item.productId}:${item.variantId}`;

export function sanitiseCartItems(value: unknown): CartItemInput[] {
  if (!Array.isArray(value)) return [];
  const merged = new Map<string, CartItemInput>();

  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") continue;
    const item = candidate as Partial<CartItemInput>;
    if (
      item.businessId !== siteConfig.businessId ||
      typeof item.productId !== "string" ||
      typeof item.variantId !== "string" ||
      !Number.isInteger(item.quantity) ||
      (item.quantity ?? 0) < 1
    ) {
      continue;
    }
    const product = getProductById(item.productId);
    const variant = product && getVariantById(product, item.variantId);
    if (!product || !variant || product.businessId !== item.businessId || variant.stock < 1) continue;
    const key = cartItemKey({ productId: product.id, variantId: variant.id });
    const existing = merged.get(key);
    const requested = (existing?.quantity ?? 0) + (item.quantity ?? 0);
    merged.set(key, {
      businessId: siteConfig.businessId,
      productId: product.id,
      variantId: variant.id,
      quantity: Math.min(requested, variant.stock, 10),
    });
  }

  return [...merged.values()];
}

export function resolveCartItems(items: CartItemInput[]): ResolvedCartItem[] {
  return sanitiseCartItems(items).flatMap((item) => {
    const product = getProductById(item.productId);
    const variant = product && getVariantById(product, item.variantId);
    if (!product || !variant) return [];
    return [
      {
        ...item,
        key: cartItemKey(item),
        product,
        variant,
        lineTotal: product.price * item.quantity,
      },
    ];
  });
}

export const cartSubtotal = (items: CartItemInput[]) =>
  resolveCartItems(items).reduce((total, item) => total + item.lineTotal, 0);

export const cartQuantity = (items: CartItemInput[]) =>
  sanitiseCartItems(items).reduce((total, item) => total + item.quantity, 0);

export function addCartItem(items: CartItemInput[], incoming: CartItemInput) {
  return sanitiseCartItems([...items, incoming]);
}

export function setCartItemQuantity(
  items: CartItemInput[],
  key: string,
  quantity: number,
) {
  if (quantity <= 0) return items.filter((item) => cartItemKey(item) !== key);
  return sanitiseCartItems(
    items.map((item) =>
      cartItemKey(item) === key ? { ...item, quantity: Math.floor(quantity) } : item,
    ),
  );
}
