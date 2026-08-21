"use client";

import {
  addCartItem,
  cartItemKey,
  cartQuantity,
  cartSubtotal,
  resolveCartItems,
  sanitiseCartItems,
  setCartItemQuantity,
} from "@/lib/cart";
import type { CartItemInput } from "@/types/product";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "apex-moto-cart-v1";
export const PENDING_CHECKOUT_KEY = "apex-moto-pending-checkout-v1";

type CartContextValue = {
  items: CartItemInput[];
  resolvedItems: ReturnType<typeof resolveCartItems>;
  quantity: number;
  subtotal: number;
  hydrated: boolean;
  drawerOpen: boolean;
  lastAddedKey: string | null;
  addItem: (item: CartItemInput) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  removePurchasedItems: (keys: string[]) => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemInput[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? sanitiseCartItems(JSON.parse(stored)) : [];
    } catch {
      return [];
    }
  });
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAddedKey, setLastAddedKey] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    const reconcile = async () => {
      try {
        const raw = window.localStorage.getItem(PENDING_CHECKOUT_KEY);
        if (!raw) return;
        const pending = JSON.parse(raw) as { orderNumber?: unknown; accessToken?: unknown; purchasedKeys?: unknown };
        if (typeof pending.orderNumber !== "string" || typeof pending.accessToken !== "string" || !Array.isArray(pending.purchasedKeys)) {
          window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
          return;
        }
        const response = await fetch("/api/orders/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber: pending.orderNumber, token: pending.accessToken }) });
        if (!response.ok || !active) return;
        const result = await response.json() as { confirmed?: boolean; terminal?: boolean };
        if (result.confirmed) {
          const keys = pending.purchasedKeys.filter((key): key is string => typeof key === "string");
          setItems((current) => current.filter((item) => !keys.includes(cartItemKey(item))));
          window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
        } else if (result.terminal) {
          window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
        }
      } catch {
        // Leave the cart and pending marker intact; a later visit can retry safely.
      }
    };
    void reconcile();
    return () => { active = false; };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const addItem = useCallback((item: CartItemInput) => {
    setItems((current) => addCartItem(current, item));
    setLastAddedKey(cartItemKey(item));
    setDrawerOpen(true);
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) => setCartItemQuantity(current, key, quantity));
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((current) => current.filter((item) => cartItemKey(item) !== key));
  }, []);

  const removePurchasedItems = useCallback((keys: string[]) => {
    setItems((current) => {
      const next = current.filter((item) => !keys.includes(cartItemKey(item)));
      return next.length === current.length ? current : next;
    });
  }, []);

  const resolvedItems = useMemo(() => resolveCartItems(items), [items]);
  const value = useMemo<CartContextValue>(
    () => ({
      items,
      resolvedItems,
      quantity: hydrated ? cartQuantity(items) : 0,
      subtotal: cartSubtotal(items),
      hydrated,
      drawerOpen,
      lastAddedKey,
      addItem,
      updateQuantity,
      removeItem,
      clearCart: () => setItems([]),
      removePurchasedItems,
      openCart: () => setDrawerOpen(true),
      closeCart: () => setDrawerOpen(false),
    }),
    [
      addItem,
      drawerOpen,
      hydrated,
      items,
      lastAddedKey,
      removeItem,
      removePurchasedItems,
      resolvedItems,
      updateQuantity,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider.");
  return context;
}
