import { beforeEach, describe, expect, it, vi } from "vitest";

import { LibraryError } from "../errors";

const mocks = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const query = {
    delete: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    maybeSingle,
  };
  query.delete.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.select.mockReturnValue(query);

  const client = { from: vi.fn(() => query) };
  return { client, maybeSingle, query };
});

vi.mock("server-only", () => ({}));
vi.mock("./auth", () => ({
  createAuthenticatedLibraryWritableClient: vi.fn(async () => mocks.client),
}));

import { removeEditionFromLibrary } from "./mutations";

const editionId = "9b67e9d6-64de-4f8b-b3bd-928fae813b76";

async function expectLibraryError(
  operation: Promise<unknown>,
  kind: LibraryError["kind"],
) {
  await expect(operation).rejects.toMatchObject({ name: "LibraryError", kind });
}

describe("removeEditionFromLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns after deleting one membership without a fallback read", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: { id: "membership-id" },
      error: null,
    });

    await expect(removeEditionFromLibrary(editionId)).resolves.toBeUndefined();
    expect(mocks.client.from).toHaveBeenCalledTimes(1);
    expect(mocks.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("maps zero deleted rows and no visible membership to not_found", async () => {
    mocks.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    await expectLibraryError(
      removeEditionFromLibrary(editionId),
      "not_found",
    );
    expect(mocks.client.from).toHaveBeenCalledTimes(2);
  });

  it("maps zero deleted rows and a visible membership to protected_history", async () => {
    mocks.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: "membership-id" }, error: null });

    await expectLibraryError(
      removeEditionFromLibrary(editionId),
      "protected_history",
    );
  });

  it("maps a delete error without running the fallback read", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { code: "42501" },
    });

    await expectLibraryError(
      removeEditionFromLibrary(editionId),
      "permission",
    );
    expect(mocks.client.from).toHaveBeenCalledTimes(1);
    expect(mocks.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("maps an error from the fallback read safely", async () => {
    mocks.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST000" } });

    await expectLibraryError(
      removeEditionFromLibrary(editionId),
      "unexpected",
    );
  });
});
