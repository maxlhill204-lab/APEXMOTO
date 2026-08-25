import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isEmailConfigured } from "@/lib/email";
import { checkoutReadiness, ownerOperationsReadiness } from "@/lib/stripe";
import { OrderEmail } from "@/emails/order-email";
import { render } from "@react-email/render";
import type { PublicOrder } from "@/types/order";

const managedKeys = [
  "DATABASE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "ORDER_ACCESS_SECRET",
  "POSTMARK_SERVER_TOKEN",
  "RESEND_API_KEY",
  "ORDER_EMAIL_FROM",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
  "CRON_SECRET",
] as const;

const originalEnvironment = Object.fromEntries(managedKeys.map((key) => [key, process.env[key]]));

const pickupOrder: PublicOrder = {
  id: "TEST_ORDER_ID",
  orderNumber: "APX-TEST-100",
  status: "PAID",
  paymentStatus: "PAID",
  subtotalAmount: 2500,
  shippingAmount: 0,
  discountAmount: 2500,
  totalAmount: 0,
  promotionCode: "TEST100",
  stripePromotionCodeId: "promo_TEST100",
  paymentMethodLabel: null,
  customerName: "Test Rider",
  customerEmail: "rider@example.invalid",
  fulfilmentMethodId: "pickup",
  fulfilmentLabel: "Newport pickup",
  pickupDate: "2026-09-02",
  pickupWindow: "By confirmed appointment",
  shippingDetails: null,
  createdAt: "2026-08-24T09:21:12+10:00",
  paidAt: "2026-08-24T09:21:12+10:00",
  refundedAt: null,
  items: [{
    productId: "goggles-orz",
    variantId: "goggles-black-silver",
    productName: "APEX MOTO MX Goggles",
    variantLabel: "Black / Silver",
    unitAmount: 2500,
    quantity: 1,
    lineTotal: 2500,
    cartItemKey: "goggles-orz:goggles-black-silver",
  }],
};

describe("transactional email readiness", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://example.invalid/apexmoto";
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_example";
    process.env.ORDER_ACCESS_SECRET = "o".repeat(32);
    process.env.ORDER_EMAIL_FROM = "APEX MOTO <orders@apexmoto.com.au>";
    process.env.ADMIN_PASSWORD = "654321";
    process.env.ADMIN_SESSION_SECRET = "a".repeat(32);
    process.env.CRON_SECRET = "c".repeat(32);
    delete process.env.POSTMARK_SERVER_TOKEN;
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    for (const key of managedKeys) {
      const value = originalEnvironment[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("accepts Postmark as the primary transactional provider", () => {
    process.env.POSTMARK_SERVER_TOKEN = "postmark-test-token";
    expect(isEmailConfigured()).toBe(true);
    expect(checkoutReadiness()).toEqual({ ready: true, missing: [] });
  });

  it("accepts Resend as the automatic fallback provider", () => {
    process.env.RESEND_API_KEY = "resend-test-token";
    expect(isEmailConfigured()).toBe(true);
    expect(checkoutReadiness()).toEqual({ ready: true, missing: [] });
  });

  it("fails closed when neither transactional provider is configured", () => {
    expect(isEmailConfigured()).toBe(false);
    expect(checkoutReadiness()).toEqual({ ready: false, missing: ["TRANSACTIONAL_EMAIL_PROVIDER"] });
  });

  it("does not take customer checkout offline for an owner-only configuration issue", () => {
    process.env.RESEND_API_KEY = "resend-test-token";
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.CRON_SECRET;

    expect(checkoutReadiness()).toEqual({ ready: true, missing: [] });
    expect(ownerOperationsReadiness().ready).toBe(false);
  });

  it("still fails closed when the customer order-access secret is too short", () => {
    process.env.RESEND_API_KEY = "resend-test-token";
    process.env.ORDER_ACCESS_SECRET = "too-short";

    expect(checkoutReadiness()).toEqual({ ready: false, missing: ["ORDER_ACCESS_SECRET_LENGTH"] });
  });

  it("tells pickup customers when the address and available times will be confirmed", async () => {
    const text = await render(OrderEmail({
      kind: "CUSTOMER_ORDER_CONFIRMATION",
      order: pickupOrder,
      accessToken: "TEST_ACCESS_TOKEN",
      privatePickupAddress: "191 Mason Street, Newport VIC 3015",
    }), { plainText: true });

    expect(text).toContain("Your pickup details will be confirmed within 24 hours.");
    expect(text).toContain("exact pickup address and available collection times");
    expect(text).toContain("If you have not received those details within 24 hours");
    expect(text).toContain("max@apexmoto.com.au");
    expect(text).not.toContain("191 Mason Street");
  });

  it("includes the private address only after the order is marked ready for pickup", async () => {
    const text = await render(OrderEmail({
      kind: "CUSTOMER_READY_FOR_PICKUP",
      order: { ...pickupOrder, status: "READY_FOR_PICKUP" },
      accessToken: "TEST_ACCESS_TOKEN",
      privatePickupAddress: "191 Mason Street, Newport VIC 3015",
    }), { plainText: true });

    expect(text).toContain("191 Mason Street, Newport VIC 3015");
    expect(text).not.toContain("Your pickup details will be confirmed within 24 hours.");
  });
});
