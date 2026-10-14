import "server-only";

import { getCivilDateInTimeZone } from "../../reading-goals/current-date";
import { mapAnnualReadingGoal } from "../../reading-goals/server/mappers";
import type { ReadingProgressUnit } from "../../reading/types";
import { createReadOnlyClient } from "../../supabase/server";
import { deriveHomeOverview } from "../overview";
import type { HomeOverview, HomeReading } from "../types";
import { HomeError, mapHomeReadError } from "./errors";

const HOME_LIBRARY_COLUMNS = `
  id,
  edition:editions!user_editions_edition_id_fkey(
    format,
    cover_url,
    page_count,
    audio_duration_minutes,
    work:works!editions_work_id_fkey(
      id,
      title,
      work_authors(
        position,
        author:authors!work_authors_author_id_fkey(id,name)
      )
    )
  ),
  reading_sessions!reading_sessions_user_edition_id_fkey(
    id,
    status,
    started_at,
    finished_at,
    current_value,
    progress_unit,
    created_at
  )
`;

type HomeLibraryRow = Readonly<{
  id: string;
  edition: Readonly<{
    format: string;
    cover_url: string | null;
    page_count: number | null;
    audio_duration_minutes: number | null;
    work: Readonly<{
      id: string;
      title: string;
      work_authors: readonly Readonly<{
        position: number;
        author: Readonly<{ id: string; name: string }>;
      }>[];
    }> | null;
  }> | null;
  reading_sessions: readonly Readonly<{
    id: string;
    status: string;
    started_at: string | null;
    finished_at: string | null;
    current_value: number;
    progress_unit: string;
    created_at: string;
  }>[];
}>;

function parseProgressUnit(value: string): ReadingProgressUnit {
  if (value === "PAGES" || value === "PERCENT" || value === "MINUTES") {
    return value;
  }
  throw new HomeError("unexpected", { operation: "mapHomeReadings" });
}

function mapHomeReadings(rows: readonly HomeLibraryRow[]): HomeReading[] {
  return rows.flatMap((row) => {
    const edition = row.edition;
    const work = edition?.work;
    if (!edition || !work) {
      throw new HomeError("unexpected", { operation: "mapHomeReadings" });
    }

    const authors = [...work.work_authors]
      .sort((left, right) =>
        left.position - right.position || left.author.id.localeCompare(right.author.id),
      )
      .map(({ author }) => author.name);

    return row.reading_sessions.flatMap<HomeReading>((session) => {
      if (session.status !== "READING" && session.status !== "FINISHED") {
        return [];
      }
      if (session.status === "FINISHED" && session.finished_at === null) {
        throw new HomeError("unexpected", { operation: "mapHomeReadings" });
      }

      return [{
        id: session.id,
        status: session.status,
        startedAt: session.started_at,
        finishedAt: session.finished_at,
        currentValue: session.current_value,
        progressUnit: parseProgressUnit(session.progress_unit),
        createdAt: session.created_at,
        book: {
          userEditionId: row.id,
          workId: work.id,
          title: work.title,
          authors,
          format: edition.format,
          coverSrc: edition.cover_url,
          pageCount: edition.page_count,
          audioDurationMinutes: edition.audio_duration_minutes,
        },
      }];
    });
  });
}

export async function getHomeOverview(
  instant: Date = new Date(),
): Promise<HomeOverview> {
  const supabase = await createReadOnlyClient();
  const { data: identity, error: identityError } = await supabase.auth.getClaims();

  if (identityError || typeof identity?.claims?.sub !== "string") {
    throw new HomeError("unauthenticated", {
      operation: "authenticateHomeRead",
      cause: identityError,
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, timezone, reading_days_per_week")
    .single();

  if (profileError || !profile) {
    throw mapHomeReadError(profileError ?? {}, "getHomeProfile");
  }
  if (
    !Number.isSafeInteger(profile.reading_days_per_week) ||
    profile.reading_days_per_week < 1 ||
    profile.reading_days_per_week > 7
  ) {
    throw new HomeError("unexpected", { operation: "getHomeProfile" });
  }

  let currentDate: string;
  try {
    currentDate = getCivilDateInTimeZone(instant, profile.timezone);
  } catch (error) {
    throw new HomeError("unexpected", {
      operation: "getHomeCurrentDate",
      cause: error,
    });
  }

  const year = Number(currentDate.slice(0, 4));
  const [libraryResult, goalResult, progressResult] = await Promise.all([
    supabase.from("user_editions").select(HOME_LIBRARY_COLUMNS),
    supabase
      .from("annual_reading_goals")
      .select("id, year, target_count, created_at, updated_at")
      .eq("year", year)
      .maybeSingle(),
    supabase
      .from("progress_entries")
      .select("occurred_on")
      .eq("kind", "PROGRESS"),
  ]);

  if (libraryResult.error) {
    throw mapHomeReadError(libraryResult.error, "getHomeLibrary");
  }
  if (goalResult.error) {
    throw mapHomeReadError(goalResult.error, "getHomeGoal");
  }
  if (progressResult.error) {
    throw mapHomeReadError(progressResult.error, "getHomeProgressDates");
  }

  return deriveHomeOverview({
    displayName: profile.display_name,
    currentDate,
    hasLibrary: libraryResult.data.length > 0,
    readings: mapHomeReadings(libraryResult.data),
    goal: goalResult.data ? mapAnnualReadingGoal(goalResult.data) : null,
    progressDates: progressResult.data.map(({ occurred_on }) => occurred_on),
    readingDaysPerWeek: profile.reading_days_per_week,
  });
}
