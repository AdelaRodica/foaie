import "server-only";

import { getCivilDateInTimeZone } from "../current-date";
import {
  deriveReadingGoalsOverview,
  type ReadingGoalsOverview,
} from "../overview";
import type { AnnualReadingGoal } from "../types";
import {
  assertSafeYear,
  mapReadingGoalReadError,
  ReadingGoalError,
} from "./errors";
import {
  ANNUAL_READING_GOAL_COLUMNS,
  mapAnnualReadingGoal,
} from "./mappers";
import { createAuthenticatedReadingGoalReadClient } from "./auth";

export async function getAnnualReadingGoal(
  year: number,
): Promise<AnnualReadingGoal | null> {
  assertSafeYear(year, "getAnnualReadingGoal");
  const supabase = await createAuthenticatedReadingGoalReadClient();
  const { data, error } = await supabase
    .from("annual_reading_goals")
    .select(ANNUAL_READING_GOAL_COLUMNS)
    .eq("year", year)
    .maybeSingle();

  if (error) throw mapReadingGoalReadError(error, "getAnnualReadingGoal");
  return data ? mapAnnualReadingGoal(data) : null;
}

export async function listFinishedReadingDates(): Promise<string[]> {
  const supabase = await createAuthenticatedReadingGoalReadClient();
  const { data, error } = await supabase
    .from("reading_sessions")
    .select("finished_at")
    .eq("status", "FINISHED");

  if (error) throw mapReadingGoalReadError(error, "listFinishedReadingDates");
  if (data.some(({ finished_at }) => finished_at === null)) {
    throw new ReadingGoalError("unexpected", {
      operation: "listFinishedReadingDates",
    });
  }

  const finishedDates: string[] = [];
  for (const { finished_at: finishedAt } of data) {
    if (finishedAt === null) {
      throw new ReadingGoalError("unexpected", {
        operation: "listFinishedReadingDates",
      });
    }
    finishedDates.push(finishedAt);
  }
  return finishedDates;
}

export async function listProgressReadingDates(): Promise<string[]> {
  const supabase = await createAuthenticatedReadingGoalReadClient();
  const { data, error } = await supabase
    .from("progress_entries")
    .select("occurred_on")
    .eq("kind", "PROGRESS");

  if (error) throw mapReadingGoalReadError(error, "listProgressReadingDates");
  return data.map(({ occurred_on }) => occurred_on);
}

async function getProfileTimezone(): Promise<string> {
  const supabase = await createAuthenticatedReadingGoalReadClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("timezone")
    .single();

  if (error) throw mapReadingGoalReadError(error, "getProfileTimezone");
  return data.timezone;
}

export async function getReadingGoalsOverview(
  instant: Date = new Date(),
): Promise<ReadingGoalsOverview> {
  const timezone = await getProfileTimezone();
  let currentDate: string;

  try {
    currentDate = getCivilDateInTimeZone(instant, timezone);
  } catch (error) {
    throw new ReadingGoalError("unexpected", {
      operation: "getReadingGoalsOverview.currentDate",
      cause: error,
    });
  }

  const year = Number(currentDate.slice(0, 4));
  const [goal, finishedDates, progressDates] = await Promise.all([
    getAnnualReadingGoal(year),
    listFinishedReadingDates(),
    listProgressReadingDates(),
  ]);

  return deriveReadingGoalsOverview({
    currentDate,
    goal,
    finishedDates,
    progressDates,
  });
}
