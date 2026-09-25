import type {
  AuthorSummary,
  EditionSearchResult,
  PublisherSummary,
  SeriesSummary,
  WorkCapabilities,
  WorkDetails,
  WorkSummary,
} from "./types";

export type WorkSummaryRow = Readonly<{
  id: string;
  title: string;
  original_title: string | null;
  original_publication_year: number | null;
  original_language_code: string | null;
}>;

export type AuthorSummaryRow = Readonly<{
  id: string;
  name: string;
  sort_name: string | null;
}>;

export type PublisherSummaryRow = Readonly<{ id: string; name: string }>;
export type SeriesSummaryRow = Readonly<{
  id: string;
  name: string;
  description: string | null;
}>;

export type EditionSearchRow = Readonly<{
  id: string;
  work_id: string;
  format: string;
  isbn10: string | null;
  isbn13: string | null;
  cover_url: string | null;
  work: Readonly<{ id: string; title: string }>;
  publisher: PublisherSummaryRow | null;
}>;

export type WorkDetailsRow = WorkSummaryRow & Readonly<{
  description: string | null;
  work_authors: ReadonlyArray<Readonly<{
    position: number;
    author: AuthorSummaryRow;
  }>>;
  work_genres: ReadonlyArray<Readonly<{
    is_primary: boolean;
    genre: Readonly<{ id: string; name: string; slug: string }>;
  }>>;
  work_series: ReadonlyArray<Readonly<{
    position: number | null;
    position_label: string | null;
    series: Readonly<{ id: string; name: string }>;
  }>>;
  editions: ReadonlyArray<Readonly<{
    id: string;
    edition_title: string | null;
    subtitle: string | null;
    isbn10: string | null;
    isbn13: string | null;
    publication_date: string | null;
    publication_date_precision: string | null;
    language_code: string | null;
    format: string;
    page_count: number | null;
    audio_duration_minutes: number | null;
    cover_url: string | null;
    cover_storage_key: string | null;
    publisher: PublisherSummaryRow | null;
  }>>;
}>;

type WorkCapabilitiesInput = Readonly<{
  currentUserId: string;
  workCreatorId: string | null;
  editions: ReadonlyArray<Readonly<{
    id: string;
    creatorId: string | null;
  }>>;
}>;

const compareText = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

const compareNullableText = (left: string | null, right: string | null) => {
  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return compareText(left, right);
};

export function mapWorkSummary(row: WorkSummaryRow): WorkSummary {
  return {
    id: row.id,
    title: row.title,
    originalTitle: row.original_title,
    originalPublicationYear: row.original_publication_year,
    originalLanguageCode: row.original_language_code,
  };
}

export function mapAuthorSummary(row: AuthorSummaryRow): AuthorSummary {
  return { id: row.id, name: row.name, sortName: row.sort_name };
}

export function mapPublisherSummary(row: PublisherSummaryRow): PublisherSummary {
  return { id: row.id, name: row.name };
}

export function mapSeriesSummary(row: SeriesSummaryRow): SeriesSummary {
  return { id: row.id, name: row.name, description: row.description };
}

export function mapEditionSearchResult(row: EditionSearchRow): EditionSearchResult {
  return {
    id: row.id,
    workId: row.work_id,
    workTitle: row.work.title,
    format: row.format,
    isbn10: row.isbn10,
    isbn13: row.isbn13,
    coverUrl: row.cover_url,
    publisher: row.publisher ? mapPublisherSummary(row.publisher) : null,
  };
}

export function normalizeIsbnSearch(value: string) {
  const normalized = value.replace(/[\s-]+/gu, "").toUpperCase();
  if (/^\d{9}[\dX]$/.test(normalized)) return { field: "isbn10" as const, value: normalized };
  if (/^\d{13}$/.test(normalized)) return { field: "isbn13" as const, value: normalized };
  return null;
}

export function mapWorkCapabilities({
  currentUserId,
  workCreatorId,
  editions,
}: WorkCapabilitiesInput): WorkCapabilities {
  const canEditWork = workCreatorId === currentUserId;

  return {
    canEditWork,
    canDeleteWork: canEditWork && editions.length === 0,
    editions: Object.fromEntries(
      editions.map(({ id, creatorId }) => {
        const isCreator = creatorId === currentUserId;
        return [id, {
          canEditEdition: isCreator,
          canDeleteEdition: isCreator,
        }];
      }),
    ),
  };
}

export function mapWorkDetails(row: WorkDetailsRow): WorkDetails {
  const authors = row.work_authors
    .map(({ author, position }) => ({ ...mapAuthorSummary(author), position }))
    .sort((left, right) => left.position - right.position || compareText(left.id, right.id));

  const genres = row.work_genres
    .map(({ genre, is_primary }) => ({ ...genre, isPrimary: is_primary }))
    .sort((left, right) =>
      Number(right.isPrimary) - Number(left.isPrimary) ||
      compareText(left.name, right.name) ||
      compareText(left.id, right.id),
    );

  const series = row.work_series
    .map((relation) => ({
      ...relation.series,
      position: relation.position,
      positionLabel: relation.position_label,
    }))
    .sort((left, right) => {
      if (left.position !== right.position) {
        if (left.position === null) return 1;
        if (right.position === null) return -1;
        return left.position - right.position;
      }
      return (
        compareNullableText(left.positionLabel, right.positionLabel) ||
        compareText(left.name, right.name) ||
        compareText(left.id, right.id)
      );
    });

  const editions = row.editions
    .map((edition) => ({
      id: edition.id,
      editionTitle: edition.edition_title,
      subtitle: edition.subtitle,
      isbn10: edition.isbn10,
      isbn13: edition.isbn13,
      publicationDate: edition.publication_date,
      publicationDatePrecision: edition.publication_date_precision,
      languageCode: edition.language_code,
      format: edition.format,
      pageCount: edition.page_count,
      audioDurationMinutes: edition.audio_duration_minutes,
      coverUrl: edition.cover_url,
      coverStorageKey: edition.cover_storage_key,
      publisher: edition.publisher ? mapPublisherSummary(edition.publisher) : null,
    }))
    .sort((left, right) =>
      compareNullableText(left.publicationDate, right.publicationDate) ||
      compareText(left.id, right.id),
    );

  return {
    work: { ...mapWorkSummary(row), description: row.description },
    authors,
    genres,
    series,
    editions,
  };
}
