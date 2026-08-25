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
  tagline: "Ride hard. Pay fair.",
  description:
    "Straightforward APEX MOTO off-road helmets and goggles with published product details, fair pricing, Melbourne pickup and Australia-wide delivery.",
  email: "max@apexmoto.com.au",
  phone: "",
  instagramUrl: "https://www.instagram.com/apexmotostore.au/",
  facebookUrl: "https://www.facebook.com/share/19NopJFaeu/",
  pickupSuburb: "Newport",
  pickupLocationLabel: "Newport, VIC",
  pickupExactAddressDisclosure:
    "The exact pickup address and available collection times are confirmed by email within 24 hours of ordering.",
  pickupAppointmentRequired: true,
  pickupSameDayAvailable: false,
  pickupNextAvailableDate: "2026-09-02",
  shippingNextAvailableDate: "2026-09-02",
  pickupWindow: "By appointment — address and available collection times are confirmed within 24 hours",
  city: "Melbourne",
  state: "Victoria",
  country: "Australia",
  currency: "AUD",
  gogglesShippingPrice: 800,
  maxIncludedGogglesWithHelmet: 3,
  promotionPercent: 20,
  promotionStartsAt: "2026-08-24T00:00:00+10:00",
  promotionEndsAt: "2026-08-27T00:00:00+10:00",
  promotionEndsLabel: "tomorrow night, 26 August 2026, Melbourne time",
  promotionShortLabel: "20% off · ends tomorrow night",
  announcementBarText: "20% OFF SITEWIDE · ENDS TOMORROW NIGHT ·",
  announcementBarEndedText: "SALE ENDED · REGULAR PRICES RESTORED",
  supportHours: "Customer support replies within 12–48 hours",
  supportResponseHoursMin: 12,
  supportResponseHoursMax: 48,
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
  return process.env.NODE_ENV === "production"
    ? "https://apexmoto.vercel.app"
    : "http://localhost:3000";
};

export const formatPrice = (priceInCents: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: siteConfig.currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  }).format(priceInCents / 100);

export const publicContactEmail = () => siteConfig.email.trim() || null;
