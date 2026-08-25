import { SHIPPING_ORIGIN } from "@/config/shipping";
import type { ShippingParcel } from "@/types/shipping";

type RawService = { code?: unknown; name?: unknown; price?: unknown; delivery_time?: unknown };
type ServiceRate = { serviceCode: string; label: string; amount: number; deliveryEstimate: string | null };

export class AustraliaPostApiError extends Error {
  constructor(message = "Australia Post could not calculate delivery right now.") {
    super(message);
    this.name = "AustraliaPostApiError";
  }
}

const asArray = <T>(value: T | T[] | null | undefined): T[] => value == null ? [] : Array.isArray(value) ? value : [value];

function parseServices(payload: unknown): ServiceRate[] {
  if (!payload || typeof payload !== "object") throw new AustraliaPostApiError();
  const source = payload as { services?: { service?: RawService | RawService[] }; error?: { errorMessage?: unknown } };
  if (source.error) throw new AustraliaPostApiError(typeof source.error.errorMessage === "string" ? source.error.errorMessage : undefined);
  const services = asArray(source.services?.service).flatMap((service) => {
    const serviceCode = typeof service.code === "string" ? service.code : "";
    const label = typeof service.name === "string" ? service.name : "";
    const dollars = typeof service.price === "number" ? service.price : Number(service.price);
    if (!serviceCode || !label || !Number.isFinite(dollars) || dollars < 0) return [];
    return [{
      serviceCode,
      label,
      amount: Math.round(dollars * 100),
      deliveryEstimate: typeof service.delivery_time === "string" ? service.delivery_time : null,
    }];
  });
  if (!services.length) throw new AustraliaPostApiError("Australia Post has no parcel service for that destination and parcel.");
  return services;
}

function includedService(service: ServiceRate, international: boolean) {
  const searchable = `${service.serviceCode} ${service.label}`.toLowerCase();
  if (international) return /standard|express|_std_|_exp_/.test(searchable) && !/economy|sea|courier/.test(searchable);
  return /parcel_regular|parcel_express|parcel post|express post/.test(searchable);
}

async function servicesForParcel(parcel: ShippingParcel, country: string, postalCode: string, signal: AbortSignal) {
  const apiKey = process.env.AUSPOST_PAC_API_KEY?.trim();
  if (!apiKey) throw new AustraliaPostApiError("Calculated shipping is not configured.");
  const international = country !== "AU";
  const params = new URLSearchParams();
  let path: string;
  if (international) {
    path = "/postage/parcel/international/service.json";
    params.set("country_code", country);
    params.set("weight", String(parcel.weightKg));
  } else {
    path = "/postage/parcel/domestic/service.json";
    params.set("from_postcode", SHIPPING_ORIGIN.postcode);
    params.set("to_postcode", postalCode);
    params.set("length", String(parcel.lengthCm));
    params.set("width", String(parcel.widthCm));
    params.set("height", String(parcel.heightCm));
    params.set("weight", String(parcel.weightKg));
  }
  const baseUrl = process.env.AUSPOST_PAC_BASE_URL?.trim() || "https://digitalapi.auspost.com.au";
  const response = await fetch(`${baseUrl}${path}?${params}`, {
    headers: { "AUTH-KEY": apiKey, Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new AustraliaPostApiError();
  return parseServices(payload).filter((service) => includedService(service, international));
}

export async function quoteAustraliaPost(parcels: ShippingParcel[], country: string, postalCode: string): Promise<ServiceRate[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const parcelRates = await Promise.all(parcels.map((parcel) => servicesForParcel(parcel, country, postalCode, controller.signal)));
    const first = parcelRates[0] ?? [];
    const combined = first.flatMap((candidate) => {
      const matches = parcelRates.map((rates) => rates.find((rate) => rate.serviceCode === candidate.serviceCode));
      if (matches.some((match) => !match)) return [];
      const available = matches as ServiceRate[];
      return [{
        serviceCode: candidate.serviceCode,
        label: candidate.label,
        amount: available.reduce((total, rate) => total + rate.amount, 0),
        deliveryEstimate: available.map((rate) => rate.deliveryEstimate).find(Boolean) ?? null,
      }];
    });
    if (!combined.length) throw new AustraliaPostApiError("Australia Post has no common parcel service for every parcel in this order.");
    return combined.sort((left, right) => left.amount - right.amount);
  } catch (error) {
    if (error instanceof AustraliaPostApiError) throw error;
    throw new AustraliaPostApiError();
  } finally {
    clearTimeout(timeout);
  }
}
