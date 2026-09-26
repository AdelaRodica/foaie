"use server";

import { revalidatePath } from "next/cache";

import {
  type CatalogEditionFieldErrors,
  validateCatalogEditionUpdate,
} from "@/lib/catalog/catalog-edition-validation";
import { CatalogEntryValidationError } from "@/lib/catalog/catalog-entry-validation";
import { CatalogError } from "@/lib/catalog/errors";
import { updateEdition } from "@/lib/catalog/server/mutations";
import { getEditionWorkId } from "@/lib/catalog/server/queries";
import type { CatalogErrorKind } from "@/lib/catalog/types";

type UpdateCatalogEditionActionResult =
  | Readonly<{
      success: true;
      data: Readonly<{ workId: string; editionId: string }>;
    }>
  | Readonly<{
      success: false;
      kind: CatalogErrorKind;
      message: string;
      fieldErrors?: CatalogEditionFieldErrors;
    }>;

function readString(formData: FormData, name: string) {
  const value = formData.get(name);
  if (value === null) return "";
  if (typeof value === "string") return value;
  throw new CatalogEntryValidationError("El formulario contiene un valor no válido.");
}

function validationFailure(
  fieldErrors: CatalogEditionFieldErrors,
): UpdateCatalogEditionActionResult {
  return {
    success: false,
    kind: "validation",
    message: "Revisa los datos del formulario.",
    fieldErrors,
  };
}

function publicFailure(error: unknown): UpdateCatalogEditionActionResult {
  if (error instanceof CatalogError) {
    return { success: false, kind: error.kind, message: error.message };
  }
  return {
    success: false,
    kind: "unexpected",
    message: "No se ha podido completar la operación.",
  };
}

export async function updateCatalogEditionAction(
  workId: string,
  editionId: string,
  formData: FormData,
): Promise<UpdateCatalogEditionActionResult> {
  try {
    const parsed = validateCatalogEditionUpdate(workId, editionId, {
      publisherId: readString(formData, "edition.publisherId"),
      editionTitle: readString(formData, "edition.editionTitle"),
      subtitle: readString(formData, "edition.subtitle"),
      isbn: readString(formData, "edition.isbn"),
      publicationDatePrecision: readString(
        formData,
        "edition.publicationDatePrecision",
      ),
      publicationDateInput: readString(
        formData,
        "edition.publicationDateInput",
      ),
      languageCode: readString(formData, "edition.languageCode"),
      format: readString(formData, "edition.format"),
      pageCount: readString(formData, "edition.pageCount"),
      audioDurationMinutes: readString(
        formData,
        "edition.audioDurationMinutes",
      ),
      coverUrl: readString(formData, "edition.coverUrl"),
    });

    if (!parsed.success) return validationFailure(parsed.fieldErrors);

    const actualWorkId = await getEditionWorkId(parsed.data.editionId);
    if (actualWorkId !== parsed.data.workId) {
      return publicFailure(new CatalogError("not_found", {
        operation: "updateCatalogEditionAction.relation",
      }));
    }

    const result = await updateEdition(
      parsed.data.editionId,
      parsed.data.edition,
    );
    revalidatePath(`/catalogo/${parsed.data.workId}`);
    revalidatePath("/biblioteca/nuevo");
    return {
      success: true,
      data: { workId: parsed.data.workId, editionId: result.id },
    };
  } catch (error) {
    if (error instanceof CatalogEntryValidationError) {
      return validationFailure({ form: [error.message] });
    }
    return publicFailure(error);
  }
}
