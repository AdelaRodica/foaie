import type { EditionUpdateInput } from "./types";

const hasOwn = <Key extends keyof EditionUpdateInput>(
  input: EditionUpdateInput,
  key: Key,
) => Object.prototype.hasOwnProperty.call(input, key);

export function buildEditionUpdatePayload(input: EditionUpdateInput) {
  return {
    publisher_id: input.publisherId,
    edition_title: input.editionTitle,
    subtitle: input.subtitle,
    isbn10: input.isbn10,
    isbn13: input.isbn13,
    publication_date: input.publicationDate,
    publication_date_precision: input.publicationDatePrecision,
    language_code: input.languageCode,
    format: input.format,
    page_count: input.pageCount,
    audio_duration_minutes: input.audioDurationMinutes,
    ...(hasOwn(input, "coverUrl")
      ? {
          cover_url: input.coverUrl,
          ...(input.coverUrl === null ? {} : { cover_storage_key: null }),
        }
      : {}),
    ...(hasOwn(input, "coverStorageKey")
      ? {
          cover_storage_key: input.coverStorageKey,
          ...(input.coverStorageKey === null ? {} : { cover_url: null }),
        }
      : {}),
  };
}
