"use client";

import { cartQuantityLimit } from "@/lib/cart";
import { QuantityControl } from "./quantity-control";
import { formatPrice } from "@/config/site";
import { getProductById, getVariantLabel } from "@/lib/products";
import { ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { ProductVisual } from "@/components/product/product-visual";
import { Drawer } from "@/components/ui/drawer";
import { useCart } from "./cart-provider";

export function CartDrawer() {
  const { drawerOpen, closeCart, resolvedItems, subtotal, lastAddedKey, updateQuantity } = useCart();
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
          <div className="cart-drawer__items" aria-label="Cart items">
            {resolvedItems.map((item) => (
              <div className="cart-drawer__line" key={item.key}>
                <Link href={"/product/" + item.product.slug} onClick={closeCart} aria-label={item.product.name}>
                  <ProductVisual product={item.product} />
                </Link>
                <div>
                  <Link href={"/product/" + item.product.slug} onClick={closeCart}><strong>{item.product.name}</strong></Link>
                  <small>{getVariantLabel(item.product, item.variant)}</small>
                  <QuantityControl value={item.quantity} min={0} max={cartQuantityLimit(item.product, item.variant)}
                    onChange={(quantity) => updateQuantity(item.key, quantity)} label={"Quantity for " + item.product.name} />
                </div>
                <b>{formatPrice(item.lineTotal)}</b>
              </div>
            ))}
          </div>
          {resolvedItems.some((item) => item.variant.preorder) ? <p className="fine-print">Your order ships together. Expected dispatch in 7–14 days.</p> : null}
          {hasHelmet && !hasGoggles ? (
            <Link className="cart-upsell" href="/product/apex-moto-helmet-goggles-bundle" onClick={closeCart}>
              <span><strong>Goggles for {bundledGogglesPrice === null ? "less" : formatPrice(bundledGogglesPrice)} with a helmet</strong><small>{bundledGogglesPrice !== null ? `View the ${formatPrice(bundle?.price ?? 14000)} helmet, goggles and bag bundle` : "View the helmet, goggles and bag bundle"}</small></span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ) : null}
          <div className="cart-drawer__summary">
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <p className="fine-print">Check Australia-wide postage in your cart.</p>
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
