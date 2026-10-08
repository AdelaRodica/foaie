import "server-only";

import {
  createReadOnlyClient,
  createWritableClient,
} from "../../supabase/server";
import { ReadingGoalError } from "./errors";

export async function createAuthenticatedReadingGoalReadClient() {
  const supabase = await createReadOnlyClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims?.sub !== "string") {
    throw new ReadingGoalError("unauthenticated", {
      operation: "authenticateReadingGoalRead",
      cause: error,
    });
  }

  return supabase;
}

export async function createAuthenticatedReadingGoalWritableClient() {
  const supabase = await createWritableClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims?.sub !== "string") {
    throw new ReadingGoalError("unauthenticated", {
      operation: "authenticateReadingGoalWrite",
      cause: error,
    });
  }

  return supabase;
}
