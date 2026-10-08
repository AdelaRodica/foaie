import { isValidCivilDate } from "../reading/validation";

function assertValidDates(dates: readonly string[]): void {
  for (const date of dates) {
    if (!isValidCivilDate(date)) {
      throw new RangeError(`Invalid civil date: ${date}`);
    }
  }
}

export function deriveReadingActivityDates(
  progressDates: readonly string[],
  finishedDates: readonly string[],
): readonly string[] {
  assertValidDates(progressDates);
  assertValidDates(finishedDates);

  return [...new Set([...progressDates, ...finishedDates])].sort();
}
