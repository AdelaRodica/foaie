import { isValidCivilDate } from "../reading/validation";
import { deriveReadingActivityDates } from "./activity";
import { deriveAnnualReadingGoalProgress } from "./goal-progress";
import { deriveWeeklyReadingStreak } from "./streak";
import type {
  AnnualReadingGoal,
  AnnualReadingGoalProgress,
  WeeklyReadingStreak,
} from "./types";

export type ReadingGoalsOverview = Readonly<{
  currentDate: string;
  year: number;
  goal: AnnualReadingGoal | null;
  goalProgress: AnnualReadingGoalProgress | null;
  streak: WeeklyReadingStreak;
}>;

type ReadingGoalsOverviewInput = Readonly<{
  currentDate: string;
  goal: AnnualReadingGoal | null;
  finishedDates: readonly string[];
  progressDates: readonly string[];
}>;

export function deriveReadingGoalsOverview({
  currentDate,
  goal,
  finishedDates,
  progressDates,
}: ReadingGoalsOverviewInput): ReadingGoalsOverview {
  if (!isValidCivilDate(currentDate)) {
    throw new RangeError("currentDate must be a valid civil date.");
  }

  const year = Number(currentDate.slice(0, 4));
  if (goal && goal.year !== year) {
    throw new RangeError("The annual goal must belong to the current year.");
  }

  const activityDates = deriveReadingActivityDates(progressDates, finishedDates);
  const currentCount = finishedDates.filter(
    (finishedDate) => Number(finishedDate.slice(0, 4)) === year,
  ).length;

  return {
    currentDate,
    year,
    goal,
    goalProgress: goal
      ? deriveAnnualReadingGoalProgress(goal, currentCount)
      : null,
    streak: deriveWeeklyReadingStreak(activityDates, currentDate),
  };
}
