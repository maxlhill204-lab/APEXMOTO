import { HelmetStage } from "@/components/home/helmet-stage";
import { ProductCard } from "@/components/product/product-card";
import { ProductVisual } from "@/components/product/product-visual";
import { formatPrice, siteConfig } from "@/config/site";
import { getLiveCatalog } from "@/lib/live-catalog";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = await getLiveCatalog();
  const black = catalog.find((product) => product.id === "helmet-matte-black")!;
  const goggles = catalog.find((product) => product.id === "goggles-orz")!;
  const bundle = catalog.find((product) => product.id === "bundle-helmet-goggles")!;

  return (
    <>
      <section className="lux-hero" aria-labelledby="lux-title">
        <div className="lux-hero__grain" aria-hidden="true" />
        <div className="container lux-hero__grid">
          <div className="lux-hero__copy">
            <p className="lux-kicker"><span>APEX MOTO</span><span>OFF-ROAD / AUSTRALIA</span></p>
            <h1 id="lux-title">Made for<br /><em>the ride.</em></h1>
            <p className="lux-hero__intro">Off-road helmets and goggles with a sharper point of view. Real product details. Straight prices. Gear you can make your own.</p>
            <div className="lux-hero__actions">
              <Link href="/shop" className="button button--primary">Explore the range <ArrowUpRight size={18} aria-hidden="true" /></Link>
              <Link href="/size-guide" className="lux-underlink">Find your fit <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
            <div className="lux-hero__meta"><span>01 — HELMETS</span><span>02 — GOGGLES</span><span>03 — THE SETUP</span></div>
          </div>
          <HelmetStage />
        </div>
        <div className="lux-hero__scroll"><span>SCROLL TO EXPLORE</span><ArrowDownRight size={19} aria-hidden="true" /></div>
      </section>

      <section className="lux-statement" aria-label="Our approach">
        <div className="container lux-statement__inner">
          <p className="lux-overline">A MORE DIRECT WAY TO RIDE</p>
          <p>Good gear should speak <em>for itself.</em></p>
          <span>We keep the range focused, the details visible, and the price grounded.</span>
        </div>
      </section>

      <section className="lux-collection section" id="collection">
        <div className="container">
          <div className="lux-section-head">
            <div><p className="lux-overline">THE COLLECTION / 001</p><h2>Built around<br /><em>your ride.</em></h2></div>
            <div className="lux-section-head__aside"><p>Two helmet finishes. Five goggle colourways. One considered setup.</p><Link href="/shop" className="lux-underlink">View all gear <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
          </div>
          <div className="lux-collection__grid">
            <Link href="/shop?category=helmet" className="lux-category lux-category--helmet">
              <span className="lux-category__number">01 / HELMETS</span>
              <ProductVisual product={black} sizes="(max-width: 800px) 100vw, 60vw" />
              <span className="lux-category__foot"><span><strong>The rally helmet</strong><small>From {formatPrice(black.price)} · Two finishes</small></span><ArrowUpRight aria-hidden="true" /></span>
            </Link>
            <Link href="/shop?category=goggles" className="lux-category lux-category--goggles">
              <span className="lux-category__number">02 / GOGGLES</span>
              <ProductVisual product={goggles} sizes="(max-width: 800px) 100vw, 40vw" />
              <span className="lux-category__foot"><span><strong>MX goggles</strong><small>{formatPrice(goggles.price)} · Five colourways</small></span><ArrowUpRight aria-hidden="true" /></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="lux-details section">
        <div className="container lux-details__grid">
          <div className="lux-details__title"><p className="lux-overline">THE DETAILS / 002</p><h2>Nothing<br />to hide.</h2><p>What is known about the product is here to read. What has not been independently verified is clearly identified.</p><Link href="/safety" className="lux-underlink">Helmet information <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
          <div className="lux-details__list">
            <div><span>01</span><div><h3>Published specifications</h3><p>Material, approximate weight, fit chart and supplied product markings are available on the product page.</p></div></div>
            <div><span>02</span><div><h3>Stock close to home</h3><p>Current stock is held in Melbourne. Newport pickup is available by appointment.</p></div></div>
            <div><span>03</span><div><h3>Clear pricing</h3><p>Prices are shown in Australian dollars, with delivery details before checkout.</p></div></div>
          </div>
        </div>
      </section>

      <section className="lux-products section">
        <div className="container">
          <div className="lux-section-head"><div><p className="lux-overline">SHOP THE RANGE / 003</p><h2>Choose your<br /><em>setup.</em></h2></div><Link href="/shop" className="lux-underlink">Shop all products <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
          <div className="product-grid">{catalog.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </div>
      </section>

      <section className="lux-bundle section">
        <div className="container lux-bundle__grid">
          <div className="lux-bundle__visual"><span>THE COMPLETE SETUP / 004</span><ProductVisual product={bundle} sizes="(max-width: 800px) 100vw, 55vw" /></div>
          <div className="lux-bundle__copy"><p className="lux-overline">ONE CONSIDERED PACKAGE</p><h2>All in.<br /><em>Ready out.</em></h2><p>Choose an available helmet size and finish, then pick your goggle colour. A helmet storage bag is included.</p><div className="lux-bundle__price"><span>HELMET + GOGGLES + BAG</span><strong>{formatPrice(bundle.price)}</strong></div><Link href={`/product/${bundle.slug}`} className="button button--primary">Explore the bundle <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
        </div>
      </section>

      <section className="lux-fit section"><div className="container lux-fit__grid"><div><p className="lux-overline">BEFORE YOU RIDE / 005</p><h2>Get the fit.<br /><em>Know the facts.</em></h2></div><div className="lux-fit__links"><Link href="/size-guide"><span>01 / SIZE GUIDE</span><strong>Measure with confidence</strong><ArrowUpRight aria-hidden="true" /></Link><Link href="/shipping"><span>02 / DELIVERY</span><strong>See your shipping options</strong><ArrowUpRight aria-hidden="true" /></Link><Link href="/contact"><span>03 / QUESTIONS</span><strong>Speak directly with us</strong><ArrowUpRight aria-hidden="true" /></Link></div></div></section>

      <section className="lux-end"><div className="container"><p className="lux-overline">{siteConfig.businessName} / AUSTRALIA</p><h2>Ride hard.<br /><em>Pay fair.</em></h2><div><Link href="/shop" className="button button--primary">Shop the range <ArrowUpRight size={18} aria-hidden="true" /></Link><a href={siteConfig.instagramUrl} target="_blank" rel="noreferrer" className="lux-underlink">Instagram <ArrowUpRight size={17} aria-hidden="true" /></a></div></div></section>
    </>
  );
}
