import "server-only";

import { mapReadingReadError } from "../errors";
import {
  mapProgressEntry,
  mapReadingSession,
  PROGRESS_ENTRY_COLUMNS,
  READING_SESSION_COLUMNS,
} from "../mappers";
import type { ProgressEntry, ReadingSession } from "../types";
import { createAuthenticatedReadingReadClient } from "./auth";

export async function listReadingSessionsForUserEdition(
  userEditionId: string,
): Promise<ReadingSession[]> {
  const supabase = await createAuthenticatedReadingReadClient();
  const { data, error } = await supabase
    .from("reading_sessions")
    .select(READING_SESSION_COLUMNS)
    .eq("user_edition_id", userEditionId)
    .order("started_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw mapReadingReadError(error, "listReadingSessionsForUserEdition");
  }

  return data.map(mapReadingSession);
}

export async function getActiveReadingSession(
  userEditionId: string,
): Promise<ReadingSession | null> {
  const supabase = await createAuthenticatedReadingReadClient();
  const { data, error } = await supabase
    .from("reading_sessions")
    .select(READING_SESSION_COLUMNS)
    .eq("user_edition_id", userEditionId)
    .eq("status", "READING")
    .maybeSingle();

  if (error) {
    throw mapReadingReadError(error, "getActiveReadingSession");
  }

  return data ? mapReadingSession(data) : null;
}

export async function getReadingSession(
  sessionId: string,
): Promise<ReadingSession | null> {
  const supabase = await createAuthenticatedReadingReadClient();
  const { data, error } = await supabase
    .from("reading_sessions")
    .select(READING_SESSION_COLUMNS)
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw mapReadingReadError(error, "getReadingSession");
  }

  return data ? mapReadingSession(data) : null;
}

export async function listProgressEntries(
  sessionId: string,
): Promise<ProgressEntry[]> {
  const supabase = await createAuthenticatedReadingReadClient();
  const { data, error } = await supabase
    .from("progress_entries")
    .select(PROGRESS_ENTRY_COLUMNS)
    .eq("reading_session_id", sessionId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw mapReadingReadError(error, "listProgressEntries");
  }

  return data.map(mapProgressEntry);
}
