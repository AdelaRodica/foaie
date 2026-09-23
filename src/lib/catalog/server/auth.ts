import "server-only";

import { CatalogError } from "../errors";
import { createReadOnlyClient, createWritableClient } from "../../supabase/server";

export async function createAuthenticatedCatalogClient() {
  const supabase = await createReadOnlyClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims?.sub !== "string") {
    throw new CatalogError("unauthenticated", {
      operation: "authenticateCatalogRead",
      cause: error,
    });
  }

  return supabase;
}

export async function createAuthenticatedWritableCatalogClient() {
  const supabase = await createWritableClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims?.sub !== "string") {
    throw new CatalogError("unauthenticated", {
      operation: "authenticateCatalogWrite",
      cause: error,
    });
  }

  return supabase;
}
