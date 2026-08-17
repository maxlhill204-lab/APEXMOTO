export type HelmetShippingRegion = {
  id: string;
  label: string;
  price: number | null;
  estimate?: string;
  quoteRequired?: boolean;
};

export const helmetShippingRegions: HelmetShippingRegion[] = [
  { id: "melbourne", label: "Melbourne metro", price: 2520 },
  { id: "sydney", label: "Sydney metro", price: 3000 },
  { id: "adelaide", label: "Adelaide metro", price: 3000 },
  { id: "brisbane", label: "Brisbane metro", price: 3180 },
  { id: "perth", label: "Perth metro", price: 3945 },
  {
    id: "regional-qld",
    label: "Regional Queensland",
    price: null,
    estimate: "$38–$42",
    quoteRequired: true,
  },
  {
    id: "regional-wa",
    label: "Regional Western Australia",
    price: null,
    estimate: "$49–$52",
    quoteRequired: true,
  },
  { id: "northern-territory", label: "Northern Territory", price: 5100 },
  { id: "tasmania", label: "Tasmania", price: 3200 },
];

export const siteConfig = {
  businessId: "apex-moto-au",
  businessName: "APEX MOTO",
  shortName: "APEX",
  tagline: "Ride at the apex.",
  description:
    "ORZ motocross helmets and goggles from APEX MOTO, with Melbourne pickup and Australia-wide delivery.",
  email: "apexmotostore.au@gmail.com",
  phone: "",
  instagramUrl: "https://www.instagram.com/apexmotostore.au/",
  facebookUrl: "https://www.facebook.com/share/19NopJFaeu/",
  pickupSuburb: "Newport",
  city: "Melbourne",
  state: "Victoria",
  country: "Australia",
  currency: "AUD",
  gogglesShippingPrice: 800,
  maxIncludedGogglesWithHelmet: 3,
  announcementBarText:
    "NEWPORT PICKUP  /  AUSTRALIA-WIDE DELIVERY",
  supportHours: "Replies by email or Instagram",
  shippingProcessingText:
    "Dispatch timing is confirmed with the order while the store is operating with limited local stock.",
  trackingOffered: false,
  changeOfMindReturns: false,
  sizingExchanges: false,
  legalEntityName: "",
  abn: "",
} as const;

export const getSiteUrl = () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (["http:", "https:"].includes(url.protocol) && url.origin !== "null") {
        return url.origin;
      }
    } catch {
      // Fall through to the safe local development origin.
    }
  }
  return "http://localhost:3000";
};

export const formatPrice = (priceInCents: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: siteConfig.currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  }).format(priceInCents / 100);

export const publicContactEmail = () => siteConfig.email.trim() || null;
