import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/config/site";
import { catalog } from "@/lib/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteUrl();
  const staticRoutes = ["", "/shop", "/size-guide", "/shipping", "/returns", "/safety", "/faq", "/contact", "/privacy", "/terms"];
  return [
    ...staticRoutes.map((route) => ({ url: `${origin}${route}`, lastModified: new Date("2026-08-17"), changeFrequency: route === "" || route === "/shop" ? "weekly" as const : "monthly" as const, priority: route === "" ? 1 : route === "/shop" ? .9 : .6 })),
    ...catalog.map((product) => ({ url: `${origin}/product/${product.slug}`, lastModified: new Date("2026-08-17"), changeFrequency: "weekly" as const, priority: .8 })),
  ];
}
