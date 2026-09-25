import { z } from "zod";

import { catalogWorkFieldsSchema } from "./catalog-entry-validation";

export type CatalogWorkFieldErrors = Readonly<Record<string, string[]>>;

export const catalogWorkUpdateInputSchema = catalogWorkFieldsSchema.extend({
  workId: z.string().uuid(),
}).strict();

export function catalogWorkFieldErrors(
  error: z.ZodError,
): CatalogWorkFieldErrors {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const [section, field] = issue.path;
    let key = "form";

    if (section === "work" && typeof field === "string") {
      key = `work.${field}`;
    } else if (
      section === "authorRelations"
      || section === "genreRelations"
      || section === "seriesRelations"
      || section === "workId"
    ) {
      key = section;
    }

    (errors[key] ??= []).push(issue.message);
  }

  return errors;
}
