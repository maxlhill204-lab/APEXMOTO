"use client";

import { QuantityControl } from "@/components/commerce/quantity-control";
import { useCart } from "@/components/commerce/cart-provider";
import { formatPrice, siteConfig } from "@/config/site";
import { trackEvent } from "@/lib/analytics";
import { findMatchingVariant, getOptionLabel, getStockLabel } from "@/lib/products";
import type { Product } from "@/types/product";
import { Check, MapPin, Package, Ruler } from "lucide-react";
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

  const valueAvailable = (optionId: string, value: string) => {
    const optionIndex = product.options.findIndex((option) => option.id === optionId);
    const earlierOptions = product.options.slice(0, optionIndex);
    return product.variants.some(
      (candidate) =>
        candidate.stock > 0 &&
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
      </div>
      <p className="purchase-panel__description">{product.shortDescription}</p>
      <div className={`variant-stock variant-stock--${!variant ? "pending" : stock === 0 ? "out" : stock <= 3 ? "low" : "in"}`} aria-live="polite">
        <span aria-hidden="true" />{variant ? getStockLabel(stock) : "Choose options to check stock"}
      </div>

      <div className="option-groups" id="product-options">
        {product.options.map((option) => {
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
                const available = valueAvailable(option.id, value.value);
                const selected = selection[option.id] === value.value;
                return (
                  <button type="button" key={value.value} className={selected ? "is-selected" : ""} disabled={!available} onClick={() => selectOption(option.id, value.value)} aria-pressed={selected}>
                    {value.swatch ? <i style={{ backgroundColor: value.swatch }} aria-hidden="true" /> : null}
                    <span>{value.label}</span>{selected ? <Check size={14} aria-hidden="true" /> : null}
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
          {variant && stock < 1 ? "Sold out" : `Add to cart — ${formatPrice(product.price * quantity)}`}
        </button>
      </div>

      <div className="purchase-fulfilment">
        <div><MapPin aria-hidden="true" /><span><strong>{siteConfig.pickupLocationLabel} pickup by appointment</strong><small>Earliest pickup is 26 August 2026. Wait for an emailed collection time and private address before travelling.</small></span></div>
        <div><Package aria-hidden="true" /><span><strong>Australia-wide delivery</strong><small>{product.category === "goggles" ? "$8 for goggles ordered on their own." : "Helmet delivery is calculated by destination."}</small></span></div>
      </div>

      <div className="mobile-purchase-bar">
        <div><span>{product.shortName ?? product.name}</span><strong>{formatPrice(product.price)}</strong></div>
        <button type="button" className="button button--primary" onClick={() => {
          addToCart();
        }} disabled={Boolean(variant && stock < 1)}>{variant && stock < 1 ? "Sold out" : "Add to cart"}</button>
      </div>
    </div>
  );
}
