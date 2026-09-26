import { describe, expect, it } from "vitest";

import { buildEditionUpdatePayload } from "./edition-update-payload";

describe("buildEditionUpdatePayload", () => {
  it("omits both cover keys when neither source participates", () => {
    const payload = buildEditionUpdatePayload({ editionTitle: "Edición revisada" });

    expect(payload).not.toHaveProperty("cover_url");
    expect(payload).not.toHaveProperty("cover_storage_key");
  });

  it("clears only the URL when coverUrl is explicitly null", () => {
    const payload = buildEditionUpdatePayload({ coverUrl: null });

    expect(payload).toHaveProperty("cover_url", null);
    expect(payload).not.toHaveProperty("cover_storage_key");
  });

  it("sets a URL and clears the storage source atomically", () => {
    const payload = buildEditionUpdatePayload({
      coverUrl: "https://example.com/cover.jpg",
    });

    expect(payload).toMatchObject({
      cover_url: "https://example.com/cover.jpg",
      cover_storage_key: null,
    });
  });

  it("clears only the storage source when explicitly null", () => {
    const payload = buildEditionUpdatePayload({ coverStorageKey: null });

    expect(payload).toHaveProperty("cover_storage_key", null);
    expect(payload).not.toHaveProperty("cover_url");
  });

  it("sets a storage source and clears the URL atomically", () => {
    const payload = buildEditionUpdatePayload({
      coverStorageKey: "covers/edition.jpg",
    });

    expect(payload).toMatchObject({
      cover_storage_key: "covers/edition.jpg",
      cover_url: null,
    });
  });
});
