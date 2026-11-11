import { calculatedShippingReadiness } from "@/config/shipping";
import type { ShippingPublicConfig } from "@/types/shipping";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = calculatedShippingReadiness();
  const config: ShippingPublicConfig = {
    mode: readiness.domesticReady ? "calculated" : "legacy",
    provider: "Australia Post",
    originCountry: "AU",
    countries: [{ code: "AU", name: "Australia", priority: true }],
    internationalEnabled: false,
    message: readiness.domesticReady ? null : "Australia Post calculated shipping is awaiting its production measurements and API key.",
  };
  return Response.json(config, { headers: { "Cache-Control": "no-store" } });
}
