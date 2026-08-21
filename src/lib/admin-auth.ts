import { createHmac, timingSafeEqual } from "node:crypto";
import { getSql, StoreConfigurationError } from "@/lib/db";
import { siteConfig } from "@/config/site";
import { cookies, headers } from "next/headers";

const COOKIE_NAME = "apex-moto-admin";
const SESSION_SECONDS = 8 * 60 * 60;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!value || value.length < 32) throw new StoreConfigurationError("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(`${siteConfig.businessId}\n${payload}`).digest("base64url");
}

function safeEqual(first: string, second: string) {
  const a = Buffer.from(first);
  const b = Buffer.from(second);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdminAuthenticated() {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  const [expires, suppliedSignature] = value.split(".");
  if (!expires || !suppliedSignature || Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  return safeEqual(signature(expires), suppliedSignature);
}

export async function requireAdmin() {
  if (!await isAdminAuthenticated()) throw new Error("Admin authentication required.");
}

function passwordMatches(supplied: string) {
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (!configured || configured.length < 12) throw new StoreConfigurationError("ADMIN_PASSWORD must contain at least 12 characters.");
  const expected = createHmac("sha256", secret()).update(configured).digest("hex");
  const actual = createHmac("sha256", secret()).update(supplied).digest("hex");
  return safeEqual(expected, actual);
}

async function requestIpHash() {
  const requestHeaders = await headers();
  const address = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  return createHmac("sha256", secret()).update(address).digest("hex");
}

export async function authenticateAdmin(password: string) {
  const ipHash = await requestIpHash();
  const sql = getSql();
  const recent = await sql`SELECT COUNT(*)::integer AS failures FROM admin_login_attempts WHERE business_id=${siteConfig.businessId} AND ip_hash=${ipHash} AND successful=false AND created_at > now() - interval '15 minutes'`;
  if (Number(recent[0]?.failures ?? 0) >= 5) return { ok: false, rateLimited: true };
  const success = passwordMatches(password);
  await sql`INSERT INTO admin_login_attempts (id,business_id,ip_hash,successful) VALUES (${crypto.randomUUID()},${siteConfig.businessId},${ipHash},${success})`;
  if (!success) return { ok: false, rateLimited: false };
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  (await cookies()).set(COOKIE_NAME, `${expires}.${signature(expires)}`, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/admin", maxAge: SESSION_SECONDS });
  return { ok: true, rateLimited: false };
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}
