import { formatPrice } from "@/config/site";
import { getStockLabel, totalStock } from "@/lib/products";
import type { Product } from "@/types/product";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ProductVisual } from "./product-visual";

export function ProductCard({ product }: { product: Product }) {
  const sizes = product.options.find((option) => option.id.includes("size"));
  const stock = totalStock(product);
  return (
    <article className="product-card">
      <Link href={`/product/${product.slug}`} className="product-card__visual" aria-label={`View ${product.name}`}>
        <ProductVisual product={product} sizes="(max-width: 640px) 82vw, (max-width: 1100px) 42vw, 25vw" />
        <span className={`product-card__stock product-card__stock--${stock === 0 ? "out" : stock <= 3 ? "low" : "in"}`}>
          {getStockLabel(stock)}
        </span>
      </Link>
      <div className="product-card__body">
        <div>
          <p className="eyebrow">{product.category}</p>
          <h3><Link href={`/product/${product.slug}`}>{product.name}</Link></h3>
        </div>
        <p className="product-card__price">
          {formatPrice(product.price)}
          {product.compareAtPrice ? <del>{formatPrice(product.compareAtPrice)}</del> : null}
        </p>
        {product.compareAtPrice ? <p className="sale-note">10% off · 48-hour offer</p> : null}
        {sizes ? (
          <div className="product-card__sizes" aria-label={`Available sizes for ${product.name}`}>
            {sizes.values.map((size) => {
              const available = product.variants.some(
                (variant) =>
                  variant.options[sizes.id] === size.value && variant.stock > 0,
              );
              return <span className={!available ? "is-unavailable" : ""} key={size.value}>{size.label}</span>;
            })}
          </div>
        ) : null}
        <Link href={`/product/${product.slug}`} className="text-link">
          View {product.category === "helmet" ? "helmet" : product.category === "bundle" ? "bundle" : "goggles"}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
