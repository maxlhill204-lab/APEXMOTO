import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: process.cwd(),
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: "/product/orz-rally-helmet-matte-black", destination: "/product/apex-moto-rally-helmet-matte-black", permanent: true },
      { source: "/product/orz-rally-helmet-gloss-white", destination: "/product/apex-moto-rally-helmet-white-blue", permanent: true },
      { source: "/product/orz-mx-goggles", destination: "/product/apex-moto-mx-goggles", permanent: true },
      { source: "/product/orz-helmet-goggles-bundle", destination: "/product/apex-moto-helmet-goggles-bundle", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: "base-uri 'self'; frame-ancestors 'none'; form-action 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
