import { describe, expect, it } from "vitest";
import { formatPromotionCountdown } from "@/lib/promotion";

describe("promotion countdown", () => {
  const deadline = "2026-08-26T00:00:00+10:00";

  it("counts down to midnight at the end of 25 August in Melbourne", () => {
    expect(formatPromotionCountdown(deadline, new Date("2026-08-23T17:00:00+10:00").getTime()))
      .toBe("55H 00M 00S");
  });

  it("uses a fixed-width hours, minutes and seconds display", () => {
    expect(formatPromotionCountdown(deadline, new Date("2026-08-25T23:59:01+10:00").getTime()))
      .toBe("00H 00M 59S");
  });

  it("stops cleanly when the promotion reaches its deadline", () => {
    expect(formatPromotionCountdown(deadline, new Date(deadline).getTime())).toBe("SALE ENDED");
  });
});
