import type { Metadata } from "next";
import { ShopClient } from "@/components/shop/shop-client";
import { getLiveCatalog } from "@/lib/live-catalog";

export const metadata: Metadata = {
  title: "Shop motocross helmets, goggles and bundles",
  description: "Browse straightforward APEX MOTO off-road helmets, goggles and bundles with fair prices, published details and current local availability.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; search?: string }> }) {
  const params = await searchParams;
  const products = await getLiveCatalog();
  return (
    <div className="page-shell page-shell--shop">
      <div className="container"><ShopClient key={JSON.stringify([params.category, params.search])} products={products} initialCategory={params.category} initialSearch={params.search} /></div>
    </div>
  );
}
