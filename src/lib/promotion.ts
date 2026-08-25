import { siteConfig } from "@/config/site";
import type { Product } from "@/types/product";

export function formatPromotionCountdown(deadline: string, now: number) {
  const remainingMilliseconds = new Date(deadline).getTime() - now;
  if (!Number.isFinite(remainingMilliseconds) || remainingMilliseconds <= 0) return "SALE ENDED";

  const totalSeconds = Math.floor(remainingMilliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(days)}D ${pad(hours)}H ${pad(minutes)}M ${pad(seconds)}S`;
}

export const isPromotionActive = (now = Date.now()) => {
  const startsAt = new Date(siteConfig.promotionStartsAt).getTime();
  const endsAt = new Date(siteConfig.promotionEndsAt).getTime();
  return Number.isFinite(now) && now >= startsAt && now < endsAt;
};

export const promotionPrice = (regularPrice: number) =>
  Math.round(regularPrice * (100 - siteConfig.promotionPercent) / 100);

export function applyPromotion(product: Product, now = Date.now()): Product {
  if (!isPromotionActive(now)) return { ...product, compareAtPrice: undefined };
  return {
    ...product,
    price: promotionPrice(product.price),
    compareAtPrice: product.price,
  };
}
