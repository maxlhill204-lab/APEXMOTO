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
      <div className="container page-hero page-hero--compact"><p className="eyebrow eyebrow--accent">RIDE HARD. PAY FAIR.</p><h1>Shop.</h1><p>A tight range of straightforward off-road gear. Clear details, visible stock and no prestige tax.</p></div>
      <div className="container"><ShopClient products={products} initialCategory={params.category} initialSearch={params.search} /></div>
    </div>
  );
}
