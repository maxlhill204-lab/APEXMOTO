export type ShippingCountry = {
  code: string;
  name: string;
  priority: boolean;
};

export type ShippingParcel = {
  kind: "helmet" | "goggles";
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  helmetUnits: number;
  goggleUnits: number;
};

export type CustomsItemSnapshot = {
  description: string;
  quantity: number;
  unitWeightKg: number;
  totalWeightKg: number;
  unitValue: number;
  totalValue: number;
  hsTariffCode: string;
  countryOfOrigin: string;
};

export type CustomsSnapshot = {
  exportReason: "SALE_OF_GOODS";
  commercialValue: true;
  currency: "AUD";
  items: CustomsItemSnapshot[];
};

export type ShippingQuoteOption = {
  token: string;
  methodId: string;
  carrier: "Australia Post";
  serviceCode: string;
  label: string;
  amount: number;
  currency: "AUD";
  destinationCountry: string;
  destinationPostalCode: string;
  deliveryEstimate: string | null;
  parcelCount: number;
  expiresAt: string;
};

export type ShippingPublicConfig = {
  mode: "calculated" | "legacy";
  provider: "Australia Post";
  originCountry: "AU";
  countries: ShippingCountry[];
  internationalEnabled: boolean;
  message: string | null;
};

export type ShippingOrderSnapshot = {
  carrier: "Australia Post" | null;
  serviceCode: string | null;
  destinationCountry: string;
  destinationPostalCode: string;
  quoteExpiresAt: string | null;
  parcels: ShippingParcel[];
  customs: CustomsSnapshot | null;
};
