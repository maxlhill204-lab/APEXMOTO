import { describe, expect, it } from "vitest";
import { applyPromotion, formatPromotionCountdown, isPromotionActive, promotionPrice } from "@/lib/promotion";
import { products } from "@/data/products";

describe("promotion countdown", () => {
  const deadline = "2026-08-31T00:00:00+10:00";

  it("shows days separately instead of accumulating them into the hours", () => {
    expect(formatPromotionCountdown(deadline, new Date("2026-08-24T00:00:00+10:00").getTime()))
      .toBe("07D 00H 00M 00S");
  });

  it("uses a fixed-width days, hours, minutes and seconds display", () => {
    expect(formatPromotionCountdown(deadline, new Date("2026-08-30T23:59:01+10:00").getTime()))
      .toBe("00D 00H 00M 59S");
  });

  it("stops cleanly when the promotion reaches its deadline", () => {
    expect(formatPromotionCountdown(deadline, new Date(deadline).getTime())).toBe("SALE ENDED");
  });

  it("applies a genuine 20% reduction only inside the campaign window", () => {
    const regularHelmet = products.find((product) => product.id === "helmet-matte-black")!;
    const duringSale = new Date("2026-08-24T12:00:00+10:00").getTime();
    const afterSale = new Date(deadline).getTime();
    expect(isPromotionActive(duringSale)).toBe(true);
    expect(promotionPrice(12000)).toBe(9600);
    expect(applyPromotion(regularHelmet, duringSale)).toMatchObject({ price: 9600, compareAtPrice: 12000 });
    expect(applyPromotion(regularHelmet, afterSale)).toMatchObject({ price: 12000, compareAtPrice: undefined });
  });
});
