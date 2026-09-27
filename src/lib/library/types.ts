export type LibraryErrorKind =
  | "unauthenticated"
  | "not_found"
  | "conflict"
  | "permission"
  | "constraint"
  | "unexpected";

export type LibraryMembership = Readonly<{
  id: string;
  editionId: string;
  addedAt: string;
}>;
