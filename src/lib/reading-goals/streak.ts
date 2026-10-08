import { isValidCivilDate } from "../reading/validation";
import type { WeeklyReadingStreak } from "./types";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const WEEK_IN_MILLISECONDS = 7 * DAY_IN_MILLISECONDS;

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

function deriveActiveWeekTimestamps(
  activityDates: readonly string[],
  maximumDate?: string,
): Set<number> {
  const maximumTimestamp = maximumDate === undefined
    ? undefined
    : civilDateToTimestamp(maximumDate);
  const activeWeeks = new Set<number>();

  for (const activityDate of activityDates) {
    const timestamp = civilDateToTimestamp(activityDate);
    if (maximumTimestamp === undefined || timestamp <= maximumTimestamp) {
      activeWeeks.add(mondayTimestamp(timestamp));
    }
  }

  return activeWeeks;
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
): number {
  return currentStreakFromWeeks(
    deriveActiveWeekTimestamps(activityDates, currentDate),
    currentDate,
  );
}

export function deriveLongestWeeklyReadingStreak(
  activityDates: readonly string[],
): number {
  return longestStreakFromWeeks(deriveActiveWeekTimestamps(activityDates));
}

export function deriveWeeklyReadingStreak(
  activityDates: readonly string[],
  currentDate: string,
): WeeklyReadingStreak {
  const historicalWeeks = deriveActiveWeekTimestamps(activityDates);
  const currentWeeks = deriveActiveWeekTimestamps(activityDates, currentDate);

  return {
    current: currentStreakFromWeeks(currentWeeks, currentDate),
    longest: longestStreakFromWeeks(historicalWeeks),
  };
}
