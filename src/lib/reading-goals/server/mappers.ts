import type { Database } from "@/types/database.types";

import type { AnnualReadingGoal } from "../types";
import { ReadingGoalError } from "./errors";

export const ANNUAL_READING_GOAL_COLUMNS =
  "id, year, target_count, created_at, updated_at";

type AnnualReadingGoalTableRow =
  Database["public"]["Tables"]["annual_reading_goals"]["Row"];

export type AnnualReadingGoalRow = Pick<
  AnnualReadingGoalTableRow,
  "id" | "year" | "target_count" | "created_at" | "updated_at"
>;

export function mapAnnualReadingGoal(
  row: AnnualReadingGoalRow,
): AnnualReadingGoal {
  if (
    !Number.isSafeInteger(row.year)
    || !Number.isSafeInteger(row.target_count)
    || row.target_count <= 0
  ) {
    throw new ReadingGoalError("unexpected", {
      operation: "mapAnnualReadingGoal",
    });
  }

  return {
    id: row.id,
    year: row.year,
    targetCount: row.target_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
