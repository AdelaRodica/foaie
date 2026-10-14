import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  client: {
    auth: { getClaims: vi.fn() },
    from: vi.fn(),
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("../../supabase/server", () => ({
  createReadOnlyClient: vi.fn(async () => mocks.client),
}));

import { HomeError } from "./errors";
import { getHomeOverview } from "./queries";

function profileQuery(data: unknown, error: unknown = null) {
  const single = vi.fn(async () => ({ data, error }));
  return { select: vi.fn(() => ({ single })), single };
}

function goalQuery(data: unknown, error: unknown = null) {
  const maybeSingle = vi.fn(async () => ({ data, error }));
  const eq = vi.fn(() => ({ maybeSingle }));
  return { select: vi.fn(() => ({ eq })), eq, maybeSingle };
}

function progressQuery(data: unknown, error: unknown = null) {
  const eq = vi.fn(async () => ({ data, error }));
  return { select: vi.fn(() => ({ eq })), eq };
}

const libraryRow = {
  id: "membership-1",
  edition: {
    format: "PHYSICAL",
    cover_url: null,
    page_count: 200,
    audio_duration_minutes: null,
    work: {
      id: "work-1",
      title: "El libro",
      work_authors: [{
        position: 0,
        author: { id: "author-1", name: "La autora" },
      }],
    },
  },
  reading_sessions: [{
    id: "session-1",
    status: "FINISHED",
    started_at: "2026-12-20",
    finished_at: "2026-12-31",
    current_value: 180,
    progress_unit: "PAGES",
    created_at: "2026-12-20T10:00:00.000Z",
  }],
};

describe("getHomeOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.client.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
  });

  it("uses four table queries and the profile timezone without client-owned user ids", async () => {
    const profile = profileQuery({
      display_name: "Ana",
      timezone: "America/Los_Angeles",
      reading_days_per_week: 2,
    });
    const library = {
      select: vi.fn(async () => ({ data: [libraryRow], error: null })),
    };
    const goal = goalQuery({
      id: "goal-1",
      year: 2026,
      target_count: 10,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    const progress = progressQuery([{ occurred_on: "2026-12-30" }]);

    mocks.client.from.mockImplementation((table: string) => {
      if (table === "profiles") return profile;
      if (table === "user_editions") return library;
      if (table === "annual_reading_goals") return goal;
      return progress;
    });

    const overview = await getHomeOverview(
      new Date("2027-01-01T00:30:00.000Z"),
    );

    expect(overview.currentDate).toBe("2026-12-31");
    expect(overview.year).toBe(2026);
    expect(overview.displayName).toBe("Ana");
    expect(overview.recentFinished[0]?.book.title).toBe("El libro");
    expect(overview.readingGoals.goalProgress?.currentCount).toBe(1);
    expect(mocks.client.from).toHaveBeenCalledTimes(4);
    expect(mocks.client.from).toHaveBeenNthCalledWith(1, "profiles");
    expect(mocks.client.from).toHaveBeenNthCalledWith(2, "user_editions");
    expect(mocks.client.from).toHaveBeenNthCalledWith(3, "annual_reading_goals");
    expect(mocks.client.from).toHaveBeenNthCalledWith(4, "progress_entries");
    expect(goal.eq).toHaveBeenCalledWith("year", 2026);
    expect(progress.eq).toHaveBeenCalledWith("kind", "PROGRESS");
  });

  it("returns honest empty data when the user has no library or goal", async () => {
    const profile = profileQuery({
      display_name: null,
      timezone: "UTC",
      reading_days_per_week: 1,
    });
    const library = {
      select: vi.fn(async () => ({ data: [], error: null })),
    };
    const goal = goalQuery(null);
    const progress = progressQuery([]);

    mocks.client.from.mockImplementation((table: string) => {
      if (table === "profiles") return profile;
      if (table === "user_editions") return library;
      if (table === "annual_reading_goals") return goal;
      return progress;
    });

    const overview = await getHomeOverview(new Date("2026-10-14T12:00:00Z"));
    expect(overview.hasLibrary).toBe(false);
    expect(overview.activeReadings).toEqual([]);
    expect(overview.readingGoals.goal).toBeNull();
  });

  it("stops before every data query when authentication is missing", async () => {
    mocks.client.auth.getClaims.mockResolvedValue({
      data: null,
      error: { message: "private auth detail" },
    });

    await expect(getHomeOverview()).rejects.toMatchObject({
      name: "HomeError",
      kind: "unauthenticated",
      operation: "authenticateHomeRead",
    } satisfies Partial<HomeError>);
    expect(mocks.client.from).not.toHaveBeenCalled();
  });

  it("maps permission errors without exposing database messages", async () => {
    const profile = profileQuery(null, {
      code: "42501",
      message: "private database detail",
    });
    mocks.client.from.mockReturnValue(profile);

    await expect(getHomeOverview()).rejects.toMatchObject({
      name: "HomeError",
      kind: "permission",
      message: "No tienes permiso para consultar este Inicio.",
    });
  });
});
