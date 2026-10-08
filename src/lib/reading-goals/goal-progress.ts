import type {
  AnnualReadingGoal,
  AnnualReadingGoalProgress,
} from "./types";

function assertPositiveSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive safe integer.`);
  }
}

function assertNonnegativeSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a nonnegative safe integer.`);
  }
}

export function deriveAnnualReadingGoalProgress(
  goal: AnnualReadingGoal,
  finishedCount: number,
): AnnualReadingGoalProgress {
  assertPositiveSafeInteger(goal.targetCount, "targetCount");
  assertNonnegativeSafeInteger(finishedCount, "finishedCount");

  return {
    year: goal.year,
    targetCount: goal.targetCount,
    currentCount: finishedCount,
    remainingCount: Math.max(goal.targetCount - finishedCount, 0),
    achieved: finishedCount >= goal.targetCount,
    exceeded: finishedCount > goal.targetCount,
  };
}
