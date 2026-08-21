import { getStoreSettings } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getStoreSettings();
  return Response.json(settings, { headers: { "Cache-Control": "no-store" } });
}
