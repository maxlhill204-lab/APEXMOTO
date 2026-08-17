import { Route } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The APEX MOTO page or product link could not be found.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <div className="page-shell status-page"><div className="status-card"><Route aria-hidden="true" /><p className="eyebrow eyebrow--accent">404</p><h1>Looks like this trail ends here.</h1><p>The page may have moved, or the product link may be incomplete.</p><div className="button-row"><Link href="/" className="button button--secondary">Back home</Link><Link href="/shop?category=helmet" className="button button--primary">Shop helmets</Link></div></div></div>;
}
