import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createAnnualReadingGoalMock,
  deleteAnnualReadingGoalMock,
  revalidatePathMock,
  updateAnnualReadingGoalMock,
} = vi.hoisted(() => ({
  createAnnualReadingGoalMock: vi.fn(),
  deleteAnnualReadingGoalMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  updateAnnualReadingGoalMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("./server/mutations", () => ({
  createAnnualReadingGoal: createAnnualReadingGoalMock,
  deleteAnnualReadingGoal: deleteAnnualReadingGoalMock,
  updateAnnualReadingGoal: updateAnnualReadingGoalMock,
}));

import {
  createAnnualReadingGoalAction,
  deleteAnnualReadingGoalAction,
  updateAnnualReadingGoalAction,
} from "./actions";
import { INITIAL_READING_GOAL_ACTION_STATE } from "./action-result";
import { ReadingGoalError } from "./server/errors";

const GOAL_ID = "6f059a14-4067-4c32-8f55-7ad353feca2c";

function makeFormData(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

describe("annual reading goal actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates once and revalidates only ajustes", async () => {
    const result = await createAnnualReadingGoalAction(
      INITIAL_READING_GOAL_ACTION_STATE,
      makeFormData({ year: "2026", targetCount: "12" }),
    );

    expect(createAnnualReadingGoalMock).toHaveBeenCalledOnce();
    expect(createAnnualReadingGoalMock).toHaveBeenCalledWith({
      year: 2026,
      targetCount: 12,
    });
    expect(revalidatePathMock).toHaveBeenCalledOnce();
    expect(revalidatePathMock).toHaveBeenCalledWith("/ajustes");
    expect(result).toEqual({
      status: "success",
      message: "Objetivo de lectura creado.",
    });
  });

  it("does not call create or revalidate for invalid input", async () => {
    const result = await createAnnualReadingGoalAction(
      INITIAL_READING_GOAL_ACTION_STATE,
      makeFormData({ year: "", targetCount: "0" }),
    );

    expect(createAnnualReadingGoalMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(result.status).toBe("error");
  });

  it("updates once and revalidates ajustes", async () => {
    const result = await updateAnnualReadingGoalAction(
      INITIAL_READING_GOAL_ACTION_STATE,
      makeFormData({ goalId: GOAL_ID, targetCount: "18" }),
    );

    expect(updateAnnualReadingGoalMock).toHaveBeenCalledOnce();
    expect(updateAnnualReadingGoalMock).toHaveBeenCalledWith({
      goalId: GOAL_ID,
      targetCount: 18,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/ajustes");
    expect(result.status).toBe("success");
  });

  it("does not call update for invalid input", async () => {
    await updateAnnualReadingGoalAction(
      INITIAL_READING_GOAL_ACTION_STATE,
      makeFormData({ goalId: "invalid", targetCount: "18" }),
    );

    expect(updateAnnualReadingGoalMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("deletes once and revalidates ajustes", async () => {
    const result = await deleteAnnualReadingGoalAction(
      INITIAL_READING_GOAL_ACTION_STATE,
      makeFormData({ goalId: GOAL_ID }),
    );

    expect(deleteAnnualReadingGoalMock).toHaveBeenCalledOnce();
    expect(deleteAnnualReadingGoalMock).toHaveBeenCalledWith(GOAL_ID);
    expect(revalidatePathMock).toHaveBeenCalledWith("/ajustes");
    expect(result.status).toBe("success");
  });

  it("does not call delete for invalid input", async () => {
    await deleteAnnualReadingGoalAction(
      INITIAL_READING_GOAL_ACTION_STATE,
      makeFormData({ goalId: "invalid" }),
    );

    expect(deleteAnnualReadingGoalMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it.each([
    ["update", updateAnnualReadingGoalMock, updateAnnualReadingGoalAction],
    ["delete", deleteAnnualReadingGoalMock, deleteAnnualReadingGoalAction],
  ] as const)("revalidates stale UI when %s returns not found", async (name, mock, action) => {
    mock.mockRejectedValueOnce(
      new ReadingGoalError("not_found", { cause: "raw detail" }),
    );
    const formData =
      name === "update"
        ? makeFormData({ goalId: GOAL_ID, targetCount: "12" })
        : makeFormData({ goalId: GOAL_ID });

    const result = await action(INITIAL_READING_GOAL_ACTION_STATE, formData);

    expect(revalidatePathMock).toHaveBeenCalledOnce();
    expect(revalidatePathMock).toHaveBeenCalledWith("/ajustes");
    expect(result).toEqual({
      status: "error",
      kind: "not_found",
      message: "Ese objetivo de lectura ya no existe.",
    });
  });
});
