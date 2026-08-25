import { calculatedShippingReadiness, configuredCountryCodes } from "@/config/shipping";
import { resolveCartItems, sanitiseCartItems } from "@/lib/cart";
import { AustraliaPostApiError, quoteAustraliaPost } from "@/lib/auspost";
import { buildCustomsSnapshot, buildShippingParcels } from "@/lib/shipping-parcels";
import { createShippingQuoteOption } from "@/lib/shipping-quote";
import { siteConfig } from "@/config/site";
import type { CartItemInput } from "@/types/product";

export const runtime = "nodejs";

const jsonError = (message: string, status: number, code: string) =>
  Response.json({ message, code }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).origin !== new URL(request.url).origin) return jsonError("Shipping request was not accepted.", 403, "ORIGIN_DENIED");
  } catch {
    return jsonError("Shipping request was not accepted.", 403, "ORIGIN_DENIED");
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return jsonError("Shipping expects a JSON cart.", 415, "JSON_REQUIRED");
  if (Number(request.headers.get("content-length") ?? 0) > 32_000) return jsonError("Shipping request is too large.", 413, "REQUEST_TOO_LARGE");

  let body: { businessId?: unknown; items?: unknown; destination?: { country?: unknown; postalCode?: unknown } };
  try { body = await request.json() as typeof body; } catch { return jsonError("Your cart could not be read.", 400, "INVALID_BODY"); }
  if (body.businessId !== siteConfig.businessId || !Array.isArray(body.items) || !body.items.length || body.items.length > 25) {
    return jsonError("Your cart could not be verified.", 400, "INVALID_CART");
  }
  const safeItems = sanitiseCartItems(body.items as CartItemInput[]);
  if (safeItems.length !== body.items.length) return jsonError("One or more cart items are no longer available.", 400, "ITEM_REJECTED");
  const items = resolveCartItems(safeItems);
  if (items.some((item) => item.quantity > item.variant.stock)) return jsonError("Requested quantity exceeds current stock.", 409, "STOCK_EXCEEDED");

  const country = typeof body.destination?.country === "string" ? body.destination.country.trim().toUpperCase() : "";
  const postalCode = typeof body.destination?.postalCode === "string" ? body.destination.postalCode.trim().toUpperCase().replace(/\s+/g, " ") : "";
  if (!configuredCountryCodes().includes(country)) return jsonError("Choose a supported destination country.", 400, "COUNTRY_UNSUPPORTED");
  if (country === "AU" ? !/^\d{4}$/.test(postalCode) : !/^[A-Z0-9][A-Z0-9 -]{1,11}$/.test(postalCode)) {
    return jsonError(country === "AU" ? "Enter a valid four-digit Australian postcode." : "Enter a valid destination postal code.", 400, "POSTAL_CODE_INVALID");
  }

  const readiness = calculatedShippingReadiness();
  if (!readiness.domesticReady || (country !== "AU" && !readiness.internationalReady)) {
    return jsonError("Calculated shipping is not fully configured for this destination yet.", 503, "SHIPPING_NOT_CONFIGURED");
  }

  try {
    const parcels = buildShippingParcels(items);
    const customs = country === "AU" ? null : buildCustomsSnapshot(items);
    const rates = await quoteAustraliaPost(parcels, country, postalCode);
    const quotes = rates.map((rate) => createShippingQuoteOption({
      methodId: `auspost:${country}:${rate.serviceCode}`,
      carrier: "Australia Post",
      serviceCode: rate.serviceCode,
      label: `Australia Post ${rate.label}`,
      amount: rate.amount,
      destinationCountry: country,
      destinationPostalCode: postalCode,
      deliveryEstimate: rate.deliveryEstimate,
      parcels,
      customs,
    }, items));
    return Response.json({ quotes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof AustraliaPostApiError ? error.message : "Delivery could not be calculated right now.";
    return jsonError(message, 502, "SHIPPING_QUOTE_FAILED");
  }
}
