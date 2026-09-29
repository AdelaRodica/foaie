import { describe, expect, it } from "vitest";

import { ReadingError } from "./errors";
import {
  resolveAbandonReadingFallback,
  resolveFinishReadingFallback,
} from "./lifecycle";
import type { ReadingSession, ReadingStatus } from "./types";

function createSession(status: ReadingStatus): ReadingSession {
  return {
    id: "session-id",
    userEditionId: "membership-id",
    status,
    startedAt: "2026-09-20",
    finishedAt: status === "FINISHED" ? "2026-09-21" : null,
    abandonedAt: status === "ABANDONED" ? "2026-09-21" : null,
    currentValue: 42,
    progressUnit: "PAGES",
    createdAt: "2026-09-20T10:00:00.000Z",
  };
}

function expectReadingError(operation: () => unknown, kind: ReadingError["kind"]) {
  expect(operation).toThrowError(ReadingError);
  try {
    operation();
  } catch (error) {
    expect(error).toMatchObject({ kind });
  }
}

describe("resolveFinishReadingFallback", () => {
  it("maps a hidden or missing session to not_found", () => {
    expectReadingError(() => resolveFinishReadingFallback(null), "not_found");
  });

  it("returns an idempotent result for FINISHED", () => {
    const session = createSession("FINISHED");
    expect(resolveFinishReadingFallback(session)).toEqual({
      outcome: "already_finished",
      session,
    });
  });

  it("rejects ABANDONED as an invalid transition", () => {
    expectReadingError(
      () => resolveFinishReadingFallback(createSession("ABANDONED")),
      "invalid_transition",
    );
  });

  it("treats a remaining READING session as unexpected", () => {
    expectReadingError(
      () => resolveFinishReadingFallback(createSession("READING")),
      "unexpected",
    );
  });
});

describe("resolveAbandonReadingFallback", () => {
  it("maps a hidden or missing session to not_found", () => {
    expectReadingError(() => resolveAbandonReadingFallback(null), "not_found");
  });

  it("returns an idempotent result for ABANDONED", () => {
    const session = createSession("ABANDONED");
    expect(resolveAbandonReadingFallback(session)).toEqual({
      outcome: "already_abandoned",
      session,
    });
  });

  it("rejects FINISHED as an invalid transition", () => {
    expectReadingError(
      () => resolveAbandonReadingFallback(createSession("FINISHED")),
      "invalid_transition",
    );
  });

  it("treats a remaining READING session as unexpected", () => {
    expectReadingError(
      () => resolveAbandonReadingFallback(createSession("READING")),
      "unexpected",
    );
  });
});
