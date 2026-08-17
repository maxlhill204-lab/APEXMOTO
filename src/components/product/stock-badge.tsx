import { getStockLabel, totalStock } from "@/lib/products";
import type { Product } from "@/types/product";

export function StockBadge({ product }: { product: Product }) {
  const stock = totalStock(product);
  return (
    <span className={`stock-badge stock-badge--${stock === 0 ? "out" : stock <= 3 ? "low" : "in"}`}>
      <span aria-hidden="true" />
      {getStockLabel(stock)}
    </span>
  );
}
