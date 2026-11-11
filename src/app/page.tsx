import { ProductCard } from "@/components/product/product-card";
import { getLiveCatalog } from "@/lib/live-catalog";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

const categories = [
  { title: "Helmets", href: "/shop?category=helmet", image: "/products/apex-moto-rally-helmet-black/side.png" },
  { title: "Goggles", href: "/shop?category=goggles", image: "/products/goggle-range/black-silver.webp" },
  { title: "Bundles", href: "/shop?category=bundle", image: "/products/apex-moto-helmet-goggles-bundle/new-helmet-bag.webp" },
];

export default async function HomePage() {
  const products = await getLiveCatalog();

  return (
    <div className="container store-home">
      <section aria-labelledby="store-title">
        <div className="catalog-heading"><h1 id="store-title">Shop off-road gear</h1></div>
        <div className="store-categories">
          {categories.map(({ title, href, image }) => (
            <Link key={href} href={href}>
              <div className="store-categories__image">
                <Image src={image} alt="" fill sizes="(max-width: 640px) 90vw, 30vw" />
              </div>
              <h2>{title}</h2>
            </Link>
          ))}
        </div>
      </section>
      <section aria-labelledby="range-title">
        <div className="catalog-heading"><h2 id="range-title">Shop the range</h2></div>
        <div className="product-grid">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>
    </div>
  );
}
