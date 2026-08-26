import { describe, expect, it } from "vitest";
import { isRetryableDatabaseError } from "@/lib/db";

describe("database transaction retries", () => {
  it.each(["08006", "40001", "40P01", "53300", "57P03", "58030"])("retries transient PostgreSQL error %s", (code) => {
    expect(isRetryableDatabaseError({ code, message: "temporary database failure" })).toBe(true);
  });

  it("retries network transport failures without a PostgreSQL code", () => {
    expect(isRetryableDatabaseError(new Error("WebSocket closed unexpectedly"))).toBe(true);
  });

  it("does not retry validation or constraint failures", () => {
    expect(isRetryableDatabaseError({ code: "23505", message: "duplicate key value" })).toBe(false);
    expect(isRetryableDatabaseError(new Error("Stripe amount does not match the reserved order."))).toBe(false);
  });
});
