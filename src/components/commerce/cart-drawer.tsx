"use client";

import { formatPrice } from "@/config/site";
import { getProductById, getVariantLabel } from "@/lib/products";
import { ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { ProductVisual } from "@/components/product/product-visual";
import { Drawer } from "@/components/ui/drawer";
import { useCart } from "./cart-provider";

export function CartDrawer() {
  const { drawerOpen, closeCart, resolvedItems, subtotal, lastAddedKey } = useCart();
  const lastAdded = resolvedItems.find((item) => item.key === lastAddedKey);
  const hasHelmet = resolvedItems.some((item) => item.product.category === "helmet");
  const hasGoggles = resolvedItems.some((item) => item.product.category === "goggles" || item.product.category === "bundle");
  const bundle = getProductById("bundle-helmet-goggles");
  const helmet = getProductById("helmet-matte-black");
  const bundledGogglesPrice = bundle && helmet ? bundle.price - helmet.price : null;

  return (
    <Drawer open={drawerOpen} onClose={closeCart} title={lastAdded ? "Added to your cart" : "Your cart"} className="cart-drawer">
      {resolvedItems.length ? (
        <div className="cart-drawer__content">
          {lastAdded ? (
            <div className="cart-drawer__added">
              <ProductVisual product={lastAdded.product} />
              <div>
                <strong>{lastAdded.product.name}</strong>
                <span>{getVariantLabel(lastAdded.product, lastAdded.variant)}</span>
                <span>{formatPrice(lastAdded.product.price)}</span>
              </div>
            </div>
          ) : (
            <div className="cart-drawer__items" aria-label="Cart items">
              {resolvedItems.map((item) => (
                <Link href={`/product/${item.product.slug}`} onClick={closeCart} key={item.key}>
                  <ProductVisual product={item.product} />
                  <span>
                    <strong>{item.product.name}</strong>
                    <small>{getVariantLabel(item.product, item.variant)} · Qty {item.quantity}</small>
                  </span>
                  <b>{formatPrice(item.lineTotal)}</b>
                </Link>
              ))}
            </div>
          )}
          {hasHelmet && !hasGoggles ? (
            <Link className="cart-upsell" href="/product/apex-moto-helmet-goggles-bundle" onClick={closeCart}>
              <span><strong>Complete your setup</strong><small>{bundledGogglesPrice !== null ? `Goggles are ${formatPrice(bundledGogglesPrice)} in the bundle + free bag` : "View the helmet, goggles and bag bundle"}</small></span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ) : null}
          <div className="cart-drawer__summary">
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <p className="fine-print">Choose pickup or your delivery area on the cart page.</p>
          <Link className="button button--primary button--wide" href="/cart" onClick={closeCart}>Checkout</Link>
        </div>
      ) : (
        <div className="empty-state empty-state--compact">
          <ShoppingBag size={36} aria-hidden="true" />
          <h3>Your cart is empty.</h3>
          <p>Start with a helmet, then add goggles or choose a bundle.</p>
          <Link className="button button--primary" href="/shop?category=helmet" onClick={closeCart}>Shop helmets</Link>
        </div>
      )}
    </Drawer>
  );
}
