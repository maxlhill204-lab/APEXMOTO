import { catalog, getOptionLabel } from "@/lib/products";
import type { listInventory } from "@/lib/orders";
import { ProductVisual } from "@/components/product/product-visual";
import { InventoryForm } from "./inventory-form";

type InventoryItem = Awaited<ReturnType<typeof listInventory>>[number];

const skuDetails = new Map(
  catalog.filter((product) => product.category !== "bundle").flatMap((product) =>
    product.variants.flatMap((variant) =>
      variant.inventory.map(({ sku }) => [sku, {
        product,
        type: product.category === "helmet" ? "Helmets" : "Goggles",
        colour: getOptionLabel(product, "colour", variant.options.colour),
        size: variant.options.size ? getOptionLabel(product, "size", variant.options.size) : "",
      }] as const),
    ),
  ),
);

export function InventoryTable({ inventory }: { inventory: InventoryItem[] }) {
  return (
    <section className="admin-section" id="inventory" aria-labelledby="inventory-title">
      <div className="admin-section__heading">
        <div>
          <h2 id="inventory-title">Stock on hand</h2>
          <p>Lowest available quantity first within each colour. Bundles draw from the same stock.</p>
        </div>
        <strong>{inventory.reduce((sum, item) => sum + item.available, 0)} units available</strong>
      </div>
      {(["Helmets", "Goggles", "Other stock"] as const).map((type) => {
        const items = inventory.filter((item) => (skuDetails.get(item.sku)?.type ?? "Other stock") === type);
        if (!items.length) return null;

        const colours = [...new Set(items.map((item) => skuDetails.get(item.sku)?.colour ?? "Other"))].sort();
        return (
          <section className="admin-stock-group" key={type} aria-label={type}>
            <h3>{type}</h3>
            <div className="admin-stock-scroll">
              <table className="admin-stock-table">
                <thead><tr><th scope="col">Colour / size</th><th scope="col">Available</th><th scope="col">Reserved</th><th scope="col">On hand</th></tr></thead>
                {colours.map((colour) => {
                  const colourItems = items.filter((item) => (skuDetails.get(item.sku)?.colour ?? "Other") === colour);
                  const details = skuDetails.get(colourItems[0].sku);
                  const image = details?.product.images.find((photo) => photo.colour === colour);
                  return (
                  <tbody key={colour}>
                    <tr className="admin-stock-colour"><th scope="rowgroup" colSpan={4}><div className="admin-stock-colour__label">{details ? <div className="admin-product-photo"><ProductVisual product={details.product} image={image} sizes="64px" /></div> : null}{colour}</div></th></tr>
                    {colourItems
                      .sort((a, b) => a.available - b.available || a.stockOnHand - b.stockOnHand || a.sku.localeCompare(b.sku))
                      .map((item) => (
                          <tr key={item.sku}>
                            <th scope="row"><strong>{skuDetails.get(item.sku)?.size || colour}</strong><small>{item.sku}</small></th>
                            <td><strong className="admin-stock-quantity" data-empty={item.available === 0}>{item.available}</strong></td>
                            <td>{item.reserved}</td>
                            <td><InventoryForm sku={item.sku} stockOnHand={item.stockOnHand} /></td>
                          </tr>
                      ))}
                  </tbody>
                  );
                })}
              </table>
            </div>
          </section>
        );
      })}
    </section>
  );
}
