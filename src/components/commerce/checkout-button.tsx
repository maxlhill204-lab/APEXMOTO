"use client";

import { siteConfig } from "@/config/site";
import { trackEvent } from "@/lib/analytics";
import { useState } from "react";
import { useCart } from "./cart-provider";
import { PENDING_CHECKOUT_KEY } from "./cart-provider";

export function CheckoutButton({
  shippingMethodId,
  customerName,
  customerEmail,
  pickupAcknowledged,
  disabled = false,
  className = "button button--primary button--wide",
}: {
  shippingMethodId: string;
  customerName: string;
  customerEmail: string;
  pickupAcknowledged: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const { items, quantity } = useCart();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const beginCheckout = async () => {
    if (!quantity || status === "loading") return;
    if (customerName.trim().length < 2) {
      setStatus("error");
      setMessage("Enter the full name for this order above.");
      document.getElementById("customer-name")?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setStatus("error");
      setMessage("Enter a valid email so we can send your confirmation.");
      document.getElementById("customer-email")?.focus();
      return;
    }
    if (!pickupAcknowledged) {
      setStatus("error");
      setMessage("Confirm the pickup date and appointment terms above.");
      return;
    }
    setStatus("loading");
    setMessage("");
    trackEvent("begin_checkout", { item_count: quantity });
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Checkout-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ businessId: siteConfig.businessId, items, shippingMethodId, customerName, customerEmail, pickupAcknowledged }),
      });
      const data = (await response.json()) as { url?: string; message?: string; orderNumber?: string; accessToken?: string; purchasedKeys?: string[] };
      if (!response.ok || !data.url) throw new Error(data.message || "Checkout is unavailable.");
      if (data.orderNumber && data.accessToken && data.purchasedKeys) window.localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({ orderNumber: data.orderNumber, accessToken: data.accessToken, purchasedKeys: data.purchasedKeys }));
      window.location.assign(data.url);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Checkout is unavailable.");
    }
  };

  return (
    <div className="checkout-action">
      <button className={className} type="button" onClick={beginCheckout} disabled={!quantity || disabled || status === "loading"}>
        {status === "loading" ? "Preparing secure checkout…" : "Checkout"}
      </button>
      {message ? <p className="form-message form-message--error" role="alert">{message}</p> : null}
    </div>
  );
}
