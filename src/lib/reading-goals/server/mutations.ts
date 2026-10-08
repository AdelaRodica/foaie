import "server-only";

import type { AnnualReadingGoal } from "../types";
import { createAuthenticatedReadingGoalWritableClient } from "./auth";
import {
  assertPositiveTargetCount,
  assertSafeYear,
  mapReadingGoalMutationError,
  ReadingGoalError,
} from "./errors";
import {
  ANNUAL_READING_GOAL_COLUMNS,
  mapAnnualReadingGoal,
} from "./mappers";

type CreateAnnualReadingGoalInput = Readonly<{
  year: number;
  targetCount: number;
}>;

type UpdateAnnualReadingGoalInput = Readonly<{
  goalId: string;
  targetCount: number;
}>;

export async function createAnnualReadingGoal(
  input: CreateAnnualReadingGoalInput,
): Promise<AnnualReadingGoal> {
  assertSafeYear(input.year, "createAnnualReadingGoal");
  assertPositiveTargetCount(input.targetCount, "createAnnualReadingGoal");
  const supabase = await createAuthenticatedReadingGoalWritableClient();
  const { data, error } = await supabase
    .from("annual_reading_goals")
    .insert({ year: input.year, target_count: input.targetCount })
    .select(ANNUAL_READING_GOAL_COLUMNS)
    .single();

  if (error) throw mapReadingGoalMutationError(error, "createAnnualReadingGoal");
  return mapAnnualReadingGoal(data);
}

export async function updateAnnualReadingGoal(
  input: UpdateAnnualReadingGoalInput,
): Promise<AnnualReadingGoal> {
  assertPositiveTargetCount(input.targetCount, "updateAnnualReadingGoal");
  const supabase = await createAuthenticatedReadingGoalWritableClient();
  const { data, error } = await supabase
    .from("annual_reading_goals")
    .update({ target_count: input.targetCount })
    .eq("id", input.goalId)
    .select(ANNUAL_READING_GOAL_COLUMNS)
    .maybeSingle();

  if (error) throw mapReadingGoalMutationError(error, "updateAnnualReadingGoal");
  if (!data) {
    throw new ReadingGoalError("not_found", {
      operation: "updateAnnualReadingGoal",
    });
  }
  return mapAnnualReadingGoal(data);
}

export async function deleteAnnualReadingGoal(goalId: string): Promise<void> {
  const supabase = await createAuthenticatedReadingGoalWritableClient();
  const { data, error } = await supabase
    .from("annual_reading_goals")
    .delete()
    .eq("id", goalId)
    .select("id")
    .maybeSingle();

  if (error) throw mapReadingGoalMutationError(error, "deleteAnnualReadingGoal");
  if (!data) {
    throw new ReadingGoalError("not_found", {
      operation: "deleteAnnualReadingGoal",
    });
  }
}
