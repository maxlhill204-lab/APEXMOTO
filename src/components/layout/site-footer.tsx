import { siteConfig } from "@/config/site";
import Link from "next/link";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "Helmets", href: "/shop?category=helmet" },
      { label: "Goggles", href: "/shop?category=goggles" },
      { label: "Helmet bundle", href: "/product/apex-moto-helmet-goggles-bundle" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Size guide", href: "/size-guide" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Helmet information", href: "/safety" },
      { label: "Contact", href: "/contact" },
      { label: "Order help", href: "/order-help" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Link href="/" className="wordmark"><span aria-hidden="true">A</span><strong>APEX</strong> MOTO</Link>
          <p>{siteConfig.tagline}</p>
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={`${column.title} links`}>
            <h2>{column.title}</h2>
            {column.links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          </nav>
        ))}
        <div className="site-footer__social">
          <h2>Follow</h2>
          <a href={siteConfig.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>
          <a href={siteConfig.facebookUrl} target="_blank" rel="noreferrer">Facebook</a>
        </div>
      </div>
      <div className="container site-footer__bottom">
        <span>© {new Date().getFullYear()} {siteConfig.businessName}</span>
        <span>{siteConfig.pickupSuburb}, {siteConfig.state}</span>
        <span><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></span>
      </div>
    </footer>
  );
}
