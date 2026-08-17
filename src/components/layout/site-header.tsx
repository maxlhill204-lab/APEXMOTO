"use client";

import { useCart } from "@/components/commerce/cart-provider";
import { Drawer } from "@/components/ui/drawer";
import { mainNavigation, mobileNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Menu, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { quantity, openCart } = useCart();

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="announcement-bar">{siteConfig.announcementBarText}</div>
      <header className="site-header">
        <div className="site-header__inner container">
          <button className="icon-button site-header__menu" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu aria-hidden="true" size={22} />
          </button>
          <Link href="/" className="wordmark" aria-label={`${siteConfig.businessName} home`}>
            <span aria-hidden="true">A</span><strong>APEX</strong> MOTO
          </Link>
          <nav className="site-header__nav" aria-label="Main navigation">
            {mainNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
          <div className="site-header__actions">
            <button className="icon-button icon-button--label cart-button" onClick={openCart} aria-label={`Open cart with ${quantity} items`}>
              <ShoppingBag aria-hidden="true" size={20} /><span>Cart</span>
              <b aria-hidden="true">{quantity}</b>
            </button>
          </div>
        </div>
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
