"use client";

import { siteConfig } from "@/config/site";
import { trackEvent } from "@/lib/analytics";
import { useState } from "react";
import { useCart } from "./cart-provider";

export function CheckoutButton({
  shippingMethodId,
  disabled = false,
  className = "button button--primary button--wide",
}: {
  shippingMethodId: string;
  disabled?: boolean;
  className?: string;
}) {
  const { items, quantity } = useCart();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const beginCheckout = async () => {
    if (!quantity || status === "loading") return;
    setStatus("loading");
    setMessage("");
    trackEvent("begin_checkout", { item_count: quantity });
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Checkout-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ businessId: siteConfig.businessId, items, shippingMethodId }),
      });
      const data = (await response.json()) as { url?: string; message?: string };
      if (!response.ok || !data.url) throw new Error(data.message || "Checkout is unavailable.");
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
