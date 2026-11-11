import { getStoreSettings } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supportResponseMinHours, supportResponseMaxHours } = await getStoreSettings();
  return Response.json({ supportResponseMinHours, supportResponseMaxHours }, { headers: { "Cache-Control": "no-store" } });
}
