"use server";

import { revalidatePath } from "next/cache";

import {
  mapUnknownReadingActionError,
  readingActionSuccess,
  readingValidationFailure,
  type ReadingActionState,
} from "./action-result";
import { ReadingError } from "./errors";
import {
  abandonReading,
  finishReading,
  recordReadingProgress,
  startReading,
} from "./server/mutations";
import {
  abandonReadingSchema,
  finishReadingSchema,
  recordReadingProgressSchema,
  startReadingSchema,
} from "./validation";

function shouldRevalidateAfterError(error: unknown, kinds: readonly string[]) {
  return error instanceof ReadingError && kinds.includes(error.kind);
}

export async function startReadingAction(
  _previousState: ReadingActionState,
  formData: FormData,
): Promise<ReadingActionState> {
  const parsed = startReadingSchema.safeParse({
    userEditionId: formData.get("userEditionId"),
    startedAt: formData.get("startedAt"),
    progressUnit: formData.get("progressUnit"),
    currentValue: formData.get("currentValue"),
  });
  if (!parsed.success) return readingValidationFailure(parsed.error);

  try {
    await startReading({
      userEditionId: parsed.data.userEditionId,
      startedAt: parsed.data.startedAt,
      progressUnit: parsed.data.progressUnit,
      ...(parsed.data.currentValue === undefined
        ? {}
        : { currentValue: parsed.data.currentValue }),
    });
    revalidatePath("/biblioteca");
    return readingActionSuccess("Lectura iniciada.");
  } catch (error) {
    if (shouldRevalidateAfterError(error, ["conflict", "invalid_transition", "not_found"])) {
      revalidatePath("/biblioteca");
    }
    return mapUnknownReadingActionError(error);
  }
}

export async function recordReadingProgressAction(
  _previousState: ReadingActionState,
  formData: FormData,
): Promise<ReadingActionState> {
  const parsed = recordReadingProgressSchema.safeParse({
    sessionId: formData.get("sessionId"),
    targetValue: formData.get("targetValue"),
    kind: formData.get("kind"),
    occurredOn: formData.get("occurredOn"),
  });
  if (!parsed.success) return readingValidationFailure(parsed.error);

  try {
    await recordReadingProgress({
      readingSessionId: parsed.data.sessionId,
      targetValue: parsed.data.targetValue,
      kind: parsed.data.kind,
      occurredOn: parsed.data.occurredOn,
    });
    revalidatePath("/biblioteca");
    return readingActionSuccess(
      parsed.data.kind === "PROGRESS"
        ? "Progreso actualizado."
        : "Progreso corregido.",
    );
  } catch (error) {
    if (shouldRevalidateAfterError(error, ["invalid_transition", "not_found"])) {
      revalidatePath("/biblioteca");
    }
    return mapUnknownReadingActionError(error);
  }
}

export async function finishReadingAction(
  _previousState: ReadingActionState,
  formData: FormData,
): Promise<ReadingActionState> {
  const parsed = finishReadingSchema.safeParse({
    sessionId: formData.get("sessionId"),
    finishedAt: formData.get("finishedAt"),
  });
  if (!parsed.success) return readingValidationFailure(parsed.error);

  try {
    await finishReading(parsed.data.sessionId, parsed.data.finishedAt);
    revalidatePath("/biblioteca");
    return readingActionSuccess("Lectura terminada.");
  } catch (error) {
    if (shouldRevalidateAfterError(error, ["invalid_transition", "not_found"])) {
      revalidatePath("/biblioteca");
    }
    return mapUnknownReadingActionError(error);
  }
}

export async function abandonReadingAction(
  _previousState: ReadingActionState,
  formData: FormData,
): Promise<ReadingActionState> {
  const parsed = abandonReadingSchema.safeParse({
    sessionId: formData.get("sessionId"),
    abandonedAt: formData.get("abandonedAt"),
  });
  if (!parsed.success) return readingValidationFailure(parsed.error);

  try {
    await abandonReading(parsed.data.sessionId, parsed.data.abandonedAt);
    revalidatePath("/biblioteca");
    return readingActionSuccess("Lectura abandonada.");
  } catch (error) {
    if (shouldRevalidateAfterError(error, ["invalid_transition", "not_found"])) {
      revalidatePath("/biblioteca");
    }
    return mapUnknownReadingActionError(error);
  }
}
