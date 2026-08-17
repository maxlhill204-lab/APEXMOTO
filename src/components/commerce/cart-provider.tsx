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
