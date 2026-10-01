"use server";

import { revalidatePath } from "next/cache";

import {
  libraryActionSuccess,
  libraryValidationFailure,
  mapAddToLibraryError,
  mapRemoveFromLibraryError,
  type LibraryActionResult,
  validateLibraryEditionId,
} from "./action-result";
import {
  addEditionToLibrary,
  removeEditionFromLibrary,
} from "./server/mutations";

function revalidateLibraryViews() {
  revalidatePath("/biblioteca");
  revalidatePath("/catalogo/[workId]", "page");
}

export async function addEditionToLibraryAction(
  editionId: string,
): Promise<LibraryActionResult> {
  if (!validateLibraryEditionId(editionId)) return libraryValidationFailure();

  try {
    await addEditionToLibrary(editionId);
    revalidateLibraryViews();
    return libraryActionSuccess("added");
  } catch (error) {
    const result = mapAddToLibraryError(error);
    if (result.success && result.state === "already_added") {
      revalidateLibraryViews();
    }
    return result;
  }
}

export async function removeEditionFromLibraryAction(
  editionId: string,
): Promise<LibraryActionResult> {
  if (!validateLibraryEditionId(editionId)) return libraryValidationFailure();

  try {
    await removeEditionFromLibrary(editionId);
    revalidateLibraryViews();
    return libraryActionSuccess("removed");
  } catch (error) {
    const result = mapRemoveFromLibraryError(error);
    if (
      (result.success && result.state === "already_removed") ||
      (!result.success && result.kind === "protected_history")
    ) {
      revalidateLibraryViews();
    }
    return result;
  }
}
