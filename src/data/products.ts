import { siteConfig } from "@/config/site";
import type { Product } from "@/types/product";

const helmetSizes = ["S", "M", "L", "XL", "XXL"].map((size) => ({
  value: size,
  label: size,
}));

const goggleColours = [
  { value: "black-gold", label: "Black / Yellow-Gold", swatch: "#171717" },
  { value: "red-gold", label: "Pink / Red", swatch: "#d82f52" },
  { value: "grey-ice", label: "Grey / Teal", swatch: "#718d91" },
  { value: "blue-black", label: "Blue / Black", swatch: "#2159a8" },
];

const blackHelmetStock: Record<string, number> = { S: 1, M: 2, L: 2, XL: 2, XXL: 0 };
const whiteHelmetStock: Record<string, number> = { S: 0, M: 1, L: 1, XL: 0, XXL: 0 };

const helmetSku = (colour: "black" | "white", size: string) =>
  `orz-helmet-${colour}-${size.toLowerCase()}`;
const gogglesSku = (colour: string) => `orz-goggles-${colour}`;

/**
 * OWNER PRODUCT EDITING AREA
 *
 * Prices use cents. Stock is set on the exact colour/size combination.
 * Checkout prices are derived from this server-owned catalogue.
 */
export const products: Product[] = [
  {
    businessId: siteConfig.businessId,
    id: "helmet-matte-black",
    slug: "orz-rally-helmet-matte-black",
    name: "ORZ Rally Helmet — Matte Black",
    shortName: "Matte Black Helmet",
    category: "helmet",
    description:
      "A lightweight ORZ off-road helmet in matte black. The supplied product sheet lists an ABS shell, an approximate weight of 1080 g, and a rear DOT FMVSS No. 218 marking.",
    shortDescription:
      "Matte black ORZ helmet available in S, M, L and XL.",
    price: 12495,
    images: [
      {
        src: "/products/orz-rally-helmet-black/side.png",
        alt: "Matte black ORZ rally motocross helmet viewed from the side",
        width: 939,
        height: 831,
        colour: "Matte Black",
      },
      {
        src: "/products/orz-rally-helmet-black/specifications.png",
        alt: "Supplied ORZ helmet specifications, DOT marking and size guide",
        width: 941,
        height: 1672,
        colour: "Matte Black",
      },
    ],
    options: [
      {
        id: "colour",
        label: "Colour",
        values: [{ value: "matte-black", label: "Matte Black", swatch: "#171717" }],
      },
      { id: "size", label: "Size", values: helmetSizes },
    ],
    variants: helmetSizes.map(({ value }) => ({
      id: `black-${value.toLowerCase()}`,
      options: { colour: "matte-black", size: value },
      stock: blackHelmetStock[value],
      inventory: [{ sku: helmetSku("black", value), quantity: 1 }],
    })),
    features: ["ABS shell", "Approx. 1080 g", "Extended off-road peak", "Rear ventilation"],
    specifications: [
      { label: "Brand", value: "ORZ" },
      { label: "Type", value: "Rally / off-road helmet" },
      { label: "Material", value: "ABS" },
      { label: "Approx. weight", value: "1080 g" },
    ],
    certification: { standard: "DOT FMVSS No. 218", verified: true },
    featured: true,
    bestSeller: true,
    relatedProductIds: ["goggles-orz", "bundle-helmet-goggles"],
  },
  {
    businessId: siteConfig.businessId,
    id: "helmet-gloss-white",
    slug: "orz-rally-helmet-gloss-white",
    name: "ORZ Rally Helmet — White / Blue",
    shortName: "White / Blue Helmet",
    category: "helmet",
    description:
      "The same ORZ off-road helmet in a white and blue finish. Current availability is limited to Medium and Large.",
    shortDescription: "White and blue ORZ helmet available in M and L.",
    price: 12495,
    images: [
      {
        src: "/products/orz-rally-helmet-white/side.png",
        alt: "White and blue ORZ rally motocross helmet viewed from the side",
        width: 931,
        height: 806,
        colour: "White / Blue",
      },
    ],
    options: [
      {
        id: "colour",
        label: "Colour",
        values: [{ value: "gloss-white", label: "White / Blue", swatch: "#f1f1ed" }],
      },
      { id: "size", label: "Size", values: helmetSizes },
    ],
    variants: helmetSizes.map(({ value }) => ({
      id: `white-${value.toLowerCase()}`,
      options: { colour: "gloss-white", size: value },
      stock: whiteHelmetStock[value],
      ...(value === "L" ? { pickupAvailableFrom: "2026-09-07" } : {}),
      inventory: [{ sku: helmetSku("white", value), quantity: 1 }],
    })),
    features: ["ABS shell", "Approx. 1080 g", "Extended off-road peak", "Rear ventilation"],
    specifications: [
      { label: "Brand", value: "ORZ" },
      { label: "Type", value: "Rally / off-road helmet" },
      { label: "Material", value: "ABS" },
      { label: "Approx. weight", value: "1080 g" },
    ],
    certification: { standard: "DOT FMVSS No. 218", verified: true },
    featured: true,
    bestSeller: true,
    relatedProductIds: ["goggles-orz", "bundle-helmet-goggles"],
  },
  {
    businessId: siteConfig.businessId,
    id: "goggles-orz",
    slug: "orz-mx-goggles",
    name: "ORZ MX Goggles",
    shortName: "ORZ Goggles",
    category: "goggles",
    description:
      "ORZ motocross goggles in four frame and lens combinations. Buy them on their own for $25, or add a pair to a helmet bundle for $20.",
    shortDescription: "Four colours. $25 alone or $20 with a helmet.",
    price: 2500,
    images: [
      {
        src: "/products/orz-mx-goggles/black-gold.png",
        alt: "ORZ motocross goggles with a black frame and yellow-gold mirrored lens",
        width: 951,
        height: 672,
        colour: "Black / Yellow-Gold",
      },
      {
        src: "/products/orz-mx-goggles/red-gold.png",
        alt: "ORZ motocross goggles in the pink and red colourway",
        width: 951,
        height: 677,
        colour: "Pink / Red",
      },
      {
        src: "/products/orz-mx-goggles/grey-ice.png",
        alt: "ORZ motocross goggles with a grey frame and teal mirrored lens",
        width: 953,
        height: 675,
        colour: "Grey / Teal",
      },
    ],
    options: [{ id: "colour", label: "Colour", values: goggleColours }],
    variants: goggleColours.map(({ value }) => ({
      id: `goggles-${value}`,
      options: { colour: value },
      stock: 1,
      inventory: [{ sku: gogglesSku(value), quantity: 1 }],
    })),
    featured: true,
    bestSeller: true,
    relatedProductIds: ["helmet-matte-black", "helmet-gloss-white", "bundle-helmet-goggles"],
  },
  {
    businessId: siteConfig.businessId,
    id: "bundle-helmet-goggles",
    slug: "orz-helmet-goggles-bundle",
    name: "ORZ Helmet + Goggles Bundle",
    shortName: "Helmet + Goggles Bundle",
    category: "bundle",
    description:
      "Choose an available helmet colour and size, add any ORZ goggle colour for $20, and receive the helmet storage bag at no extra cost.",
    shortDescription: "Helmet, your choice of goggles, and a free helmet bag.",
    price: 14495,
    images: [
      {
        src: "/products/orz-rally-helmet-black/side.png",
        alt: "Matte black ORZ helmet included in the helmet and goggles bundle",
        width: 939,
        height: 831,
        colour: "Matte Black",
      },
      {
        src: "/products/orz-mx-goggles/black-gold.png",
        alt: "Black and yellow-gold ORZ goggles available in the bundle",
        width: 951,
        height: 672,
        colour: "Black / Yellow-Gold",
      },
      {
        src: "/products/orz-helmet-goggles-bundle/helmet-bag.png",
        alt: "Black drawstring helmet storage bag included free with the bundle",
        width: 436,
        height: 437,
      },
    ],
    options: [
      {
        id: "helmet-colour",
        label: "Helmet colour",
        values: [
          { value: "matte-black", label: "Matte Black", swatch: "#171717" },
          { value: "gloss-white", label: "White / Blue", swatch: "#f1f1ed" },
        ],
      },
      { id: "helmet-size", label: "Helmet size", values: helmetSizes },
      { id: "goggles", label: "Goggles colour", values: goggleColours },
    ],
    variants: [
      ...helmetSizes.flatMap(({ value: size }) =>
        goggleColours.map(({ value: goggles }) => ({
          id: `bundle-black-${size.toLowerCase()}-${goggles}`,
          options: { "helmet-colour": "matte-black", "helmet-size": size, goggles },
          stock: Math.min(blackHelmetStock[size], 1),
          inventory: [
            { sku: helmetSku("black", size), quantity: 1 },
            { sku: gogglesSku(goggles), quantity: 1 },
          ],
        })),
      ),
      ...helmetSizes.flatMap(({ value: size }) =>
        goggleColours.map(({ value: goggles }) => ({
          id: `bundle-white-${size.toLowerCase()}-${goggles}`,
          options: { "helmet-colour": "gloss-white", "helmet-size": size, goggles },
          stock: Math.min(whiteHelmetStock[size], 1),
          ...(size === "L" ? { pickupAvailableFrom: "2026-09-07" } : {}),
          inventory: [
            { sku: helmetSku("white", size), quantity: 1 },
            { sku: gogglesSku(goggles), quantity: 1 },
          ],
        })),
      ),
    ],
    inTheBox: ["ORZ rally helmet", "ORZ MX goggles", "Helmet storage bag — included free"],
    certification: { standard: "DOT FMVSS No. 218 (helmet)", verified: true },
    featured: true,
    bestSeller: true,
    bundleComponentIds: ["helmet-matte-black", "goggles-orz"],
    relatedProductIds: ["helmet-matte-black", "goggles-orz"],
  },
];
