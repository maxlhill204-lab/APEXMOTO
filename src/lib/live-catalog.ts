import { siteConfig } from "@/config/site";
import { getSql } from "@/lib/db";
import { catalog } from "@/lib/products";
import type { Product } from "@/types/product";

export async function getLiveCatalog(): Promise<Product[]> {
  if (!process.env.DATABASE_URL?.trim()) return catalog;
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT i.sku,i.stock_on_hand,COALESCE(SUM(r.quantity) FILTER (WHERE r.status='ACTIVE'),0)::integer AS reserved
      FROM inventory i LEFT JOIN inventory_reservations r ON r.business_id=i.business_id AND r.sku=i.sku
      WHERE i.business_id=${siteConfig.businessId}
      GROUP BY i.sku,i.stock_on_hand
    `;
    if (!rows.length) return catalog;
    const available = new Map(rows.map((row) => [String(row.sku), Math.max(0, Number(row.stock_on_hand) - Number(row.reserved))]));
    return catalog.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        stock: Math.min(...variant.inventory.map((requirement) => {
          const physical = available.get(requirement.sku);
          return physical === undefined ? variant.stock : Math.floor(physical / requirement.quantity);
        })),
      })),
    }));
  } catch {
    return catalog;
  }
}
