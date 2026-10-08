import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReadingGoalError } from "./errors";

const mocks = vi.hoisted(() => ({
  readClient: { from: vi.fn() },
  writableClient: { from: vi.fn() },
}));

vi.mock("server-only", () => ({}));
vi.mock("./auth", () => ({
  createAuthenticatedReadingGoalReadClient: vi.fn(
    async () => mocks.readClient,
  ),
  createAuthenticatedReadingGoalWritableClient: vi.fn(
    async () => mocks.writableClient,
  ),
}));

import {
  createAnnualReadingGoal,
  deleteAnnualReadingGoal,
  updateAnnualReadingGoal,
} from "./mutations";
import {
  getAnnualReadingGoal,
  getReadingGoalsOverview,
  listFinishedReadingDates,
  listProgressReadingDates,
} from "./queries";

const goalRow = {
  id: "goal-id",
  year: 2026,
  target_count: 12,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-02-01T00:00:00.000Z",
};

function createMaybeSingleQuery(result: unknown) {
  const maybeSingle = vi.fn(async () => result);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  return { eq, maybeSingle, select };
}

function createSingleQuery(result: unknown) {
  const single = vi.fn(async () => result);
  const select = vi.fn(() => ({ single }));
  return { select, single };
}

function createFilteredListQuery(result: unknown) {
  const eq = vi.fn(async () => result);
  const select = vi.fn(() => ({ eq }));
  return { eq, select };
}

function createMutationMaybeSingleQuery(result: unknown) {
  const maybeSingle = vi.fn(async () => result);
  const select = vi.fn(() => ({ maybeSingle }));
  const eq = vi.fn(() => ({ select }));
  return { eq, maybeSingle, select };
}

async function expectGoalError(
  operation: Promise<unknown>,
  kind: ReadingGoalError["kind"],
) {
  await expect(operation).rejects.toMatchObject({
    name: "ReadingGoalError",
    kind,
  });
}

describe("reading goal queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets the current user's goal by year without a user identifier", async () => {
    const query = createMaybeSingleQuery({ data: goalRow, error: null });
    mocks.readClient.from.mockReturnValueOnce({ select: query.select });

    await expect(getAnnualReadingGoal(2026)).resolves.toEqual({
      id: "goal-id",
      year: 2026,
      targetCount: 12,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    });
    expect(mocks.readClient.from).toHaveBeenCalledWith("annual_reading_goals");
    expect(query.eq).toHaveBeenCalledWith("year", 2026);
  });

  it("returns null when no annual goal is visible", async () => {
    const query = createMaybeSingleQuery({ data: null, error: null });
    mocks.readClient.from.mockReturnValueOnce({ select: query.select });

    await expect(getAnnualReadingGoal(2026)).resolves.toBeNull();
  });

  it("maps goal read errors without leaking database details", async () => {
    const query = createMaybeSingleQuery({
      data: null,
      error: { code: "42501", message: "private database detail" },
    });
    mocks.readClient.from.mockReturnValueOnce({ select: query.select });

    await expectGoalError(getAnnualReadingGoal(2026), "permission");
  });

  it("rejects an unsafe year before creating a client", async () => {
    await expectGoalError(
      getAnnualReadingGoal(Number.MAX_SAFE_INTEGER + 1),
      "constraint",
    );
    expect(mocks.readClient.from).not.toHaveBeenCalled();
  });

  it("selects only finished_at from FINISHED sessions", async () => {
    const query = createFilteredListQuery({
      data: [{ finished_at: "2026-01-02" }, { finished_at: "2026-02-03" }],
      error: null,
    });
    mocks.readClient.from.mockReturnValueOnce({ select: query.select });

    await expect(listFinishedReadingDates()).resolves.toEqual([
      "2026-01-02",
      "2026-02-03",
    ]);
    expect(query.select).toHaveBeenCalledWith("finished_at");
    expect(query.eq).toHaveBeenCalledWith("status", "FINISHED");
  });

  it("rejects an impossible FINISHED session without finished_at", async () => {
    const query = createFilteredListQuery({
      data: [{ finished_at: null }],
      error: null,
    });
    mocks.readClient.from.mockReturnValueOnce({ select: query.select });

    await expectGoalError(listFinishedReadingDates(), "unexpected");
  });

  it("selects only occurred_on from PROGRESS entries", async () => {
    const query = createFilteredListQuery({
      data: [{ occurred_on: "2026-03-04" }],
      error: null,
    });
    mocks.readClient.from.mockReturnValueOnce({ select: query.select });

    await expect(listProgressReadingDates()).resolves.toEqual(["2026-03-04"]);
    expect(query.select).toHaveBeenCalledWith("occurred_on");
    expect(query.eq).toHaveBeenCalledWith("kind", "PROGRESS");
  });

  it("maps activity query errors safely", async () => {
    const query = createFilteredListQuery({
      data: null,
      error: { code: "PGRST000" },
    });
    mocks.readClient.from.mockReturnValueOnce({ select: query.select });

    await expectGoalError(listProgressReadingDates(), "unexpected");
  });

  it("composes four queries using the profile timezone and current local year", async () => {
    const profileQuery = createSingleQuery({
      data: { timezone: "America/Los_Angeles" },
      error: null,
    });
    const goalQuery = createMaybeSingleQuery({ data: goalRow, error: null });
    const finishedQuery = createFilteredListQuery({
      data: [
        { finished_at: "2026-12-30" },
        { finished_at: "2026-12-30" },
      ],
      error: null,
    });
    const progressQuery = createFilteredListQuery({
      data: [{ occurred_on: "2026-12-30" }],
      error: null,
    });

    mocks.readClient.from.mockImplementation((table: string) => {
      if (table === "profiles") return { select: profileQuery.select };
      if (table === "annual_reading_goals") return { select: goalQuery.select };
      if (table === "reading_sessions") return { select: finishedQuery.select };
      return { select: progressQuery.select };
    });

    const overview = await getReadingGoalsOverview(
      new Date("2027-01-01T00:30:00.000Z"),
    );

    expect(overview.currentDate).toBe("2026-12-31");
    expect(overview.year).toBe(2026);
    expect(overview.goalProgress?.currentCount).toBe(2);
    expect(overview.streak).toEqual({ current: 1, longest: 1 });
    expect(mocks.readClient.from).toHaveBeenCalledTimes(4);
  });

  it("maps an invalid stored timezone to unexpected", async () => {
    const profileQuery = createSingleQuery({
      data: { timezone: "Invalid/Timezone" },
      error: null,
    });
    mocks.readClient.from.mockReturnValueOnce({ select: profileQuery.select });

    await expectGoalError(
      getReadingGoalsOverview(new Date("2026-01-01T00:00:00.000Z")),
      "unexpected",
    );
    expect(mocks.readClient.from).toHaveBeenCalledTimes(1);
  });
});

describe("reading goal mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates with only year and target_count and without a pre-read", async () => {
    const single = vi.fn(async () => ({ data: goalRow, error: null }));
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    mocks.writableClient.from.mockReturnValueOnce({ insert });

    await expect(
      createAnnualReadingGoal({ year: 2026, targetCount: 12 }),
    ).resolves.toMatchObject({ id: "goal-id", targetCount: 12 });
    expect(insert).toHaveBeenCalledWith({ year: 2026, target_count: 12 });
    expect(mocks.writableClient.from).toHaveBeenCalledTimes(1);
  });

  it("maps duplicate create to conflict", async () => {
    const single = vi.fn(async () => ({
      data: null,
      error: { code: "23505" },
    }));
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    mocks.writableClient.from.mockReturnValueOnce({ insert });

    await expectGoalError(
      createAnnualReadingGoal({ year: 2026, targetCount: 12 }),
      "conflict",
    );
  });

  it("rejects invalid create input before mutation", async () => {
    await expectGoalError(
      createAnnualReadingGoal({ year: 2026.5, targetCount: 0 }),
      "constraint",
    );
    expect(mocks.writableClient.from).not.toHaveBeenCalled();
  });

  it("updates only target_count and relies on the database trigger", async () => {
    const query = createMutationMaybeSingleQuery({ data: goalRow, error: null });
    const update = vi.fn(() => ({ eq: query.eq }));
    mocks.writableClient.from.mockReturnValueOnce({ update });

    await expect(
      updateAnnualReadingGoal({ goalId: "goal-id", targetCount: 12 }),
    ).resolves.toMatchObject({ id: "goal-id" });
    expect(update).toHaveBeenCalledWith({ target_count: 12 });
    expect(mocks.writableClient.from).toHaveBeenCalledTimes(1);
  });

  it("maps zero updated rows to not_found without a pre-read", async () => {
    const query = createMutationMaybeSingleQuery({ data: null, error: null });
    const update = vi.fn(() => ({ eq: query.eq }));
    mocks.writableClient.from.mockReturnValueOnce({ update });

    await expectGoalError(
      updateAnnualReadingGoal({ goalId: "missing", targetCount: 8 }),
      "not_found",
    );
    expect(mocks.writableClient.from).toHaveBeenCalledTimes(1);
  });

  it("maps update database errors", async () => {
    const query = createMutationMaybeSingleQuery({
      data: null,
      error: { code: "23514" },
    });
    const update = vi.fn(() => ({ eq: query.eq }));
    mocks.writableClient.from.mockReturnValueOnce({ update });

    await expectGoalError(
      updateAnnualReadingGoal({ goalId: "goal-id", targetCount: 8 }),
      "constraint",
    );
  });

  it("deletes by id in one mutation", async () => {
    const query = createMutationMaybeSingleQuery({
      data: { id: "goal-id" },
      error: null,
    });
    const deleteOperation = vi.fn(() => ({ eq: query.eq }));
    mocks.writableClient.from.mockReturnValueOnce({ delete: deleteOperation });

    await expect(deleteAnnualReadingGoal("goal-id")).resolves.toBeUndefined();
    expect(query.eq).toHaveBeenCalledWith("id", "goal-id");
    expect(mocks.writableClient.from).toHaveBeenCalledTimes(1);
  });

  it("maps zero deleted rows to not_found", async () => {
    const query = createMutationMaybeSingleQuery({ data: null, error: null });
    const deleteOperation = vi.fn(() => ({ eq: query.eq }));
    mocks.writableClient.from.mockReturnValueOnce({ delete: deleteOperation });

    await expectGoalError(deleteAnnualReadingGoal("missing"), "not_found");
  });
});
