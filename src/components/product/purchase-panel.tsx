"use client";

import { QuantityControl } from "@/components/commerce/quantity-control";
import { useCart } from "@/components/commerce/cart-provider";
import { formatPrice, siteConfig } from "@/config/site";
import { trackEvent } from "@/lib/analytics";
import { findMatchingVariant, getOptionLabel } from "@/lib/products";
import type { Product } from "@/types/product";
import { StockBadge, StockIndicator } from "./stock-badge";
import { Check, Package, Ruler } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function PurchasePanel({ product }: { product: Product }) {
  const [selection, setSelection] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      product.options.map((option) => [
        option.id,
        option.values.length === 1 ? option.values[0].value : "",
      ]),
    ),
  );
  const [quantity, setQuantity] = useState(1);
  const [invalidOptionId, setInvalidOptionId] = useState<string | null>(null);
  const [validationAttempt, setValidationAttempt] = useState(0);
  const { addItem } = useCart();
  const selectionComplete = product.options.every((option) => selection[option.id]);
  const variant = useMemo(
    () => (selectionComplete ? findMatchingVariant(product, selection) : undefined),
    [product, selection, selectionComplete],
  );
  const stock = variant?.stock ?? 0;
  const missingOption = product.options.find((option) => !selection[option.id]);

  const matchingOptions = (optionId: string, value: string) => {
    const optionIndex = product.options.findIndex((option) => option.id === optionId);
    const earlierOptions = product.options.slice(0, optionIndex);
    return product.variants.filter(
      (candidate) =>
        candidate.options[optionId] === value &&
        earlierOptions.every(
          (option) => !selection[option.id] || candidate.options[option.id] === selection[option.id],
        ),
    );
  };

  const selectOption = (optionId: string, value: string) => {
    const next = { ...selection, [optionId]: value };
    const optionIndex = product.options.findIndex((option) => option.id === optionId);
    for (const laterOption of product.options.slice(optionIndex + 1)) {
      next[laterOption.id] = laterOption.values.length === 1 ? laterOption.values[0].value : "";
    }
    setSelection(next);
    if (invalidOptionId === optionId) setInvalidOptionId(null);
    setQuantity(1);
    window.dispatchEvent(new CustomEvent("apex-moto:product-option", {
      detail: { productId: product.id, optionId, valueLabel: getOptionLabel(product, optionId, value) },
    }));
    trackEvent(optionId.includes("size") ? "select_size" : "select_colour", {
      product_id: product.id,
      value,
    });
  };

  const showRequiredOption = () => {
    if (!missingOption) return false;
    setInvalidOptionId(missingOption.id);
    setValidationAttempt((attempt) => attempt + 1);
    window.setTimeout(() => {
      document.getElementById(`option-${product.id}-${missingOption.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
    return true;
  };

  const addToCart = () => {
    if (showRequiredOption()) return;
    if (!variant || stock < 1) return;
    addItem({
      businessId: siteConfig.businessId,
      productId: product.id,
      variantId: variant.id,
      quantity: Math.min(quantity, stock),
    });
    trackEvent("add_to_cart", { product_id: product.id, variant_id: variant.id, quantity });
  };

  return (
    <div className="purchase-panel">
      <div className="purchase-panel__heading">
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        <div className="purchase-panel__price"><strong>{formatPrice(product.price)}</strong>{product.compareAtPrice ? <del>{formatPrice(product.compareAtPrice)}</del> : null}</div>
        {product.compareAtPrice ? <p className="sale-note">{product.clearance ? "Clearance" : siteConfig.promotionShortLabel}</p> : null}
      </div>
      <p className="purchase-panel__description">{product.shortDescription}</p>
      <div className={`variant-stock variant-stock--${!variant ? "pending" : stock === 0 ? "out" : stock <= 3 ? "low" : "in"}`} aria-live="polite">
        {variant ? <StockIndicator stock={stock} preorder={variant.preorder && stock > 0} /> : <StockBadge product={product} />}
      </div>

      <div className="option-groups" id="product-options">
        {product.options.filter((option) => product.category !== "goggles" || option.values.length > 1).map((option) => {
          const needsAttention = invalidOptionId === option.id;
          return (
          <fieldset
            className={`option-group${needsAttention ? " option-group--attention" : ""}`}
            id={`option-${product.id}-${option.id}`}
            key={needsAttention ? `${option.id}-${validationAttempt}` : option.id}
            aria-invalid={needsAttention || undefined}
          >
            <legend>{option.label}: <strong>{selection[option.id] ? getOptionLabel(product, option.id, selection[option.id]) : "Choose one"}</strong></legend>
            <div className={option.id.includes("size") ? "size-options" : "swatch-options"}>
              {option.values.map((value) => {
                const matches = matchingOptions(option.id, value.value);
                const ready = Math.max(0, ...matches.filter((candidate) => !candidate.preorder).map((candidate) => candidate.stock));
                const preorder = ready === 0 && matches.some((candidate) => candidate.preorder && candidate.stock > 0);
                const available = ready > 0 || preorder;
                const selected = selection[option.id] === value.value;
                return (
                  <button type="button" key={value.value} className={selected ? "is-selected" : ""} disabled={!available} onClick={() => selectOption(option.id, value.value)} aria-pressed={selected}>
                    {value.swatch ? <i style={{ backgroundColor: value.swatch }} aria-hidden="true" /> : null}
                    <span>{value.label}{option.id === "goggles" || option.id.includes("size") ? <StockIndicator stock={ready} preorder={preorder} /> : null}</span>{selected ? <Check size={14} aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
            {needsAttention ? <p className="option-required-message" role="alert">Please choose {option.label.toLowerCase()}.</p> : null}
            {option.id.includes("size") ? <Link href="/size-guide" className="size-guide-link" onClick={() => trackEvent("view_size_guide", { product_id: product.id })}><Ruler size={15} aria-hidden="true" /> View size guide</Link> : null}
          </fieldset>
          );
        })}
      </div>

      <div className="purchase-actions">
        <div className="purchase-actions__quantity"><span>Quantity</span><QuantityControl value={quantity} max={Math.min(stock, 10)} onChange={setQuantity} label={`Quantity for ${product.name}`} /></div>
        <button type="button" className="button button--primary button--wide purchase-actions__add" onClick={addToCart} disabled={Boolean(variant && stock < 1)}>
          {variant && stock < 1 ? "Sold out" : `${variant?.preorder ? "Preorder" : "Add to cart"} — ${formatPrice(product.price * quantity)}`}
        </button>
      </div>

      <div className="purchase-fulfilment">
        <div><Package aria-hidden="true" /><span><strong>Australia-wide delivery</strong><small>{variant?.preorder ? "The entire order is expected to dispatch together in 7–14 days. Allow an estimated 3–5 business days for delivery after dispatch." : "Postage is shown in your cart. Dispatch timing is confirmed with your order."}</small></span></div>
      </div>

      <div className="mobile-purchase-bar">
        <div><span>{product.shortName ?? product.name}</span><strong>{formatPrice(product.price)}</strong></div>
        <button type="button" className="button button--primary" onClick={() => {
          addToCart();
        }} disabled={Boolean(variant && stock < 1)}>{variant && stock < 1 ? "Sold out" : variant?.preorder ? "Preorder" : "Add to cart"}</button>
      </div>
    </div>
  );
}
