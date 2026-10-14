import "server-only";

import { deriveAlbumYear, listAlbumYears, selectInitialAlbumYear } from "../overview";
import type { AlbumSessionDetail, AlbumYear } from "../types";
import { getCivilDateInTimeZone } from "../../reading-goals/current-date";
import { mapAnnualReadingGoal } from "../../reading-goals/server/mappers";
import { createReadOnlyClient } from "../../supabase/server";
import { mapProgressEntry, PROGRESS_ENTRY_COLUMNS } from "../../reading/mappers";
import {
  HOME_LIBRARY_COLUMNS,
  mapHomeReadings,
} from "../../home/server/queries";
import { HomeError, mapHomeReadError } from "../../home/server/errors";

export async function getInitialAlbumYear(
  instant: Date = new Date(),
): Promise<number> {
  const supabase = await createReadOnlyClient();
  const { data: identity, error: identityError } = await supabase.auth.getClaims();
  if (identityError || typeof identity?.claims?.sub !== "string") {
    throw new HomeError("unauthenticated", {
      operation: "authenticateAlbumRead",
      cause: identityError,
    });
  }
  const [profileResult, libraryResult] = await Promise.all([
    supabase.from("profiles").select("timezone").single(),
    supabase.from("user_editions").select(HOME_LIBRARY_COLUMNS),
  ]);
  if (profileResult.error || !profileResult.data) {
    throw mapHomeReadError(profileResult.error ?? {}, "getAlbumProfile");
  }
  if (libraryResult.error) {
    throw mapHomeReadError(libraryResult.error, "getAlbumReadings");
  }
  let currentYear: number;
  try {
    currentYear = Number(
      getCivilDateInTimeZone(instant, profileResult.data.timezone).slice(0, 4),
    );
  } catch (error) {
    throw new HomeError("unexpected", { operation: "getAlbumCurrentDate", cause: error });
  }
  return selectInitialAlbumYear(
    currentYear,
    listAlbumYears(mapHomeReadings(libraryResult.data)),
  );
}

export async function getAlbumYear(
  requestedYear?: number,
  instant: Date = new Date(),
): Promise<AlbumYear & { currentYear: number; currentMonth: number }> {
  const supabase = await createReadOnlyClient();
  const { data: identity, error: identityError } = await supabase.auth.getClaims();
  if (identityError || typeof identity?.claims?.sub !== "string") {
    throw new HomeError("unauthenticated", {
      operation: "authenticateAlbumRead",
      cause: identityError,
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, reading_days_per_week")
    .single();
  if (profileError || !profile) {
    throw mapHomeReadError(profileError ?? {}, "getAlbumProfile");
  }

  let currentDate: string;
  try {
    currentDate = getCivilDateInTimeZone(instant, profile.timezone);
  } catch (error) {
    throw new HomeError("unexpected", { operation: "getAlbumCurrentDate", cause: error });
  }
  const currentYear = Number(currentDate.slice(0, 4));

  const [libraryResult, progressResult] = await Promise.all([
    supabase.from("user_editions").select(HOME_LIBRARY_COLUMNS),
    supabase.from("progress_entries").select("occurred_on").eq("kind", "PROGRESS"),
  ]);
  if (libraryResult.error) {
    throw mapHomeReadError(libraryResult.error, "getAlbumReadings");
  }
  if (progressResult.error) {
    throw mapHomeReadError(progressResult.error, "getAlbumProgressDates");
  }

  const readings = mapHomeReadings(libraryResult.data);
  const availableYears = listAlbumYears(readings);
  const year = requestedYear ?? selectInitialAlbumYear(currentYear, availableYears);
  if (!Number.isSafeInteger(year) || year < 1 || year > 9999) {
    throw new HomeError("unexpected", { operation: "getAlbumYear" });
  }
  const { data: goalRow, error: goalError } = await supabase
    .from("annual_reading_goals")
    .select("id, year, target_count, created_at, updated_at")
    .eq("year", year)
    .maybeSingle();
  if (goalError) throw mapHomeReadError(goalError, "getAlbumGoal");

  return {
    ...deriveAlbumYear({
      year,
      readings,
      goal: goalRow ? mapAnnualReadingGoal(goalRow) : null,
      progressDates: progressResult.data.map(({ occurred_on }) => occurred_on),
      readingDaysPerWeek: profile.reading_days_per_week,
    }),
    currentYear,
    currentMonth: Number(currentDate.slice(5, 7)),
  };
}

export async function getAlbumSessionDetail(
  sessionId: string,
): Promise<AlbumSessionDetail | null> {
  const supabase = await createReadOnlyClient();
  const { data: identity, error: identityError } = await supabase.auth.getClaims();
  if (identityError || typeof identity?.claims?.sub !== "string") {
    throw new HomeError("unauthenticated", {
      operation: "authenticateAlbumSessionRead",
      cause: identityError,
    });
  }

  const { data: session, error: sessionError } = await supabase
    .from("reading_sessions")
    .select(`
      id, status, started_at, finished_at, current_value, progress_unit, created_at,
      user_edition:user_editions!reading_sessions_user_edition_id_fkey(
        id,
        edition:editions!user_editions_edition_id_fkey(
          format, cover_url, page_count, audio_duration_minutes,
          work:works!editions_work_id_fkey(
            id, title,
            work_authors(position,author:authors!work_authors_author_id_fkey(id,name))
          )
        )
      )
    `)
    .eq("id", sessionId)
    .eq("status", "FINISHED")
    .maybeSingle();
  if (sessionError) throw mapHomeReadError(sessionError, "getAlbumSession");
  if (!session) return null;

  const { data: progressRows, error: progressError } = await supabase
    .from("progress_entries")
    .select(PROGRESS_ENTRY_COLUMNS)
    .eq("reading_session_id", sessionId)
    .order("occurred_on", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (progressError) throw mapHomeReadError(progressError, "getAlbumSessionProgress");

  const membership = session.user_edition;
  const edition = membership?.edition;
  const work = edition?.work;
  if (!membership || !edition || !work || !session.finished_at) {
    throw new HomeError("unexpected", { operation: "mapAlbumSession" });
  }
  if (
    session.progress_unit !== "PAGES" &&
    session.progress_unit !== "PERCENT" &&
    session.progress_unit !== "MINUTES"
  ) {
    throw new HomeError("unexpected", { operation: "mapAlbumSession" });
  }

  return {
    reading: {
      id: session.id,
      status: "FINISHED",
      startedAt: session.started_at,
      finishedAt: session.finished_at,
      currentValue: session.current_value,
      progressUnit: session.progress_unit,
      createdAt: session.created_at,
      isReread: false,
      book: {
        userEditionId: membership.id,
        workId: work.id,
        title: work.title,
        authors: [...work.work_authors]
          .sort((left, right) => left.position - right.position || left.author.id.localeCompare(right.author.id))
          .map(({ author }) => author.name),
        format: edition.format,
        coverSrc: edition.cover_url,
        pageCount: edition.page_count,
        audioDurationMinutes: edition.audio_duration_minutes,
      },
    },
    progressEntries: progressRows.map(mapProgressEntry),
  };
}
