import { getCustomsProductConfig, getShippingMeasurements } from "@/config/shipping";
import { getProductById } from "@/lib/products";
import type { ResolvedCartItem } from "@/types/product";
import type { CustomsItemSnapshot, CustomsSnapshot, ShippingParcel } from "@/types/shipping";

const roundWeight = (value: number) => Math.round(value * 1000) / 1000;

function physicalCounts(items: ResolvedCartItem[]) {
  return items.reduce((counts, item) => {
    if (item.product.category === "helmet") counts.helmets += item.quantity;
    if (item.product.category === "goggles") counts.goggles += item.quantity;
    if (item.product.category === "bundle") {
      counts.helmets += item.quantity;
      counts.goggles += item.quantity;
      counts.bags += item.quantity;
    }
    return counts;
  }, { helmets: 0, goggles: 0, bags: 0 });
}

export function buildShippingParcels(items: ResolvedCartItem[]): ShippingParcel[] {
  const measurements = getShippingMeasurements();
  if (!measurements) throw new Error("Parcel measurements are not configured.");
  const counts = physicalCounts(items);
  const parcels: ShippingParcel[] = [];
  let gogglesRemaining = counts.goggles;
  let bagsRemaining = counts.bags;

  for (let index = 0; index < counts.helmets; index += 1) {
    const goggleUnits = Math.min(gogglesRemaining, 3);
    const bagUnits = bagsRemaining > 0 ? 1 : 0;
    gogglesRemaining -= goggleUnits;
    bagsRemaining -= bagUnits;
    parcels.push({
      kind: "helmet",
      weightKg: roundWeight(
        measurements.helmet.packedWeightKg
        + goggleUnits * measurements.goggles.addonWeightKg
        + bagUnits * measurements.bag.itemWeightKg,
      ),
      lengthCm: measurements.helmet.lengthCm,
      widthCm: measurements.helmet.widthCm,
      heightCm: measurements.helmet.heightCm,
      helmetUnits: 1,
      goggleUnits,
    });
  }

  while (gogglesRemaining > 0) {
    const goggleUnits = Math.min(gogglesRemaining, measurements.goggles.unitsPerParcel);
    gogglesRemaining -= goggleUnits;
    parcels.push({
      kind: "goggles",
      weightKg: roundWeight(measurements.goggles.packedWeightKg + (goggleUnits - 1) * measurements.goggles.addonWeightKg),
      lengthCm: measurements.goggles.lengthCm,
      widthCm: measurements.goggles.widthCm,
      heightCm: measurements.goggles.heightCm,
      helmetUnits: 0,
      goggleUnits,
    });
  }

  if (!parcels.length) throw new Error("The cart does not contain shippable products.");
  return parcels;
}

function addCustomsLine(target: Map<string, CustomsItemSnapshot>, key: string, line: CustomsItemSnapshot) {
  const existing = target.get(key);
  if (!existing) {
    target.set(key, line);
    return;
  }
  existing.quantity += line.quantity;
  existing.totalWeightKg = roundWeight(existing.totalWeightKg + line.totalWeightKg);
  existing.totalValue += line.totalValue;
}

export function buildCustomsSnapshot(items: ResolvedCartItem[]): CustomsSnapshot {
  const measurements = getShippingMeasurements();
  const config = getCustomsProductConfig();
  if (!measurements || !config) throw new Error("International customs information is not configured.");
  const helmetPrice = getProductById("helmet-matte-black")?.price;
  const gogglesPrice = getProductById("goggles-orz")?.price;
  if (!helmetPrice || !gogglesPrice) throw new Error("Customs values could not be derived from the catalogue.");
  const lines = new Map<string, CustomsItemSnapshot>();

  for (const item of items) {
    if (item.product.category === "helmet" || item.product.category === "goggles") {
      const kind = item.product.category;
      const productConfig = config[kind];
      const itemWeight = measurements[kind].itemWeightKg;
      addCustomsLine(lines, kind, {
        ...productConfig,
        quantity: item.quantity,
        unitWeightKg: itemWeight,
        totalWeightKg: roundWeight(itemWeight * item.quantity),
        unitValue: item.product.price,
        totalValue: item.lineTotal,
      });
      continue;
    }

    const bagValue = config.bag.unitValue;
    const merchandiseValue = item.product.price - bagValue;
    if (merchandiseValue <= 0) throw new Error("The bundle customs value allocation is invalid.");
    const helmetUnitValue = Math.round(merchandiseValue * helmetPrice / (helmetPrice + gogglesPrice));
    const gogglesUnitValue = merchandiseValue - helmetUnitValue;
    const bundleLines = [
      { key: "helmet", config: config.helmet, weight: measurements.helmet.itemWeightKg, value: helmetUnitValue },
      { key: "goggles", config: config.goggles, weight: measurements.goggles.itemWeightKg, value: gogglesUnitValue },
      { key: "bag", config: config.bag, weight: measurements.bag.itemWeightKg, value: bagValue },
    ];
    for (const component of bundleLines) {
      addCustomsLine(lines, component.key, {
        description: component.config.description,
        hsTariffCode: component.config.hsTariffCode,
        countryOfOrigin: component.config.countryOfOrigin,
        quantity: item.quantity,
        unitWeightKg: component.weight,
        totalWeightKg: roundWeight(component.weight * item.quantity),
        unitValue: component.value,
        totalValue: component.value * item.quantity,
      });
    }
  }

  return { exportReason: "SALE_OF_GOODS", commercialValue: true, currency: "AUD", items: [...lines.values()] };
}

export function applyCustomsDiscount(snapshot: CustomsSnapshot | null, discountAmount: number): CustomsSnapshot | null {
  if (!snapshot || discountAmount <= 0) return snapshot;
  const gross = snapshot.items.reduce((total, item) => total + item.totalValue, 0);
  const paidMerchandise = Math.max(0, gross - Math.min(discountAmount, gross));
  let allocated = 0;
  const items = snapshot.items.map((item, index) => {
    const totalValue = index === snapshot.items.length - 1
      ? paidMerchandise - allocated
      : Math.round(item.totalValue / gross * paidMerchandise);
    allocated += totalValue;
    return { ...item, totalValue, unitValue: Math.round(totalValue / item.quantity) };
  });
  return { ...snapshot, items };
}
