import type { WorkEditionDetails } from "./types";

export type EditionFormInitialValues = Readonly<{
  publisher: WorkEditionDetails["publisher"];
  editionTitle: string;
  subtitle: string;
  isbn: string;
  publicationDateInput: string;
  publicationDatePrecision: string;
  languageCode: string;
  format: string;
  pageCount: number | "";
  audioDurationMinutes: number | "";
  coverUrl: string;
}>;

function formatPublicationDateInput(edition: WorkEditionDetails) {
  if (!edition.publicationDate) return "";
  if (edition.publicationDatePrecision === "YEAR") return edition.publicationDate.slice(0, 4);
  if (edition.publicationDatePrecision === "MONTH") return edition.publicationDate.slice(0, 7);
  return edition.publicationDate;
}

export function getEditionFormInitialValues(edition: WorkEditionDetails): EditionFormInitialValues {
  return {
    publisher: edition.publisher,
    editionTitle: edition.editionTitle ?? "",
    subtitle: edition.subtitle ?? "",
    isbn: edition.isbn10 ?? edition.isbn13 ?? "",
    publicationDateInput: formatPublicationDateInput(edition),
    publicationDatePrecision: edition.publicationDatePrecision ?? "",
    languageCode: edition.languageCode ?? "",
    format: edition.format,
    pageCount: edition.pageCount ?? "",
    audioDurationMinutes: edition.audioDurationMinutes ?? "",
    coverUrl: edition.coverUrl ?? "",
  };
}
