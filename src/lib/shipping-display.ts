import type { ShippingAddress } from "@/types/order";

const regionNames = new Intl.DisplayNames(["en-AU"], { type: "region" });

export const shippingCountryName = (countryCode: string) => regionNames.of(countryCode.toUpperCase()) ?? countryCode;

export function formatShippingAddress(address: ShippingAddress | null) {
  if (!address) return null;
  return [address.name, address.line1, address.line2, address.city, address.state, address.postalCode, shippingCountryName(address.country)]
    .filter(Boolean)
    .join(", ");
}
