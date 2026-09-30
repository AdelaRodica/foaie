import { LibraryError } from "./errors";
import type { CurrentReadingState } from "../reading/types";
import type { LibraryItem } from "./types";

type LibraryAuthorRelationRow = Readonly<{
  position: number;
  author: Readonly<{
    id: string;
    name: string;
  }>;
}>;

type LibraryWorkRow = Readonly<{
  id: string;
  title: string;
  work_authors: readonly LibraryAuthorRelationRow[];
}>;

type LibraryEditionRow = Readonly<{
  id: string;
  format: string;
  cover_url: string | null;
  work: LibraryWorkRow | null;
}>;

export type LibraryItemRow = Readonly<{
  id: string;
  created_at: string;
  edition: LibraryEditionRow | null;
}>;

export function mapLibraryItem(
  row: LibraryItemRow,
  currentReadingState: CurrentReadingState,
): LibraryItem {
  const edition = row.edition;
  if (!edition) {
    throw new LibraryError("unexpected", { operation: "mapLibraryItem" });
  }

  const work = edition.work;
  if (!work) {
    throw new LibraryError("unexpected", { operation: "mapLibraryItem" });
  }

  const authors = [...work.work_authors]
    .sort(
      (left, right) =>
        left.position - right.position || left.author.id.localeCompare(right.author.id),
    )
    .map(({ author }) => author.name);

  return {
    id: row.id,
    addedAt: row.created_at,
    currentReadingState,
    edition: {
      id: edition.id,
      format: edition.format,
      coverSrc: edition.cover_url,
      work: {
        id: work.id,
        title: work.title,
        authors,
      },
    },
  };
}
