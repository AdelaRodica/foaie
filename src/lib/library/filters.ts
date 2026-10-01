import type { LibraryItem } from "./types";

export type LibraryReadingFilter =
  | "ALL"
  | "PENDING"
  | "READING"
  | "FINISHED"
  | "ABANDONED";

const filterBySearchParam: Readonly<Record<string, LibraryReadingFilter>> = {
  pending: "PENDING",
  reading: "READING",
  finished: "FINISHED",
  abandoned: "ABANDONED",
};

export function parseLibraryReadingFilter(
  value: string | string[] | undefined,
): LibraryReadingFilter {
  if (typeof value !== "string") return "ALL";
  return filterBySearchParam[value] ?? "ALL";
}

export function filterLibraryItemsByReadingState(
  items: readonly LibraryItem[],
  filter: LibraryReadingFilter,
): readonly LibraryItem[] {
  if (filter === "ALL") return items;
  return items.filter(({ readingHistory }) => {
    switch (filter) {
      case "PENDING":
        return readingHistory.sessionCount === 0;
      case "READING":
        return readingHistory.readingCount > 0;
      case "FINISHED":
        return readingHistory.finishedCount > 0;
      case "ABANDONED":
        return readingHistory.abandonedCount > 0;
    }

    return filter satisfies never;
  });
}
