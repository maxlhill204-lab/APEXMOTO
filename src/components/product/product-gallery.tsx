"use client";

import { ProductVisual } from "@/components/product/product-visual";
import type { Product } from "@/types/product";
import { useEffect, useState } from "react";

export function ProductGallery({ product }: { product: Product }) {
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    const updateForOption = (event: Event) => {
      const detail = (event as CustomEvent<{ productId?: string; valueLabel?: string }>).detail;
      if (detail.productId !== product.id || !detail.valueLabel) return;
      const imageIndex = product.images.findIndex((image) => image.colour === detail.valueLabel);
      if (imageIndex >= 0) setSelected(imageIndex);
    };
    window.addEventListener("apex-moto:product-option", updateForOption);
    return () => window.removeEventListener("apex-moto:product-option", updateForOption);
  }, [product]);
  return (
    <div className="product-gallery">
      <div className="product-gallery__main"><ProductVisual product={product} image={product.images[selected]} priority sizes="(max-width: 900px) 100vw, 58vw" /></div>
      {product.images.length > 1 ? (
        <div className="product-gallery__thumbs" role="tablist" aria-label={`${product.name} images`}>
          {product.images.map((image, index) => (
            <button type="button" role="tab" aria-selected={selected === index} aria-label={`Show image ${index + 1}: ${image.alt}`} key={`${image.src}-${index}`} onClick={() => setSelected(index)}>
              <ProductVisual product={product} image={image} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
