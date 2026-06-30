import { describe, it, expect } from "vitest";
import { computeNextRun, isDue, advanceUntilFuture } from "./subscription";

describe("subscription", () => {
  it("computeNextRun theo tần suất", () => {
    const base = new Date("2026-06-10T08:00:00Z");
    expect(computeNextRun(base, "WEEKLY").toISOString()).toBe(new Date("2026-06-17T08:00:00Z").toISOString());
    expect(computeNextRun(base, "BIWEEKLY").toISOString()).toBe(new Date("2026-06-24T08:00:00Z").toISOString());
    expect(computeNextRun(base, "MONTHLY").toISOString()).toBe(new Date("2026-07-10T08:00:00Z").toISOString());
  });

  it("không đột biến tham số đầu vào", () => {
    const base = new Date("2026-06-10T08:00:00Z");
    computeNextRun(base, "WEEKLY");
    expect(base.toISOString()).toBe("2026-06-10T08:00:00.000Z");
  });

  it("isDue", () => {
    const now = new Date("2026-06-15T00:00:00Z");
    expect(isDue(new Date("2026-06-14T00:00:00Z"), now)).toBe(true);
    expect(isDue(new Date("2026-06-16T00:00:00Z"), now)).toBe(false);
    expect(isDue(null, now)).toBe(false);
  });

  it("advanceUntilFuture nhảy qua nhiều kỳ đã lỡ", () => {
    const missed = new Date("2026-05-01T08:00:00Z");
    const now = new Date("2026-06-15T08:00:00Z");
    const next = advanceUntilFuture(missed, "WEEKLY", now);
    expect(next.getTime()).toBeGreaterThan(now.getTime());
    // mốc kế tiếp đầu tiên sau now (chuỗi +7 ngày từ 01/05): 19/06
    expect(next.toISOString()).toBe(new Date("2026-06-19T08:00:00Z").toISOString());
  });
});
