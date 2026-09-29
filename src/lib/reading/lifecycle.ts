import { ReadingError } from "./errors";
import type {
  AbandonReadingResult,
  FinishReadingResult,
  ReadingSession,
} from "./types";

export function resolveFinishReadingFallback(
  session: ReadingSession | null,
): FinishReadingResult {
  if (!session) {
    throw new ReadingError("not_found", { operation: "finishReading" });
  }

  if (session.status === "FINISHED") {
    return { outcome: "already_finished", session };
  }

  if (session.status === "ABANDONED") {
    throw new ReadingError("invalid_transition", { operation: "finishReading" });
  }

  throw new ReadingError("unexpected", { operation: "finishReading" });
}

export function resolveAbandonReadingFallback(
  session: ReadingSession | null,
): AbandonReadingResult {
  if (!session) {
    throw new ReadingError("not_found", { operation: "abandonReading" });
  }

  if (session.status === "ABANDONED") {
    return { outcome: "already_abandoned", session };
  }

  if (session.status === "FINISHED") {
    throw new ReadingError("invalid_transition", { operation: "abandonReading" });
  }

  throw new ReadingError("unexpected", { operation: "abandonReading" });
}
