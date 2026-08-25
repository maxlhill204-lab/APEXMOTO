import type { ShippingCountry } from "@/types/shipping";

export const SHIPPING_ORIGIN = {
  country: "AU" as const,
  postcode: "3015",
};

const DEFAULT_COUNTRY_CODES = [
  "AU", "NZ", "GB", "DE", "FR", "IT", "ES", "NL", "BE", "AT", "IE", "PT",
  "DK", "SE", "NO", "FI", "CH", "PL", "CZ", "US", "CA", "JP", "SG",
] as const;

const PRIORITY_COUNTRIES = new Set(["AU", "NZ", "GB", "DE", "FR", "IT", "ES", "NL", "BE"]);

const displayNames = new Intl.DisplayNames(["en-AU"], { type: "region" });

export function configuredCountryCodes() {
  const configured = process.env.AUSPOST_SHIPPING_COUNTRIES
    ?.split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => /^[A-Z]{2}$/.test(value));
  return [...new Set(configured?.length ? configured : DEFAULT_COUNTRY_CODES)];
}

export function configuredShippingCountries(): ShippingCountry[] {
  return configuredCountryCodes()
    .map((code) => ({ code, name: displayNames.of(code) ?? code, priority: PRIORITY_COUNTRIES.has(code) }))
    .sort((left, right) => Number(right.priority) - Number(left.priority) || left.name.localeCompare(right.name));
}

const positiveNumber = (name: string) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const positiveInteger = (name: string) => {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : null;
};

export type ShippingMeasurements = {
  helmet: { packedWeightKg: number; lengthCm: number; widthCm: number; heightCm: number; itemWeightKg: number };
  goggles: { packedWeightKg: number; addonWeightKg: number; lengthCm: number; widthCm: number; heightCm: number; itemWeightKg: number; unitsPerParcel: number };
  bag: { itemWeightKg: number };
};

export type CustomsProductConfig = {
  helmet: { description: string; hsTariffCode: string; countryOfOrigin: string };
  goggles: { description: string; hsTariffCode: string; countryOfOrigin: string };
  bag: { description: string; hsTariffCode: string; countryOfOrigin: string; unitValue: number };
};

export function getShippingMeasurements(): ShippingMeasurements | null {
  const values = {
    helmetPackedWeight: positiveNumber("AUSPOST_HELMET_PACKED_WEIGHT_KG"),
    helmetLength: positiveNumber("AUSPOST_HELMET_LENGTH_CM"),
    helmetWidth: positiveNumber("AUSPOST_HELMET_WIDTH_CM"),
    helmetHeight: positiveNumber("AUSPOST_HELMET_HEIGHT_CM"),
    helmetItemWeight: positiveNumber("AUSPOST_HELMET_ITEM_WEIGHT_KG"),
    gogglesPackedWeight: positiveNumber("AUSPOST_GOGGLES_PACKED_WEIGHT_KG"),
    gogglesAddonWeight: positiveNumber("AUSPOST_GOGGLES_ADDON_WEIGHT_KG"),
    gogglesLength: positiveNumber("AUSPOST_GOGGLES_LENGTH_CM"),
    gogglesWidth: positiveNumber("AUSPOST_GOGGLES_WIDTH_CM"),
    gogglesHeight: positiveNumber("AUSPOST_GOGGLES_HEIGHT_CM"),
    gogglesItemWeight: positiveNumber("AUSPOST_GOGGLES_ITEM_WEIGHT_KG"),
    gogglesUnitsPerParcel: positiveInteger("AUSPOST_GOGGLES_UNITS_PER_PARCEL"),
    bagItemWeight: positiveNumber("AUSPOST_BAG_ITEM_WEIGHT_KG"),
  };
  if (Object.values(values).some((value) => value === null)) return null;
  return {
    helmet: {
      packedWeightKg: values.helmetPackedWeight!, lengthCm: values.helmetLength!, widthCm: values.helmetWidth!,
      heightCm: values.helmetHeight!, itemWeightKg: values.helmetItemWeight!,
    },
    goggles: {
      packedWeightKg: values.gogglesPackedWeight!, addonWeightKg: values.gogglesAddonWeight!,
      lengthCm: values.gogglesLength!, widthCm: values.gogglesWidth!, heightCm: values.gogglesHeight!,
      itemWeightKg: values.gogglesItemWeight!, unitsPerParcel: values.gogglesUnitsPerParcel!,
    },
    bag: { itemWeightKg: values.bagItemWeight! },
  };
}

export function getCustomsProductConfig(): CustomsProductConfig | null {
  const helmet = {
    description: process.env.CUSTOMS_HELMET_DESCRIPTION?.trim() ?? "",
    hsTariffCode: process.env.CUSTOMS_HELMET_HS_CODE?.trim() ?? "",
    countryOfOrigin: process.env.CUSTOMS_HELMET_COUNTRY_OF_ORIGIN?.trim().toUpperCase() ?? "",
  };
  const goggles = {
    description: process.env.CUSTOMS_GOGGLES_DESCRIPTION?.trim() ?? "",
    hsTariffCode: process.env.CUSTOMS_GOGGLES_HS_CODE?.trim() ?? "",
    countryOfOrigin: process.env.CUSTOMS_GOGGLES_COUNTRY_OF_ORIGIN?.trim().toUpperCase() ?? "",
  };
  const bag = {
    description: process.env.CUSTOMS_BAG_DESCRIPTION?.trim() ?? "",
    hsTariffCode: process.env.CUSTOMS_BAG_HS_CODE?.trim() ?? "",
    countryOfOrigin: process.env.CUSTOMS_BAG_COUNTRY_OF_ORIGIN?.trim().toUpperCase() ?? "",
    unitValue: Number(process.env.CUSTOMS_BAG_UNIT_VALUE_CENTS),
  };
  const valid = [helmet, goggles, bag].every((item) =>
    item.description.length >= 5 && item.description.length <= 40 && /^\d{6,12}$/.test(item.hsTariffCode) && /^[A-Z]{2}$/.test(item.countryOfOrigin),
  ) && Number.isInteger(bag.unitValue) && bag.unitValue > 0;
  return valid ? { helmet, goggles, bag } : null;
}

export function calculatedShippingReadiness() {
  const missing: string[] = [];
  if (!process.env.AUSPOST_PAC_API_KEY?.trim()) missing.push("AUSPOST_PAC_API_KEY");
  if (!process.env.SHIPPING_QUOTE_SECRET?.trim() || process.env.SHIPPING_QUOTE_SECRET!.trim().length < 32) missing.push("SHIPPING_QUOTE_SECRET");
  if (!getShippingMeasurements()) missing.push("parcel measurements and packed weights");
  const domesticReady = missing.length === 0;
  const internationalMissing = [...missing];
  if (!getCustomsProductConfig()) internationalMissing.push("customs descriptions, HS codes and countries of origin");
  return {
    domesticReady,
    internationalReady: internationalMissing.length === 0,
    missing,
    internationalMissing,
  };
}
