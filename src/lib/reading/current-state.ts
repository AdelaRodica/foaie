import { ReadingError } from "./errors";
import type { CurrentReadingState, ReadingSession } from "./types";

type ActiveReadingSession = ReadingSession & { status: "READING" };
type ClosedReadingSession =
  | (ReadingSession & { status: "FINISHED" })
  | (ReadingSession & { status: "ABANDONED" });

function isActiveSession(session: ReadingSession): session is ActiveReadingSession {
  return session.status === "READING";
}

function isClosedSession(session: ReadingSession): session is ClosedReadingSession {
  return session.status === "FINISHED" || session.status === "ABANDONED";
}

function compareDescending(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  return left > right ? -1 : 1;
}

function compareClosedSessions(
  left: ClosedReadingSession,
  right: ClosedReadingSession,
) {
  if (left.startedAt !== right.startedAt) {
    if (left.startedAt === null) {
      return 1;
    }

    if (right.startedAt === null) {
      return -1;
    }

    return compareDescending(left.startedAt, right.startedAt);
  }

  const createdAtOrder = compareDescending(left.createdAt, right.createdAt);
  return createdAtOrder || compareDescending(left.id, right.id);
}

export function deriveCurrentReadingState(
  sessions: readonly ReadingSession[],
): CurrentReadingState {
  if (sessions.length === 0) {
    return { kind: "PENDING", session: null };
  }

  const activeSessions = sessions.filter(isActiveSession);

  if (activeSessions.length > 1) {
    throw new ReadingError("unexpected");
  }

  if (activeSessions.length === 1) {
    return { kind: "READING", session: activeSessions[0] };
  }

  const [currentSession] = sessions
    .filter(isClosedSession)
    .sort(compareClosedSessions);

  if (!currentSession) {
    throw new ReadingError("unexpected");
  }

  if (currentSession.status === "FINISHED") {
    return { kind: "FINISHED", session: currentSession };
  }

  return { kind: "ABANDONED", session: currentSession };
}
