import { getStockLabel, hasPreorder, totalStock } from "@/lib/products";
import type { Product } from "@/types/product";

export function StockBadge({ product }: { product: Product }) {
  const stock = product.category === "bundle"
    ? Math.max(0, ...product.variants.filter((variant) => !variant.preorder).map((variant) => variant.stock))
    : totalStock(product);
  return <StockIndicator stock={stock} preorder={stock === 0 && hasPreorder(product)} />;
}

export function StockIndicator({ stock, preorder = false }: { stock: number; preorder?: boolean }) {
  const status = preorder ? "preorder" : stock === 0 ? "out" : stock <= 3 ? "low" : "in";
  return (
    <span className={`stock-badge stock-badge--${status}`}>
      <span aria-hidden="true" />
      {preorder ? "Preorder" : getStockLabel(stock)}
    </span>
  );
}
