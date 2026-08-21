"use client";

import { PENDING_CHECKOUT_KEY, useCart } from "@/components/commerce/cart-provider";
import { useEffect } from "react";

export function OrderCartReconciler({ purchasedKeys }: { purchasedKeys: string[] }) {
  const { removePurchasedItems } = useCart();
  useEffect(() => {
    removePurchasedItems(purchasedKeys);
    window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
  }, [purchasedKeys, removePurchasedItems]);
  return null;
}
