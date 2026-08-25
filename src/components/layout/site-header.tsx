"use client";

import { useCart } from "@/components/commerce/cart-provider";
import { Drawer } from "@/components/ui/drawer";
import { mainNavigation, mobileNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { formatPromotionCountdown } from "@/lib/promotion";
import { Menu, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState("--D --H --M --S");
  const { quantity, openCart } = useCart();
  const saleEnded = countdown === "SALE ENDED";

  useEffect(() => {
    const updateCountdown = () => setCountdown(formatPromotionCountdown(siteConfig.promotionEndsAt, Date.now()));
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="announcement-bar">
        <span className="sr-only">{saleEnded ? siteConfig.announcementBarEndedText : `${siteConfig.promotionPercent}% off sale ends ${siteConfig.promotionEndsLabel}.`}</span>
        <div className="announcement-bar__track" aria-hidden="true">
          {[0, 1].map((group) => (
            <div className="announcement-bar__group" key={group}>
              {Array.from({ length: 6 }, (_, index) => <span key={index}>{saleEnded ? siteConfig.announcementBarEndedText : <>{siteConfig.announcementBarText} <b>{countdown}</b></>}</span>)}
            </div>
          ))}
        </div>
      </div>
      <header className="site-header">
        <div className="site-header__inner container">
          <button className="icon-button site-header__menu" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu aria-hidden="true" size={22} />
          </button>
          <Link href="/" className="site-logo-link" aria-label={`${siteConfig.businessName} home`}>
            <Image
              className="site-logo"
              src="/brand/apex-moto-logo.png"
              alt=""
              width={1254}
              height={1254}
              priority
            />
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
