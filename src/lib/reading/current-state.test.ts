import { describe, expect, it } from "vitest";

import {
  deriveCurrentReadingState,
  deriveCurrentReadingStatesByUserEdition,
} from "./current-state";
import { ReadingError } from "./errors";
import type { ReadingSession, ReadingStatus } from "./types";

function createSession(
  status: ReadingStatus,
  overrides: Partial<ReadingSession> = {},
): ReadingSession {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    userEditionId: "membership-id",
    status,
    startedAt: "2026-01-01",
    finishedAt: status === "FINISHED" ? "2026-01-20" : null,
    abandonedAt: status === "ABANDONED" ? "2026-01-20" : null,
    currentValue: 42,
    progressUnit: "PAGES",
    createdAt: "2026-01-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("deriveCurrentReadingState", () => {
  it("derives PENDING from an empty history", () => {
    expect(deriveCurrentReadingState([])).toEqual({
      kind: "PENDING",
      session: null,
    });
  });

  it.each(["READING", "FINISHED", "ABANDONED"] as const)(
    "derives %s from one session",
    (status) => {
      const session = createSession(status);

      expect(deriveCurrentReadingState([session])).toEqual({
        kind: status,
        session,
      });
    },
  );

  it("prefers the active session over later closed-session fields", () => {
    const active = createSession("READING", {
      id: "00000000-0000-0000-0000-000000000001",
      startedAt: "2026-01-01",
      createdAt: "2026-01-01T10:00:00.000Z",
    });
    const finished = createSession("FINISHED", {
      id: "00000000-0000-0000-0000-000000000002",
      startedAt: "2026-12-01",
      createdAt: "2026-12-01T10:00:00.000Z",
    });

    expect(deriveCurrentReadingState([finished, active])).toEqual({
      kind: "READING",
      session: active,
    });
  });

  it("selects a newer ABANDONED session over an older FINISHED session", () => {
    const finished = createSession("FINISHED", { startedAt: "2026-01-01" });
    const abandoned = createSession("ABANDONED", {
      id: "00000000-0000-0000-0000-000000000002",
      startedAt: "2026-01-10",
    });

    expect(deriveCurrentReadingState([finished, abandoned])).toEqual({
      kind: "ABANDONED",
      session: abandoned,
    });
  });

  it("selects a newer FINISHED session over an older ABANDONED session", () => {
    const abandoned = createSession("ABANDONED", { startedAt: "2026-01-01" });
    const finished = createSession("FINISHED", {
      id: "00000000-0000-0000-0000-000000000002",
      startedAt: "2026-01-10",
    });

    expect(deriveCurrentReadingState([finished, abandoned])).toEqual({
      kind: "FINISHED",
      session: finished,
    });
  });

  it("orders startedAt descending regardless of input order", () => {
    const older = createSession("FINISHED", { startedAt: "2026-01-01" });
    const newer = createSession("ABANDONED", {
      id: "00000000-0000-0000-0000-000000000002",
      startedAt: "2026-01-10",
    });

    expect(deriveCurrentReadingState([older, newer]).session).toBe(newer);
    expect(deriveCurrentReadingState([newer, older]).session).toBe(newer);
  });

  it("places null startedAt after a dated session", () => {
    const dated = createSession("FINISHED", { startedAt: "2026-01-01" });
    const undated = createSession("ABANDONED", {
      id: "00000000-0000-0000-0000-000000000002",
      startedAt: null,
      createdAt: "2026-12-01T10:00:00.000Z",
    });

    expect(deriveCurrentReadingState([undated, dated]).session).toBe(dated);
  });

  it("uses createdAt descending when startedAt ties", () => {
    const older = createSession("FINISHED", {
      createdAt: "2026-01-01T10:00:00.000Z",
    });
    const newer = createSession("ABANDONED", {
      id: "00000000-0000-0000-0000-000000000002",
      createdAt: "2026-01-02T10:00:00.000Z",
    });

    expect(deriveCurrentReadingState([newer, older]).session).toBe(newer);
  });

  it("uses id descending when startedAt and createdAt tie", () => {
    const lowerId = createSession("FINISHED");
    const higherId = createSession("ABANDONED", {
      id: "00000000-0000-0000-0000-000000000002",
    });

    expect(deriveCurrentReadingState([higherId, lowerId]).session).toBe(higherId);
  });

  it("derives the same result from arbitrarily ordered sessions", () => {
    const sessions = [
      createSession("FINISHED", {
        id: "00000000-0000-0000-0000-000000000001",
        startedAt: null,
        createdAt: "2026-12-01T10:00:00.000Z",
      }),
      createSession("ABANDONED", {
        id: "00000000-0000-0000-0000-000000000002",
        startedAt: "2026-01-10",
      }),
      createSession("FINISHED", {
        id: "00000000-0000-0000-0000-000000000003",
        startedAt: "2026-01-05",
      }),
    ];

    expect(deriveCurrentReadingState(sessions).session).toBe(sessions[1]);
    expect(deriveCurrentReadingState([...sessions].reverse()).session).toBe(sessions[1]);
  });

  it("rejects multiple active sessions as unexpected", () => {
    const operation = () => deriveCurrentReadingState([
      createSession("READING"),
      createSession("READING", {
        id: "00000000-0000-0000-0000-000000000002",
      }),
    ]);

    expect(operation).toThrowError(ReadingError);
    try {
      operation();
    } catch (error) {
      expect(error).toMatchObject({ kind: "unexpected" });
    }
  });

  it("does not mutate the input order", () => {
    const sessions = [
      createSession("FINISHED", {
        id: "00000000-0000-0000-0000-000000000001",
        startedAt: "2026-01-01",
      }),
      createSession("ABANDONED", {
        id: "00000000-0000-0000-0000-000000000002",
        startedAt: "2026-01-10",
      }),
    ];
    const originalOrder = sessions.map(({ id }) => id);

    deriveCurrentReadingState(sessions);

    expect(sessions.map(({ id }) => id)).toEqual(originalOrder);
  });
});

describe("deriveCurrentReadingStatesByUserEdition", () => {
  it("derives PENDING for every requested membership without sessions", () => {
    expect(
      [...deriveCurrentReadingStatesByUserEdition(["membership-a", "membership-b"], [])],
    ).toEqual([
      ["membership-a", { kind: "PENDING", session: null }],
      ["membership-b", { kind: "PENDING", session: null }],
    ]);
  });

  it("derives independent states for pending, active, and finished memberships", () => {
    const active = createSession("READING", { userEditionId: "membership-b" });
    const finished = createSession("FINISHED", { userEditionId: "membership-c" });
    const states = deriveCurrentReadingStatesByUserEdition(
      ["membership-a", "membership-b", "membership-c"],
      [finished, active],
    );

    expect(states.get("membership-a")).toEqual({ kind: "PENDING", session: null });
    expect(states.get("membership-b")).toEqual({ kind: "READING", session: active });
    expect(states.get("membership-c")).toEqual({ kind: "FINISHED", session: finished });
  });

  it("does not mix interleaved sessions from different memberships", () => {
    const activeA = createSession("READING", { userEditionId: "membership-a" });
    const finishedB = createSession("FINISHED", {
      id: "00000000-0000-0000-0000-000000000002",
      userEditionId: "membership-b",
    });
    const oldFinishedA = createSession("FINISHED", {
      id: "00000000-0000-0000-0000-000000000003",
      userEditionId: "membership-a",
      startedAt: "2025-01-01",
    });
    const states = deriveCurrentReadingStatesByUserEdition(
      ["membership-a", "membership-b"],
      [finishedB, oldFinishedA, activeA],
    );

    expect(states.get("membership-a")).toEqual({ kind: "READING", session: activeA });
    expect(states.get("membership-b")).toEqual({ kind: "FINISHED", session: finishedB });
  });

  it("reuses latest-closed derivation for a membership history", () => {
    const older = createSession("FINISHED", {
      userEditionId: "membership-a",
      startedAt: "2026-01-01",
    });
    const newer = createSession("ABANDONED", {
      id: "00000000-0000-0000-0000-000000000002",
      userEditionId: "membership-a",
      startedAt: "2026-01-10",
    });

    const expected = { kind: "ABANDONED", session: newer };

    expect(
      deriveCurrentReadingStatesByUserEdition(
        ["membership-a"],
        [newer, older],
      ).get("membership-a"),
    ).toEqual(expected);
    expect(
      deriveCurrentReadingStatesByUserEdition(
        ["membership-a"],
        [older, newer],
      ).get("membership-a"),
    ).toEqual(expected);
  });

  it("ignores sessions for memberships that were not requested", () => {
    const foreignSession = createSession("READING", {
      userEditionId: "membership-not-requested",
    });
    const states = deriveCurrentReadingStatesByUserEdition(
      ["membership-a"],
      [foreignSession],
    );

    expect(states).toEqual(
      new Map([["membership-a", { kind: "PENDING", session: null }]]),
    );
    expect(states.has("membership-not-requested")).toBe(false);
  });

  it("does not mutate either input", () => {
    const userEditionIds = ["membership-b", "membership-a"];
    const sessions = [
      createSession("FINISHED", { userEditionId: "membership-a" }),
      createSession("READING", {
        id: "00000000-0000-0000-0000-000000000002",
        userEditionId: "membership-b",
      }),
    ];
    const originalIds = [...userEditionIds];
    const originalSessions = [...sessions];

    const states = deriveCurrentReadingStatesByUserEdition(userEditionIds, sessions);

    expect(states.get("membership-a")?.kind).toBe("FINISHED");
    expect(states.get("membership-b")?.kind).toBe("READING");
    expect(userEditionIds).toEqual(originalIds);
    expect(sessions).toEqual(originalSessions);
  });
});
