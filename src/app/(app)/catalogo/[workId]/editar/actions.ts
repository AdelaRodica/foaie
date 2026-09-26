"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  CatalogEntryValidationError,
  parseCatalogRelationsJson,
} from "@/lib/catalog/catalog-entry-validation";
import {
  catalogWorkFieldErrors,
  catalogWorkUpdateInputSchema,
  type CatalogWorkFieldErrors,
} from "@/lib/catalog/catalog-work-validation";
import { CatalogError } from "@/lib/catalog/errors";
import { deleteWork } from "@/lib/catalog/server/mutations";
import {
  updateCatalogWork,
  type CatalogWorkUpdateResult,
} from "@/lib/catalog/server/catalog-work";
import type { CatalogErrorKind } from "@/lib/catalog/types";

type UpdateCatalogWorkActionResult =
  | Readonly<{ success: true; data: CatalogWorkUpdateResult }>
  | Readonly<{
      success: false;
      kind: CatalogErrorKind;
      message: string;
      fieldErrors?: CatalogWorkFieldErrors;
    }>;

type DeleteCatalogWorkActionResult =
  | Readonly<{ success: true; data: Readonly<{ workId: string }> }>
  | Readonly<{ success: false; kind: CatalogErrorKind; message: string }>;

const uuidSchema = z.string().uuid();

function readString(formData: FormData, name: string) {
  const value = formData.get(name);
  if (value === null) return "";
  if (typeof value === "string") return value;
  throw new CatalogEntryValidationError("El formulario contiene un valor no válido.");
}

function validationFailure(
  fieldErrors: CatalogWorkFieldErrors,
): UpdateCatalogWorkActionResult {
  return {
    success: false,
    kind: "validation",
    message: "Revisa los datos del formulario.",
    fieldErrors,
  };
}

function publicFailure(error: unknown): UpdateCatalogWorkActionResult {
  if (error instanceof CatalogError) {
    return { success: false, kind: error.kind, message: error.message };
  }

  return {
    success: false,
    kind: "unexpected",
    message: "No se ha podido completar la operación.",
  };
}

export async function updateCatalogWorkAction(
  workId: string,
  formData: FormData,
): Promise<UpdateCatalogWorkActionResult> {
  try {
    const relations: Record<string, unknown[]> = {};

    for (const field of [
      "authorRelations",
      "genreRelations",
      "seriesRelations",
    ] as const) {
      try {
        relations[field] = parseCatalogRelationsJson(formData.get(field));
      } catch (error) {
        if (error instanceof CatalogEntryValidationError) {
          return validationFailure({ [field]: [error.message] });
        }
        throw error;
      }
    }

    const parsed = catalogWorkUpdateInputSchema.safeParse({
      workId,
      work: {
        title: readString(formData, "work.title"),
        originalTitle: readString(formData, "work.originalTitle"),
        originalPublicationYear: readString(
          formData,
          "work.originalPublicationYear",
        ),
        originalLanguageCode: readString(
          formData,
          "work.originalLanguageCode",
        ),
        description: readString(formData, "work.description"),
      },
      authorRelations: relations.authorRelations,
      genreRelations: relations.genreRelations,
      seriesRelations: relations.seriesRelations,
    });

    if (!parsed.success) {
      return validationFailure(catalogWorkFieldErrors(parsed.error));
    }

    const result = await updateCatalogWork(parsed.data);
    revalidatePath(`/catalogo/${workId}`);
    revalidatePath("/biblioteca/nuevo");
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof CatalogEntryValidationError) {
      return validationFailure({ form: [error.message] });
    }
    return publicFailure(error);
  }
}

export async function deleteCatalogWorkAction(
  workId: string,
): Promise<DeleteCatalogWorkActionResult> {
  const parsedId = uuidSchema.safeParse(workId);
  if (!parsedId.success) {
    return {
      success: false,
      kind: "validation",
      message: "El identificador de la obra no es válido.",
    };
  }

  try {
    await deleteWork(parsedId.data);
    revalidatePath("/biblioteca/nuevo");
    return { success: true, data: { workId: parsedId.data } };
  } catch (error) {
    if (error instanceof CatalogError && error.kind === "constraint") {
      return {
        success: false,
        kind: "constraint",
        message: "No puede eliminarse la obra mientras conserve ediciones.",
      };
    }
    return publicFailure(error);
  }
}
