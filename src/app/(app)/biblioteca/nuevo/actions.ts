"use server";

import { CatalogError } from "@/lib/catalog/errors";
import { createAuthor, createPublisher, createSeries } from "@/lib/catalog/server/mutations";
import {
  getAuthorById,
  getPublisherById,
  getSeriesById,
  searchAuthors,
  searchPublishers,
  searchSeries,
} from "@/lib/catalog/server/queries";
import type { AuthorSummary, CatalogErrorKind, PublisherSummary, SeriesSummary } from "@/lib/catalog/types";

type ActionResult<T> =
  | Readonly<{ success: true; data: T }>
  | Readonly<{ success: false; kind: CatalogErrorKind; message: string }>;

function publicFailure(error: unknown): ActionResult<never> {
  if (error instanceof CatalogError) {
    return { success: false, kind: error.kind, message: error.message };
  }
  return { success: false, kind: "unexpected", message: "No se ha podido completar la operación." };
}

async function safely<T>(operation: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { success: true, data: await operation() };
  } catch (error) {
    return publicFailure(error);
  }
}

export async function searchAuthorsAction(query: string) {
  return safely(() => searchAuthors({ query, limit: 10 }));
}

export async function searchPublishersAction(query: string) {
  return safely(() => searchPublishers({ query, limit: 10 }));
}

export async function searchSeriesAction(query: string) {
  return safely(() => searchSeries({ query, limit: 10 }));
}

export async function createAuthorAction(input: { name: string; sortName: string | null }): Promise<ActionResult<AuthorSummary>> {
  return safely(async () => getAuthorById((await createAuthor(input)).id));
}

export async function createPublisherAction(input: { name: string }): Promise<ActionResult<PublisherSummary>> {
  return safely(async () => getPublisherById((await createPublisher(input)).id));
}

export async function createSeriesAction(input: { name: string; description: string | null }): Promise<ActionResult<SeriesSummary>> {
  return safely(async () => getSeriesById((await createSeries(input)).id));
}
