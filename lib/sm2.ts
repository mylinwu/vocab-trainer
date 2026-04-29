// Simplified SM-2 spaced-repetition algorithm.

export type Status = "LEARNING" | "FAMILIAR" | "MASTERED";

export interface Sm2State {
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export interface Sm2Result extends Sm2State {
  status: Status;
  nextReviewDate: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function statusFromInterval(interval: number): Status {
  if (interval < 7)  return "LEARNING";
  if (interval < 30) return "FAMILIAR";
  return "MASTERED";
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + days * DAY_MS);
}

/** Apply quality grade q in {0, 3, 4} per simplified SM-2. */
export function applySm2(prev: Sm2State, q: 0 | 3 | 4, today: Date = new Date()): Sm2Result {
  let { interval, easeFactor, repetitions } = prev;
  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 3;
    else interval = Math.round(interval * easeFactor);
  }
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  return {
    interval,
    easeFactor,
    repetitions,
    status: statusFromInterval(interval),
    nextReviewDate: addDays(today, interval),
  };
}

/** Selecting "known" (check) on the picking screen jumps directly to FAMILIAR with interval=3. */
export function applyKnownOnPick(today: Date = new Date()): Sm2Result {
  return {
    interval: 3,
    easeFactor: 2.5,
    repetitions: 2,
    status: "FAMILIAR",
    nextReviewDate: addDays(today, 3),
  };
}

/** Selecting "unknown" (cross) just queues for learning, no schedule yet. */
export function applyUnknownOnPick(): Sm2State & { status: Status } {
  return { interval: 0, easeFactor: 2.5, repetitions: 0, status: "LEARNING" };
}

/** Map review answers + detail-viewed flag to a quality grade. */
export function gradeFromReview(remembered: boolean, detailViewed: boolean): 0 | 3 | 4 {
  if (!remembered) return 0;
  return detailViewed ? 3 : 4;
}
