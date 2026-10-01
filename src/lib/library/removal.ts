import { LibraryError } from "./errors";

type VisibleLibraryMembership = Readonly<{ id: string }>;

export function resolveLibraryRemovalFallback(
  membership: VisibleLibraryMembership | null,
): never {
  throw new LibraryError(membership ? "protected_history" : "not_found", {
    operation: "removeEditionFromLibrary",
  });
}
