import { isValidCivilDate } from "../reading/validation";
import type { WeeklyReadingStreak } from "./types";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const WEEK_IN_MILLISECONDS = 7 * DAY_IN_MILLISECONDS;

function assertValidRequiredDaysPerWeek(requiredDaysPerWeek: number): void {
  if (
    Number.isSafeInteger(requiredDaysPerWeek) === false ||
    requiredDaysPerWeek < 1 ||
    requiredDaysPerWeek > 7
  ) {
    throw new RangeError(
      "requiredDaysPerWeek must be an integer between 1 and 7.",
    );
  }
}

// UTC is used only as deterministic Gregorian calendar arithmetic. These
// civil dates are never interpreted in the process or profile timezone.
function civilDateToTimestamp(value: string): number {
  if (!isValidCivilDate(value)) {
    throw new RangeError(`Invalid civil date: ${value}`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

function mondayTimestamp(timestamp: number): number {
  const dayOfWeek = new Date(timestamp).getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return timestamp - daysSinceMonday * DAY_IN_MILLISECONDS;
}

function deriveActiveDaysByWeek(
  activityDates: readonly string[],
  maximumDate?: string,
): Map<number, Set<number>> {
  const maximumTimestamp = maximumDate === undefined
    ? undefined
    : civilDateToTimestamp(maximumDate);
  const activeDaysByWeek = new Map<number, Set<number>>();

  for (const activityDate of activityDates) {
    const timestamp = civilDateToTimestamp(activityDate);
    if (maximumTimestamp === undefined || timestamp <= maximumTimestamp) {
      const week = mondayTimestamp(timestamp);
      const activeDays = activeDaysByWeek.get(week) ?? new Set<number>();
      activeDays.add(timestamp);
      activeDaysByWeek.set(week, activeDays);
    }
  }

  return activeDaysByWeek;
}

function deriveCompletedWeekTimestamps(
  activityDates: readonly string[],
  requiredDaysPerWeek: number,
  maximumDate?: string,
): Set<number> {
  assertValidRequiredDaysPerWeek(requiredDaysPerWeek);
  const completedWeeks = new Set<number>();

  for (const [week, activeDays] of deriveActiveDaysByWeek(
    activityDates,
    maximumDate,
  )) {
    if (activeDays.size >= requiredDaysPerWeek) {
      completedWeeks.add(week);
    }
  }

  return completedWeeks;
}

function currentStreakFromWeeks(
  activeWeeks: ReadonlySet<number>,
  currentDate: string,
): number {
  const currentWeek = mondayTimestamp(civilDateToTimestamp(currentDate));
  let week = activeWeeks.has(currentWeek)
    ? currentWeek
    : currentWeek - WEEK_IN_MILLISECONDS;
  let streak = 0;

  while (activeWeeks.has(week)) {
    streak += 1;
    week -= WEEK_IN_MILLISECONDS;
  }

  return streak;
}

function longestStreakFromWeeks(activeWeeks: ReadonlySet<number>): number {
  const sortedWeeks = [...activeWeeks].sort((left, right) => left - right);
  let longest = 0;
  let current = 0;
  let previous: number | undefined;

  for (const week of sortedWeeks) {
    current = previous !== undefined && week - previous === WEEK_IN_MILLISECONDS
      ? current + 1
      : 1;
    longest = Math.max(longest, current);
    previous = week;
  }

  return longest;
}

export function deriveCurrentWeeklyReadingStreak(
  activityDates: readonly string[],
  currentDate: string,
  requiredDaysPerWeek: number,
): number {
  return currentStreakFromWeeks(
    deriveCompletedWeekTimestamps(
      activityDates,
      requiredDaysPerWeek,
      currentDate,
    ),
    currentDate,
  );
}

export function deriveLongestWeeklyReadingStreak(
  activityDates: readonly string[],
  requiredDaysPerWeek: number,
): number {
  return longestStreakFromWeeks(
    deriveCompletedWeekTimestamps(activityDates, requiredDaysPerWeek),
  );
}

export function deriveCurrentWeekActiveDays(
  activityDates: readonly string[],
  currentDate: string,
): number {
  const currentTimestamp = civilDateToTimestamp(currentDate);
  const currentWeek = mondayTimestamp(currentTimestamp);
  return deriveActiveDaysByWeek(activityDates, currentDate).get(currentWeek)
    ?.size ?? 0;
}

export function deriveWeeklyReadingStreak(
  activityDates: readonly string[],
  currentDate: string,
  requiredDaysPerWeek: number,
): WeeklyReadingStreak {
  const historicalWeeks = deriveCompletedWeekTimestamps(
    activityDates,
    requiredDaysPerWeek,
  );
  const currentWeeks = deriveCompletedWeekTimestamps(
    activityDates,
    requiredDaysPerWeek,
    currentDate,
  );

  return {
    current: currentStreakFromWeeks(currentWeeks, currentDate),
    longest: longestStreakFromWeeks(historicalWeeks),
  };
}
