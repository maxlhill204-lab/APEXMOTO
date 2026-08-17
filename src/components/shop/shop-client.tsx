"use client";

import { ProductCard } from "@/components/product/product-card";
import { Drawer } from "@/components/ui/drawer";
import type { Product, ProductCategory } from "@/types/product";
import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

type Availability = "all" | "available";
type Sort = "featured" | "price-low" | "price-high" | "name";

type ShopClientProps = {
  products: Product[];
  initialCategory?: string;
  initialSearch?: string;
};

function normaliseSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/\bmedium\b/g, "m")
    .replace(/\blarge\b/g, "l")
    .replace(/\bextra large\b/g, "xl")
    .trim();
}

export function ShopClient({ products, initialCategory, initialSearch }: ShopClientProps) {
  const validCategory = ["helmet", "goggles", "bundle"].includes(initialCategory ?? "")
    ? (initialCategory as ProductCategory)
    : "all";
  const [category, setCategory] = useState<ProductCategory | "all">(validCategory);
  const [colour, setColour] = useState("all");
  const [size, setSize] = useState("all");
  const [availability, setAvailability] = useState<Availability>("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [query, setQuery] = useState(initialSearch ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const colours = useMemo(() => {
    const options = products.flatMap((product) =>
      product.options
        .filter((option) => option.id.includes("colour") || option.id === "goggles")
        .flatMap((option) => option.values),
    );
    return [...new Map(options.map((option) => [option.label, option])).values()];
  }, [products]);

  const sizes = useMemo(
    () => ["S", "M", "L", "XL", "XXL"],
    [],
  );

  const filtered = useMemo(() => {
    const normalized = normaliseSearch(query);
    const next = products.filter((product) => {
      if (category !== "all" && product.category !== category) return false;
      if (availability === "available" && !product.variants.some((variant) => variant.stock > 0)) return false;
      if (
        colour !== "all" &&
        !product.options.some((option) => option.values.some((value) => value.value === colour))
      ) return false;
      if (
        size !== "all" &&
        !product.variants.some(
          (variant) => Object.values(variant.options).includes(size) && variant.stock > 0,
        )
      ) return false;
      if (!normalized) return true;
      const haystack = normaliseSearch(
        [
          product.name,
          product.category,
          product.shortDescription,
          ...product.options.flatMap((option) => option.values.map((value) => value.label)),
        ].join(" "),
      );
      return normalized.split(/\s+/).every((term) => haystack.includes(term));
    });

    return [...next].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name);
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  }, [availability, category, colour, products, query, size, sort]);

  const activeFilterCount = [category !== "all", colour !== "all", size !== "all", availability !== "all"].filter(Boolean).length;
  const clearFilters = () => {
    setCategory("all");
    setColour("all");
    setSize("all");
    setAvailability("all");
    setQuery("");
  };

  const filterControls = (
    <div className="shop-filters__controls">
      <fieldset>
        <legend>Category</legend>
        {(["all", "helmet", "goggles", "bundle"] as const).map((value) => (
          <label key={value}><input type="radio" name="category" checked={category === value} onChange={() => setCategory(value)} /><span>{value === "all" ? "All gear" : `${value[0].toUpperCase()}${value.slice(1)}`}</span></label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Colour</legend>
        <label><input type="radio" name="colour" checked={colour === "all"} onChange={() => setColour("all")} /><span>All colours</span></label>
        {colours.map((option) => (
          <label key={option.value}><input type="radio" name="colour" checked={colour === option.value} onChange={() => setColour(option.value)} /><span><i style={{ backgroundColor: option.swatch }} />{option.label}</span></label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Size</legend>
        <div className="filter-size-grid">
          <button type="button" className={size === "all" ? "is-active" : ""} onClick={() => setSize("all")}>All</button>
          {sizes.map((option) => <button type="button" key={option} className={size === option ? "is-active" : ""} onClick={() => setSize(option)}>{option}</button>)}
        </div>
      </fieldset>
      <fieldset>
        <legend>Availability</legend>
        <label><input type="checkbox" checked={availability === "available"} onChange={(event) => setAvailability(event.target.checked ? "available" : "all")} /><span>In-stock variants only</span></label>
      </fieldset>
      {activeFilterCount || query ? <button type="button" className="clear-button" onClick={clearFilters}><X size={15} aria-hidden="true" /> Clear filters</button> : null}
    </div>
  );

  return (
    <div className="shop-layout">
      <aside className="shop-filters" aria-label="Product filters"><h2>Filter</h2>{filterControls}</aside>
      <div className="shop-results">
        <div className="shop-toolbar">
          <div className="shop-search"><label htmlFor="product-search">Search products</label><input id="product-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Black helmet, goggles, medium…" /></div>
          <button type="button" className="button button--secondary mobile-filter-button" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={17} aria-hidden="true" /> Filters {activeFilterCount ? `(${activeFilterCount})` : ""}</button>
          <div className="shop-sort"><label htmlFor="sort">Sort by</label><select id="sort" value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></div>
        </div>
        <p className="shop-result-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? "product" : "products"}</p>
        {filtered.length ? <div className="product-grid product-grid--shop">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>No products found.</h2><p>Try removing a filter or searching for a broader product term.</p><button className="button button--primary" type="button" onClick={clearFilters}>Clear filters</button></div>}
      </div>
      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filter products" side="left"><div className="mobile-filter-content">{filterControls}<button className="button button--primary button--wide" type="button" onClick={() => setFiltersOpen(false)}>Show {filtered.length} products</button></div></Drawer>
    </div>
  );
}
