"use client";

import { useActionState, useState } from "react";
import { inventoryAction } from "./actions";

export function InventoryForm({ sku, stockOnHand }: { sku: string; stockOnHand: number }) {
  const [result, save, pending] = useActionState(inventoryAction, null);
  const [quantity, setQuantity] = useState(String(stockOnHand));
  const [edited, setEdited] = useState(false);

  return (
    <form action={save} noValidate onSubmit={() => setEdited(false)} className="admin-stock-form">
      <input type="hidden" name="sku" value={sku} />
      <input
        type="number"
        inputMode="numeric"
        name="stockOnHand"
        value={quantity}
        onChange={(event) => { setQuantity(event.target.value); setEdited(true); }}
        readOnly={pending}
        aria-label={`Stock on hand for ${sku}`}
      />
      <button className="button" type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
      <span className="admin-stock-feedback" data-error={result?.error} role="status">
        {pending || edited ? null : result?.message}
      </span>
    </form>
  );
}
