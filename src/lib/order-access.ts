import { createHmac, timingSafeEqual } from "node:crypto";
import { StoreConfigurationError } from "@/lib/db";

function accessSecret() {
  const value = process.env.ORDER_ACCESS_SECRET?.trim();
  if (!value || value.length < 32) {
    throw new StoreConfigurationError("ORDER_ACCESS_SECRET must contain at least 32 characters.");
  }
  return value;
}

export function createOrderAccessToken(businessId: string, orderId: string, email: string) {
  return createHmac("sha256", accessSecret())
    .update(`${businessId}\n${orderId}\n${email.trim().toLowerCase()}`)
    .digest("base64url");
}

export function verifyOrderAccessToken(businessId: string, orderId: string, email: string, token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const expected = Buffer.from(createOrderAccessToken(businessId, orderId, email));
  const supplied = Buffer.from(token);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
