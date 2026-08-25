import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { configuredCountryCodes } from "@/config/shipping";
import type { ResolvedCartItem } from "@/types/product";
import type { CustomsSnapshot, ShippingOrderSnapshot, ShippingParcel, ShippingQuoteOption } from "@/types/shipping";

const QUOTE_LIFETIME_MS = 15 * 60_000;

type QuotePayload = {
  version: 1;
  expiresAt: number;
  cartHash: string;
  methodId: string;
  carrier: "Australia Post";
  serviceCode: string;
  label: string;
  amount: number;
  destinationCountry: string;
  destinationPostalCode: string;
  deliveryEstimate: string | null;
  parcels: ShippingParcel[];
  customs: CustomsSnapshot | null;
};

export class ShippingQuoteError extends Error {
  constructor(public code: "SHIPPING_QUOTE_REQUIRED" | "SHIPPING_QUOTE_EXPIRED" | "SHIPPING_QUOTE_INVALID", message: string) {
    super(message);
    this.name = "ShippingQuoteError";
  }
}

export function shippingCartHash(items: ResolvedCartItem[]) {
  const canonical = items
    .map((item) => ({ key: item.key, quantity: item.quantity, unitAmount: item.product.price }))
    .sort((left, right) => left.key.localeCompare(right.key));
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

function secret() {
  const value = process.env.SHIPPING_QUOTE_SECRET?.trim();
  if (!value || value.length < 32) throw new ShippingQuoteError("SHIPPING_QUOTE_REQUIRED", "Calculated shipping is not configured.");
  return value;
}

function sign(encodedPayload: string) {
  return createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
}

export function createShippingQuoteOption(input: Omit<QuotePayload, "version" | "expiresAt" | "cartHash">, items: ResolvedCartItem[]): ShippingQuoteOption {
  const payload: QuotePayload = { ...input, version: 1, expiresAt: Date.now() + QUOTE_LIFETIME_MS, cartHash: shippingCartHash(items) };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${encoded}.${sign(encoded)}`;
  return {
    token,
    methodId: payload.methodId,
    carrier: payload.carrier,
    serviceCode: payload.serviceCode,
    label: payload.label,
    amount: payload.amount,
    currency: "AUD",
    destinationCountry: payload.destinationCountry,
    destinationPostalCode: payload.destinationPostalCode,
    deliveryEstimate: payload.deliveryEstimate,
    parcelCount: payload.parcels.length,
    expiresAt: new Date(payload.expiresAt).toISOString(),
  };
}

export function verifyShippingQuoteToken(token: unknown, items: ResolvedCartItem[]) {
  if (typeof token !== "string" || token.length < 40 || token.length > 16_000) {
    throw new ShippingQuoteError("SHIPPING_QUOTE_REQUIRED", "Calculate delivery before checkout.");
  }
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) throw new ShippingQuoteError("SHIPPING_QUOTE_INVALID", "The delivery quote could not be verified. Calculate it again.");
  const expected = Buffer.from(sign(encoded));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new ShippingQuoteError("SHIPPING_QUOTE_INVALID", "The delivery quote could not be verified. Calculate it again.");
  }
  let payload: QuotePayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as QuotePayload;
  } catch {
    throw new ShippingQuoteError("SHIPPING_QUOTE_INVALID", "The delivery quote could not be read. Calculate it again.");
  }
  if (payload.version !== 1 || payload.expiresAt <= Date.now()) {
    throw new ShippingQuoteError("SHIPPING_QUOTE_EXPIRED", "That delivery quote expired. Calculate a fresh price.");
  }
  if (payload.cartHash !== shippingCartHash(items)) {
    throw new ShippingQuoteError("SHIPPING_QUOTE_INVALID", "Your cart changed after the delivery quote. Calculate it again.");
  }
  if (!configuredCountryCodes().includes(payload.destinationCountry) || !/^\d+$/.test(String(payload.amount)) || payload.amount < 0) {
    throw new ShippingQuoteError("SHIPPING_QUOTE_INVALID", "The delivery quote is not valid for this order.");
  }
  const snapshot: ShippingOrderSnapshot = {
    carrier: payload.carrier,
    serviceCode: payload.serviceCode,
    destinationCountry: payload.destinationCountry,
    destinationPostalCode: payload.destinationPostalCode,
    quoteExpiresAt: new Date(payload.expiresAt).toISOString(),
    parcels: payload.parcels,
    customs: payload.customs,
  };
  return {
    available: true as const,
    methodId: payload.methodId,
    label: payload.label,
    amount: payload.amount,
    pickup: false as const,
    snapshot,
  };
}
