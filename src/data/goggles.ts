import { siteConfig } from "@/config/site";
import type { Product } from "@/types/product";

const range = [
  { colour: "black-silver", title: "Black with Silver Lens", stock: 8 },
  { colour: "black-blue", title: "Black with Blue Lens", stock: 2 },
  { colour: "black-gold", title: "Black with Gold Lens", stock: 1, clearance: true },
  { colour: "red-gold-orz", title: "Red with Gold Lens (Orz Strap)", stock: 1, clearance: true },
  { colour: "black-black", title: "Black with Black Lens", stock: 0 },
  { colour: "grey-black", title: "Grey with Black Lens", stock: 0 },
  { colour: "blue-black", title: "Blue with Black Lens", stock: 0 },
  { colour: "white-silver", title: "White with Silver Lens", stock: 0 },
  { colour: "orange-blue", title: "Orange with Blue Lens", stock: 0 },
  { colour: "pink-blue", title: "Pink with Blue Lens", stock: 0 },
  { colour: "red-gold-white-strap", title: "Red with Gold Lens (White Strap Logo)", stock: 0 },
  { colour: "red-gold-yellow-strap", title: "Red with Gold Lens (Yellow Strap Logo)", stock: 0 },
];

export const goggleProducts: Product[] = range.map(({ colour, title, stock, clearance }) => {
  const id = `mx-goggles-${colour}`;
  return {
    businessId: siteConfig.businessId,
    id,
    slug: id,
    name: title,
    category: "goggles",
    description: `MX goggles in the ${title.toLowerCase()} colourway, with an adjustable strap.`,
    shortDescription: "MX goggles with an adjustable strap.",
    price: clearance ? 2000 : 2500,
    ...(clearance ? { compareAtPrice: 2500, clearance: true } : {}),
    images: [{ src: `/products/goggle-range/${colour}.webp`, alt: `MX goggles: ${title}, front and side views`, width: 1440, height: 1080 }],
    options: [{ id: "colour", label: "Colour", values: [{ value: colour, label: title }] }],
    variants: [
      { id: `goggles-${colour}`, options: { colour }, stock, inventory: [{ sku: colour === "blue-black" ? "orz-goggles-blue-frame-black-lens" : `orz-goggles-${colour}`, quantity: 1 }] },
      ...(!clearance ? [{ id: `preorder-${colour}`, options: { colour }, stock: 10, inventory: [], preorder: true as const }] : []),
    ],
  };
});
