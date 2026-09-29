import "server-only";

import { mapReadingMutationError, ReadingError } from "../errors";
import {
  resolveAbandonReadingFallback,
  resolveFinishReadingFallback,
} from "../lifecycle";
import {
  mapReadingSession,
  READING_SESSION_COLUMNS,
} from "../mappers";
import type {
  AbandonReadingResult,
  FinishReadingResult,
  ReadingSession,
  StartReadingInput,
} from "../types";
import { createAuthenticatedReadingWritableClient } from "./auth";
import { getReadingSession } from "./queries";

export async function startReading(
  input: StartReadingInput,
): Promise<ReadingSession> {
  const supabase = await createAuthenticatedReadingWritableClient();
  const payload = {
    user_edition_id: input.userEditionId,
    status: "READING",
    started_at: input.startedAt,
    progress_unit: input.progressUnit,
    ...(input.currentValue === undefined
      ? {}
      : { current_value: input.currentValue }),
  };

  const { data, error } = await supabase
    .from("reading_sessions")
    .insert(payload)
    .select(READING_SESSION_COLUMNS)
    .single();

  if (error) throw mapReadingMutationError(error, "startReading");
  return mapReadingSession(data);
}

export async function finishReading(
  sessionId: string,
  finishedAt: string,
): Promise<FinishReadingResult> {
  const supabase = await createAuthenticatedReadingWritableClient();
  const { data, error } = await supabase
    .from("reading_sessions")
    .update({ status: "FINISHED", finished_at: finishedAt })
    .eq("id", sessionId)
    .eq("status", "READING")
    .select(READING_SESSION_COLUMNS)
    .maybeSingle();

  if (error) throw mapReadingMutationError(error, "finishReading");

  if (data) {
    const session = mapReadingSession(data);
    if (session.status !== "FINISHED") {
      throw new ReadingError("unexpected", { operation: "finishReading" });
    }
    return { outcome: "finished", session };
  }

  return resolveFinishReadingFallback(await getReadingSession(sessionId));
}

export async function abandonReading(
  sessionId: string,
  abandonedAt: string,
): Promise<AbandonReadingResult> {
  const supabase = await createAuthenticatedReadingWritableClient();
  const { data, error } = await supabase
    .from("reading_sessions")
    .update({ status: "ABANDONED", abandoned_at: abandonedAt })
    .eq("id", sessionId)
    .eq("status", "READING")
    .select(READING_SESSION_COLUMNS)
    .maybeSingle();

  if (error) throw mapReadingMutationError(error, "abandonReading");

  if (data) {
    const session = mapReadingSession(data);
    if (session.status !== "ABANDONED") {
      throw new ReadingError("unexpected", { operation: "abandonReading" });
    }
    return { outcome: "abandoned", session };
  }

  return resolveAbandonReadingFallback(await getReadingSession(sessionId));
}
