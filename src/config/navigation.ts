export const mainNavigation = [
  { label: "Shop", href: "/shop" },
  { label: "Helmets", href: "/shop?category=helmet" },
  { label: "Goggles", href: "/shop?category=goggles" },
  { label: "Bundle", href: "/product/orz-helmet-goggles-bundle" },
  { label: "Size guide", href: "/size-guide" },
] as const;

export const mobileNavigation = [
  ...mainNavigation,
  { label: "Shipping", href: "/shipping" },
  { label: "Contact", href: "/contact" },
  { label: "Order help", href: "/order-help" },
] as const;
