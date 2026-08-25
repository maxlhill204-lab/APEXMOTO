import { ProductCard } from "@/components/product/product-card";
import { ProductVisual } from "@/components/product/product-visual";
import { formatPrice, siteConfig } from "@/config/site";
import { bundleIndividualTotal } from "@/lib/products";
import { getLiveCatalog } from "@/lib/live-catalog";
import { ArrowRight, BadgeDollarSign, FileSearch, MapPin, Ruler, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const liveCatalog = await getLiveCatalog();
  const heroProduct = liveCatalog.find((product) => product.id === "helmet-matte-black")!;
  const goggles = liveCatalog.find((product) => product.id === "goggles-orz")!;
  const bundle = liveCatalog.find((product) => product.id === "bundle-helmet-goggles")!;
  const individualTotal = bundleIndividualTotal(bundle) ?? bundle.price;
  const savings = individualTotal - bundle.price;
  const bundledGogglesPrice = bundle.price - heroProduct.price;

  return (
    <>
      <section className="hero apex-hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow eyebrow--accent">OFF-ROAD GEAR / HONEST PRICES</p>
            <h1><span>Ride hard.</span><br /><span>Pay fair.</span></h1>
            <p className="hero__lead">Straightforward helmets and goggles, published product details and local stock—without the inflated brand-name price.</p>
            <div className="button-row">
              <Link href="/shop" className="button button--primary">Shop the range <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link href="/product/apex-moto-helmet-goggles-bundle" className="button button--secondary">Build a bundle</Link>
            </div>
            <div className="hero__price-row" aria-label="Starting prices">
              <span><small>Helmets</small><strong>{formatPrice(heroProduct.price)}</strong></span>
              <span><small>Goggles</small><strong>{formatPrice(goggles.price)}</strong></span>
              <span><small>Bundle</small><strong>{formatPrice(bundle.price)}</strong></span>
            </div>
          </div>
          <div className="hero__visual">
            <ProductVisual product={heroProduct} priority sizes="(max-width: 800px) 100vw, 58vw" />
            <div className="hero__product-tag">
              <span>APEX MOTO RALLY HELMET</span>
              <strong>MATTE BLACK</strong>
              <b>{formatPrice(heroProduct.price)}</b>
            </div>
          </div>
        </div>
      </section>

      <section className="apex-service-strip" aria-label="Store information">
        <div className="container">
          <span><FileSearch aria-hidden="true" /> Product details published</span>
          <span><BadgeDollarSign aria-hidden="true" /> Straightforward pricing</span>
          <span><MapPin aria-hidden="true" /> Local Melbourne stock</span>
        </div>
      </section>

      <section className="section trust-section apex-value-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow eyebrow--accent">WHY APEX MOTO</p>
              <h2>The dirt does not care what logo you paid for.</h2>
            </div>
            <p>We keep the range tight, the information visible and the price grounded. No borrowed prestige. No vague superlatives. Just the product, the facts we can support and local help when you need it.</p>
          </div>
          <div className="trust-grid">
            <article><BadgeDollarSign aria-hidden="true" /><h3>Fair, visible pricing</h3><p>Our prices are shown up front. Promotions are temporary, dated and applied clearly at checkout.</p></article>
            <article><FileSearch aria-hidden="true" /><h3>Specs, not hype</h3><p>Materials, approximate weight, fit information and supplied markings are published where you can check them.</p></article>
            <article><ShieldCheck aria-hidden="true" /><h3>Claims kept honest</h3><p>We separate what is shown on the product from what has been independently documented, so you can choose with open eyes.</p></article>
            <article><MapPin aria-hidden="true" /><h3>Local support</h3><p>Current stock is held in Melbourne, with Newport pickup and direct help from APEX MOTO.</p></article>
          </div>
        </div>
      </section>

      <section className="section section--products">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow eyebrow--accent">THE RANGE</p><h2>Gear that earns its price.</h2></div>
            <Link href="/shop" className="text-link">Shop all <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className="product-grid">{liveCatalog.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </div>
      </section>

      <section className="section bundle-feature">
        <div className="container bundle-feature__grid">
          <div className="bundle-feature__visual">
            <ProductVisual product={bundle} sizes="(max-width: 800px) 100vw, 52vw" />
            <span className="bundle-feature__stamp">SAVE<br />{formatPrice(savings)}</span>
          </div>
          <div className="bundle-feature__copy">
            <p className="eyebrow eyebrow--accent">THE COMPLETE SETUP</p>
            <h2>Helmet. Goggles. Bag.</h2>
            <p>Choose an available helmet size and any of the five goggle colours. Goggles are {formatPrice(bundledGogglesPrice)} in the bundle during the sale, and the helmet bag is included free. One clear price for the setup you actually need.</p>
            <dl className="price-breakdown">
              <div><dt>Helmet</dt><dd>{formatPrice(heroProduct.price)}</dd></div>
              <div><dt>Goggles in bundle</dt><dd>{formatPrice(bundledGogglesPrice)}</dd></div>
              <div><dt>Helmet bag</dt><dd>Free</dd></div>
              <div className="price-breakdown__saving"><dt>Bundle total</dt><dd>{formatPrice(bundle.price)}</dd></div>
            </dl>
            <Link href={`/product/${bundle.slug}`} className="button button--primary">Choose your bundle <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="section apex-simple-info">
        <div className="container apex-simple-info__grid">
          <div>
            <p className="eyebrow eyebrow--accent">FIT</p>
            <h2>Measure before you order.</h2>
            <p>The supplied APEX MOTO chart covers S through XXL, from 53 to 62 cm.</p>
            <Link href="/size-guide" className="text-link">View size guide <Ruler size={16} aria-hidden="true" /></Link>
          </div>
          <div>
            <p className="eyebrow eyebrow--accent">DELIVERY</p>
            <h2>Know the cost up front.</h2>
            <p>Goggles ship for $8. Helmet delivery is priced by destination, with Newport pickup available.</p>
            <Link href="/shipping" className="text-link">See shipping prices <Truck size={16} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <div><p className="eyebrow eyebrow--accent">{siteConfig.businessName}</p><h2>Ride hard. Pay fair.</h2></div>
          <div className="button-row"><Link href="/shop" className="button button--primary">Shop now</Link><a href={siteConfig.instagramUrl} target="_blank" rel="noreferrer" className="button button--secondary">Instagram</a></div>
        </div>
      </section>
    </>
  );
}
