import { describe, it, expect } from "vitest";
import { applySm2, applyKnownOnPick, gradeFromReview, statusFromInterval } from "./sm2";

describe("sm2", () => {
  it("first remember sets interval=1, then 3, then ef-based", () => {
    const a = applySm2({ interval: 0, easeFactor: 2.5, repetitions: 0 }, 4);
    expect(a.interval).toBe(1);
    expect(a.repetitions).toBe(1);
    const b = applySm2(a, 4);
    expect(b.interval).toBe(3);
    const c = applySm2(b, 4);
    expect(c.interval).toBeGreaterThanOrEqual(7);
  });

  it("forgot resets repetitions and interval to 1", () => {
    const r = applySm2({ interval: 30, easeFactor: 2.5, repetitions: 5 }, 0);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(1);
  });

  it("ease factor never below 1.3", () => {
    let s = { interval: 1, easeFactor: 1.3, repetitions: 1 };
    for (let i = 0; i < 10; i++) s = applySm2(s, 0);
    expect(s.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("known on pick = familiar interval 3", () => {
    expect(applyKnownOnPick().status).toBe("FAMILIAR");
    expect(applyKnownOnPick().interval).toBe(3);
  });

  it("grade mapping", () => {
    expect(gradeFromReview(false, false)).toBe(0);
    expect(gradeFromReview(true, false)).toBe(4);
    expect(gradeFromReview(true, true)).toBe(3);
  });

  it("status thresholds", () => {
    expect(statusFromInterval(0)).toBe("LEARNING");
    expect(statusFromInterval(3)).toBe("LEARNING");
    expect(statusFromInterval(7)).toBe("FAMILIAR");
    expect(statusFromInterval(29)).toBe("FAMILIAR");
    expect(statusFromInterval(30)).toBe("MASTERED");
  });
});
