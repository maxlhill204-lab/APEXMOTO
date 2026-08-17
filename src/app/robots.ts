import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/order-success"] }, sitemap: `${getSiteUrl()}/sitemap.xml`, host: getSiteUrl() };
}
