"use client";

import { useCart } from "@/components/commerce/cart-provider";
import { Drawer } from "@/components/ui/drawer";
import { mainNavigation, mobileNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Menu, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { quantity, openCart } = useCart();

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="store-utility">
          <div className="container"><Link href="/shipping">Delivery and Newport pickup</Link><Link href="/order-help">Order help</Link></div>
        </div>
        <div className="site-header__inner container">
          <button className="icon-button site-header__menu" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu aria-hidden="true" size={22} />
          </button>
          <Link href="/" className="site-logo-link" aria-label={`${siteConfig.businessName} home`}>
            {siteConfig.businessName}
          </Link>
          <form action="/shop" className="site-search" role="search">
            <label className="sr-only" htmlFor="site-search">Search products</label>
            <input id="site-search" name="search" type="search" placeholder="Search products" required />
            <button type="submit" aria-label="Search"><Search size={21} aria-hidden="true" /></button>
          </form>
          <div className="site-header__actions">
            <button className="icon-button icon-button--label cart-button" onClick={openCart} aria-label={`Open cart with ${quantity} items`}>
              <ShoppingCart aria-hidden="true" size={20} /><span>Cart</span>
              <b aria-hidden="true">{quantity}</b>
            </button>
          </div>
        </div>
        <nav className="site-header__nav" aria-label="Main navigation">
          {mainNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="left">
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {mobileNavigation.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>
          ))}
        </nav>
      </Drawer>
    </>
  );
}
