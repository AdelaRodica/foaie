"use server";

import { revalidatePath } from "next/cache";

import {
  mapUnknownReadingGoalActionError,
  readingGoalActionSuccess,
  readingGoalValidationFailure,
  type ReadingGoalActionState,
} from "./action-result";
import { ReadingGoalError } from "./server/errors";
import {
  createAnnualReadingGoal,
  deleteAnnualReadingGoal,
  updateAnnualReadingGoal,
} from "./server/mutations";
import {
  createAnnualReadingGoalSchema,
  deleteAnnualReadingGoalSchema,
  updateAnnualReadingGoalSchema,
} from "./validation";

export async function createAnnualReadingGoalAction(
  _previousState: ReadingGoalActionState,
  formData: FormData,
): Promise<ReadingGoalActionState> {
  const parsed = createAnnualReadingGoalSchema.safeParse({
    year: formData.get("year"),
    targetCount: formData.get("targetCount"),
  });

  if (!parsed.success) {
    return readingGoalValidationFailure(parsed.error);
  }

  try {
    await createAnnualReadingGoal(parsed.data);
    revalidatePath("/ajustes");
    return readingGoalActionSuccess("Objetivo de lectura creado.");
  } catch (error) {
    return mapUnknownReadingGoalActionError(error);
  }
}

export async function updateAnnualReadingGoalAction(
  _previousState: ReadingGoalActionState,
  formData: FormData,
): Promise<ReadingGoalActionState> {
  const parsed = updateAnnualReadingGoalSchema.safeParse({
    goalId: formData.get("goalId"),
    targetCount: formData.get("targetCount"),
  });

  if (!parsed.success) {
    return readingGoalValidationFailure(parsed.error);
  }

  try {
    await updateAnnualReadingGoal(parsed.data);
    revalidatePath("/ajustes");
    return readingGoalActionSuccess("Objetivo de lectura actualizado.");
  } catch (error) {
    if (error instanceof ReadingGoalError && error.kind === "not_found") {
      revalidatePath("/ajustes");
    }

    return mapUnknownReadingGoalActionError(error);
  }
}

export async function deleteAnnualReadingGoalAction(
  _previousState: ReadingGoalActionState,
  formData: FormData,
): Promise<ReadingGoalActionState> {
  const parsed = deleteAnnualReadingGoalSchema.safeParse({
    goalId: formData.get("goalId"),
  });

  if (!parsed.success) {
    return readingGoalValidationFailure(parsed.error);
  }

  try {
    await deleteAnnualReadingGoal(parsed.data.goalId);
    revalidatePath("/ajustes");
    return readingGoalActionSuccess("Objetivo de lectura eliminado.");
  } catch (error) {
    if (error instanceof ReadingGoalError && error.kind === "not_found") {
      revalidatePath("/ajustes");
    }

    return mapUnknownReadingGoalActionError(error);
  }
}
