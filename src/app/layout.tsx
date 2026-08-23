import type { Metadata, Viewport } from "next";
import { CartDrawer } from "@/components/commerce/cart-drawer";
import { CartProvider } from "@/components/commerce/cart-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteUrl, siteConfig } from "@/config/site";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: `${siteConfig.businessName} | ORZ motocross gear`, template: `%s | ${siteConfig.businessName}` },
  description: siteConfig.description,
  applicationName: siteConfig.businessName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: siteConfig.businessName,
    title: `${siteConfig.businessName} — Ready for the dirt.`,
    description: siteConfig.description,
    url: "/",
    images: [{ url: "/og.png", width: 1672, height: 941, alt: `${siteConfig.businessName} — Ready for the dirt.` }],
  },
  twitter: { card: "summary_large_image", title: siteConfig.businessName, description: siteConfig.description, images: ["/og.png"] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organisation = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.businessName,
    slogan: siteConfig.tagline,
    areaServed: "AU",
  };
  return (
    <html lang="en-AU" data-scroll-behavior="smooth">
      <body>
        <CartProvider>
          <div id="site-shell">
            <SiteHeader />
            <main id="main-content">{children}</main>
            <SiteFooter />
          </div>
          <CartDrawer />
        </CartProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation).replace(/</g, "\\u003c") }} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
