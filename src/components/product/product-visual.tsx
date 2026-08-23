import Image from "next/image";
import type { Product, ProductImage } from "@/types/product";

type ProductVisualProps = {
  product: Product;
  image?: ProductImage;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

export function ProductVisual({
  product,
  image = product.images[0],
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
}: ProductVisualProps) {
  if (product.category === "bundle" && image.src === product.images[0]?.src) {
    return (
      <div
        className={`product-visual product-visual--bundle-composite ${className}`}
        role="img"
        aria-label="ORZ matte black helmet, black and yellow-gold goggles, and included helmet bag"
      >
        <Image className="bundle-composite__helmet" src="/products/orz-rally-helmet-black/side.png" alt="" width={939} height={831} priority={priority} />
        <Image className="bundle-composite__goggles" src="/products/orz-mx-goggles/black-gold.png" alt="" width={951} height={672} />
        <Image className="bundle-composite__bag" src="/products/orz-helmet-goggles-bundle/helmet-bag.png" alt="" width={436} height={437} />
      </div>
    );
  }

  if (image.placeholder) {
    return (
      <div
        className={`product-visual product-visual--placeholder product-visual--${product.category} ${className}`}
        role="img"
        aria-label={image.alt}
      >
        <div className="product-visual__grain" aria-hidden="true" />
        <div className="product-visual__shape" aria-hidden="true">
          <span />
        </div>
        <div className="product-visual__label">
          <strong>PRODUCT PHOTO</strong>
          <span>{product.shortName ?? product.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`product-visual ${className}`}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={priority}
        loading={priority ? "eager" : undefined}
        sizes={sizes}
        className="product-visual__image"
      />
    </div>
  );
}
