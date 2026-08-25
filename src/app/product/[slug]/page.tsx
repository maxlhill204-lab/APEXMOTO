import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { getSiteUrl, siteConfig } from "@/config/site";
import { catalog, getProductBySlug, totalStock } from "@/lib/products";
import { getLiveCatalog } from "@/lib/live-catalog";
import Link from "next/link";

export const dynamicParams = false;
export const dynamic = "force-dynamic";
export const generateStaticParams = () => catalog.map((product) => ({ slug: product.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  const title = product.seo?.title ?? product.name;
  const description = product.seo?.description ?? product.shortDescription;
  const image = product.images.find((item) => !item.placeholder);
  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} — ${new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(product.price / 100)}`,
      description,
      url: `/product/${product.slug}`,
      ...(image ? { images: [{ url: image.src, width: image.width, height: image.height, alt: image.alt }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const liveCatalog = await getLiveCatalog();
  const product = liveCatalog.find((item) => item.slug === slug);
  if (!product) notFound();
  const related = (product.relatedProductIds ?? []).map((id) => liveCatalog.find((item) => item.id === id)).filter((item) => item !== undefined).slice(0, 3);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.id,
    brand: { "@type": "Brand", name: siteConfig.businessName },
    offers: {
      "@type": "Offer",
      url: `${getSiteUrl()}/product/${product.slug}`,
      priceCurrency: "AUD",
      price: (product.price / 100).toFixed(2),
      availability: totalStock(product) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  return (
    <div className="product-page">
      <div className="container product-breadcrumbs"><Link href="/shop">Shop</Link><span>/</span><Link href={`/shop?category=${product.category}`}>{product.category}</Link><span>/</span><span>{product.name}</span></div>
      <section className="container product-layout"><ProductGallery product={product} /><PurchasePanel product={product} /></section>
      <section className="container product-information">
        <div><p className="eyebrow eyebrow--accent">About this product</p><h2>Details, clearly.</h2><p>{product.description}</p></div>
        <div className="product-information__panels">
          {product.features?.length ? <article><h3>Features</h3><ul>{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></article> : null}
          {product.specifications?.length ? <article><h3>Published product details</h3><dl>{product.specifications.map((specification) => <div key={specification.label}><dt>{specification.label}</dt><dd>{specification.value}</dd></div>)}</dl></article> : null}
          {product.inTheBox?.length ? <article><h3>In the box</h3><ul>{product.inTheBox.map((item) => <li key={item}>{item}</li>)}</ul></article> : null}
          {product.category !== "goggles" ? <article><h3>Helmet marking</h3>{product.certification?.standard ? <p><strong>{product.certification.standard}</strong>{product.certification.approvalNumber ? ` — ${product.certification.approvalNumber}` : ""}. This records what is visible on the supplied product image; no separate independent test report or Australian approval has been provided.</p> : <p>Check applicable helmet requirements for your intended use before riding.</p>}<Link href="/safety" className="text-link">Read the full helmet information</Link></article> : null}
        </div>
      </section>
      {related.length ? <section className="section related-products"><div className="container"><div className="section-heading"><div><p className="eyebrow">Complete the setup</p><h2>You may also need</h2></div></div><div className="product-grid product-grid--related">{related.map((item) => <ProductCard product={item} key={item.id} />)}</div></div></section> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema).replace(/</g, "\\u003c") }} />
    </div>
  );
}
