import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { siteConfig } from "@/config/site";
import { resolveCartItems } from "@/lib/cart";
import { quoteAustraliaPost } from "@/lib/auspost";
import { buildCustomsSnapshot, buildShippingParcels } from "@/lib/shipping-parcels";
import { createShippingQuoteOption, ShippingQuoteError, verifyShippingQuoteToken } from "@/lib/shipping-quote";
import { validateCheckoutRequest } from "@/lib/checkout-policy";

const environment = {
  AUSPOST_PAC_API_KEY: "TEST_PAC_KEY",
  SHIPPING_QUOTE_SECRET: "q".repeat(48),
  AUSPOST_SHIPPING_COUNTRIES: "AU,NZ,GB,DE",
  AUSPOST_HELMET_PACKED_WEIGHT_KG: "1.4",
  AUSPOST_HELMET_LENGTH_CM: "45",
  AUSPOST_HELMET_WIDTH_CM: "35",
  AUSPOST_HELMET_HEIGHT_CM: "35",
  AUSPOST_HELMET_ITEM_WEIGHT_KG: "1.08",
  AUSPOST_GOGGLES_PACKED_WEIGHT_KG: "0.45",
  AUSPOST_GOGGLES_ADDON_WEIGHT_KG: "0.25",
  AUSPOST_GOGGLES_LENGTH_CM: "30",
  AUSPOST_GOGGLES_WIDTH_CM: "18",
  AUSPOST_GOGGLES_HEIGHT_CM: "14",
  AUSPOST_GOGGLES_ITEM_WEIGHT_KG: "0.22",
  AUSPOST_GOGGLES_UNITS_PER_PARCEL: "3",
  AUSPOST_BAG_ITEM_WEIGHT_KG: "0.12",
  CUSTOMS_HELMET_DESCRIPTION: "ABS off-road motorcycle helmet",
  CUSTOMS_HELMET_HS_CODE: "650610",
  CUSTOMS_HELMET_COUNTRY_OF_ORIGIN: "CN",
  CUSTOMS_GOGGLES_DESCRIPTION: "Plastic motocross protective goggles",
  CUSTOMS_GOGGLES_HS_CODE: "900490",
  CUSTOMS_GOGGLES_COUNTRY_OF_ORIGIN: "CN",
  CUSTOMS_BAG_DESCRIPTION: "Polyester drawstring helmet bag",
  CUSTOMS_BAG_HS_CODE: "420292",
  CUSTOMS_BAG_COUNTRY_OF_ORIGIN: "CN",
  CUSTOMS_BAG_UNIT_VALUE_CENTS: "500",
} as const;

const original = Object.fromEntries(Object.keys(environment).map((key) => [key, process.env[key]]));

beforeEach(() => {
  for (const [key, value] of Object.entries(environment)) process.env[key] = value;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  for (const key of Object.keys(environment)) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const helmetCart = () => resolveCartItems([{ businessId: siteConfig.businessId, productId: "helmet-matte-black", variantId: "black-m", quantity: 1 }]);

describe("worldwide shipping parcels and customs", () => {
  it("packs up to three goggles with a helmet and creates another parcel for the remainder", () => {
    const items = resolveCartItems([
      { businessId: siteConfig.businessId, productId: "helmet-matte-black", variantId: "black-m", quantity: 1 },
      { businessId: siteConfig.businessId, productId: "goggles-orz", variantId: "goggles-black-gold", quantity: 1 },
      { businessId: siteConfig.businessId, productId: "goggles-orz", variantId: "goggles-red-gold", quantity: 1 },
      { businessId: siteConfig.businessId, productId: "goggles-orz", variantId: "goggles-grey-ice", quantity: 1 },
      { businessId: siteConfig.businessId, productId: "goggles-orz", variantId: "goggles-blue-black", quantity: 1 },
    ]);
    expect(buildShippingParcels(items)).toEqual([
      { kind: "helmet", weightKg: 2.15, lengthCm: 45, widthCm: 35, heightCm: 35, helmetUnits: 1, goggleUnits: 3 },
      { kind: "goggles", weightKg: 0.45, lengthCm: 30, widthCm: 18, heightCm: 14, helmetUnits: 0, goggleUnits: 1 },
    ]);
  });

  it("creates separate customs lines whose values equal the bundle selling price", () => {
    const items = resolveCartItems([{ businessId: siteConfig.businessId, productId: "bundle-helmet-goggles", variantId: "bundle-black-m-black-gold", quantity: 1 }]);
    const customs = buildCustomsSnapshot(items);
    expect(customs).toMatchObject({ exportReason: "SALE_OF_GOODS", commercialValue: true, currency: "AUD" });
    expect(customs.items.map((item) => item.hsTariffCode)).toEqual(["650610", "900490", "420292"]);
    expect(customs.items.reduce((total, item) => total + item.totalValue, 0)).toBe(items[0].lineTotal);
  });
});

describe("signed shipping quotes", () => {
  it("binds a quote to the exact cart, destination, amount and expiry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-25T10:00:00+10:00"));
    const items = helmetCart();
    const parcels = buildShippingParcels(items);
    const option = createShippingQuoteOption({
      methodId: "auspost:NZ:INT_PARCEL_STD_OWN_PACKAGING", carrier: "Australia Post",
      serviceCode: "INT_PARCEL_STD_OWN_PACKAGING", label: "Australia Post Standard", amount: 3140,
      destinationCountry: "NZ", destinationPostalCode: "6011", deliveryEstimate: null, parcels,
      customs: buildCustomsSnapshot(items),
    }, items);
    expect(verifyShippingQuoteToken(option.token, items)).toMatchObject({
      available: true, amount: 3140, pickup: false,
      snapshot: { destinationCountry: "NZ", destinationPostalCode: "6011", serviceCode: "INT_PARCEL_STD_OWN_PACKAGING" },
    });
    const changed = resolveCartItems([{ businessId: siteConfig.businessId, productId: "helmet-matte-black", variantId: "black-m", quantity: 2 }]);
    expect(() => verifyShippingQuoteToken(option.token, changed)).toThrow(ShippingQuoteError);
    vi.advanceTimersByTime(16 * 60_000);
    expect(() => verifyShippingQuoteToken(option.token, items)).toThrow("expired");
  });

  it("rejects a tampered browser token", () => {
    const items = helmetCart();
    const option = createShippingQuoteOption({
      methodId: "auspost:AU:AUS_PARCEL_REGULAR", carrier: "Australia Post", serviceCode: "AUS_PARCEL_REGULAR",
      label: "Australia Post Parcel Post", amount: 1505, destinationCountry: "AU", destinationPostalCode: "3000",
      deliveryEstimate: "Delivered in 4 business days", parcels: buildShippingParcels(items), customs: null,
    }, items);
    expect(() => verifyShippingQuoteToken(`${option.token.slice(0, -1)}x`, items)).toThrow(ShippingQuoteError);
  });

  it("lets checkout policy accept the signed server amount without trusting a browser price", () => {
    const items = helmetCart();
    const option = createShippingQuoteOption({
      methodId: "auspost:DE:INT_PARCEL_STD_OWN_PACKAGING", carrier: "Australia Post",
      serviceCode: "INT_PARCEL_STD_OWN_PACKAGING", label: "Australia Post Standard", amount: 3470,
      destinationCountry: "DE", destinationPostalCode: "10115", deliveryEstimate: null,
      parcels: buildShippingParcels(items), customs: buildCustomsSnapshot(items),
    }, items);
    const result = validateCheckoutRequest({
      businessId: siteConfig.businessId,
      items: [{ businessId: siteConfig.businessId, productId: "helmet-matte-black", variantId: "black-m", quantity: 1 }],
      shippingQuoteToken: option.token,
      shippingMethodId: "browser-fake-method",
      shippingAmount: 1,
      customerName: "Test Rider",
      customerEmail: "rider@example.invalid",
    }, "https://store.example", "https://store.example");
    expect(result).toMatchObject({
      allowed: true,
      shipping: { amount: 3470, methodId: "auspost:DE:INT_PARCEL_STD_OWN_PACKAGING", snapshot: { destinationCountry: "DE" } },
    });
  });
});

describe("Australia Post PAC adapter", () => {
  it("sends domestic dimensions and sums the same service across multiple parcels", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify({ services: { service: [
      { code: "AUS_PARCEL_REGULAR", name: "Parcel Post", price: "15.05", delivery_time: "Delivered in 4 business days" },
      { code: "AUS_PARCEL_EXPRESS", name: "Express Post", price: "24.05" },
    ] } }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const parcel = buildShippingParcels(helmetCart())[0];
    const rates = await quoteAustraliaPost([parcel, parcel], "AU", "3000");
    expect(rates).toMatchObject([{ serviceCode: "AUS_PARCEL_REGULAR", amount: 3010 }, { serviceCode: "AUS_PARCEL_EXPRESS", amount: 4810 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const requested = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requested.searchParams.get("from_postcode")).toBe("3015");
    expect(requested.searchParams.get("to_postcode")).toBe("3000");
    expect(requested.searchParams.get("length")).toBe("45");
  });

  it("uses destination country and weight for an international rate", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ services: { service: {
      code: "INT_PARCEL_STD_OWN_PACKAGING", name: "Standard", price: "31.40",
    } } }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const rates = await quoteAustraliaPost(buildShippingParcels(helmetCart()), "NZ", "6011");
    expect(rates).toMatchObject([{ serviceCode: "INT_PARCEL_STD_OWN_PACKAGING", amount: 3140 }]);
    const requested = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requested.searchParams.get("country_code")).toBe("NZ");
    expect(requested.searchParams.get("weight")).toBe("1.4");
    expect(requested.searchParams.has("to_postcode")).toBe(false);
  });
});
