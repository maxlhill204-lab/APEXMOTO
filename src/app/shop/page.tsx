import type { Metadata } from "next";
import { ShopClient } from "@/components/shop/shop-client";
import { catalog } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop motocross helmets, goggles and bundles",
  description: "Browse APEX MOTO ORZ helmets, goggles, and the complete bundle with current variant availability.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; search?: string }> }) {
  const params = await searchParams;
  return (
    <div className="page-shell page-shell--shop">
      <div className="container page-hero page-hero--compact"><p className="eyebrow eyebrow--accent">APEX MOTO</p><h1>Shop.</h1><p>Choose your helmet, goggles, or complete setup.</p></div>
      <div className="container"><ShopClient products={catalog} initialCategory={params.category} initialSearch={params.search} /></div>
    </div>
  );
}
