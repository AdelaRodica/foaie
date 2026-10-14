import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  client: { auth: { getClaims: vi.fn() }, from: vi.fn() },
}));

vi.mock("server-only", () => ({}));
vi.mock("../../supabase/server", () => ({
  createReadOnlyClient: vi.fn(async () => mocks.client),
}));

import { getAlbumYear, getInitialAlbumYear } from "./queries";

function profileQuery() {
  return {
    select: vi.fn(() => ({
      single: vi.fn(async () => ({
        data: { timezone: "America/Los_Angeles", reading_days_per_week: 2 },
        error: null,
      })),
    })),
  };
}

function progressQuery() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(async () => ({ data: [{ occurred_on: "2026-12-30" }], error: null })),
    })),
  };
}

function goalQuery() {
  const maybeSingle = vi.fn(async () => ({ data: null, error: null }));
  const eq = vi.fn(() => ({ maybeSingle }));
  return { select: vi.fn(() => ({ eq })), eq };
}

const libraryRow = {
  id: "membership-1",
  edition: {
    format: "PHYSICAL",
    cover_url: null,
    page_count: 120,
    audio_duration_minutes: null,
    work: {
      id: "work-1",
      title: "Libro",
      work_authors: [],
    },
  },
  reading_sessions: [{
    id: "session-1",
    status: "FINISHED",
    started_at: null,
    finished_at: "2026-12-31",
    current_value: 100,
    progress_unit: "PERCENT",
    created_at: "2026-12-31T10:00:00Z",
  }],
};

describe("album server queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.client.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
  });

  it("loads an album page with four table queries and profile civil time", async () => {
    const goal = goalQuery();
    mocks.client.from.mockImplementation((table: string) => {
      if (table === "profiles") return profileQuery();
      if (table === "user_editions") {
        return { select: vi.fn(async () => ({ data: [libraryRow], error: null })) };
      }
      if (table === "progress_entries") return progressQuery();
      return goal;
    });

    const album = await getAlbumYear(undefined, new Date("2027-01-01T00:30:00Z"));

    expect(album.currentYear).toBe(2026);
    expect(album.currentMonth).toBe(12);
    expect(album.year).toBe(2026);
    expect(album.months[11].readings).toHaveLength(1);
    expect(mocks.client.from).toHaveBeenCalledTimes(4);
    expect(goal.eq).toHaveBeenCalledWith("year", 2026);
  });

  it("resolves the initial year with two table queries", async () => {
    mocks.client.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: { timezone: "UTC" },
              error: null,
            })),
          })),
        };
      }
      return { select: vi.fn(async () => ({ data: [libraryRow], error: null })) };
    });

    await expect(getInitialAlbumYear(new Date("2027-06-01T12:00:00Z")))
      .resolves.toBe(2026);
    expect(mocks.client.from).toHaveBeenCalledTimes(2);
  });

  it("honors an explicit empty year while retaining available year navigation", async () => {
    mocks.client.from.mockImplementation((table: string) => {
      if (table === "profiles") return profileQuery();
      if (table === "user_editions") {
        return { select: vi.fn(async () => ({ data: [libraryRow], error: null })) };
      }
      if (table === "progress_entries") return progressQuery();
      return goalQuery();
    });

    const album = await getAlbumYear(2025, new Date("2026-06-01T12:00:00Z"));
    expect(album.year).toBe(2025);
    expect(album.summary.finishedCount).toBe(0);
    expect(album.availableYears).toEqual([2026]);
  });

  it("does not query personal tables without authenticated claims", async () => {
    mocks.client.auth.getClaims.mockResolvedValue({ data: null, error: { message: "private" } });
    await expect(getAlbumYear()).rejects.toMatchObject({
      name: "HomeError",
      kind: "unauthenticated",
      operation: "authenticateAlbumRead",
    });
    expect(mocks.client.from).not.toHaveBeenCalled();
  });
});
