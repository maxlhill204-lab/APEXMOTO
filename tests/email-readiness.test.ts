import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isEmailConfigured } from "@/lib/email";
import { checkoutReadiness } from "@/lib/stripe";

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
});
