import "server-only";

import { mapReadingMutationError } from "../errors";
import {
  mapReadingSession,
  READING_SESSION_COLUMNS,
} from "../mappers";
import type { ReadingSession, StartReadingInput } from "../types";
import { createAuthenticatedReadingWritableClient } from "./auth";

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
