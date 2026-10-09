import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createWritableClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createReadOnlyClient: vi.fn(),
  createWritableClient: mocks.createWritableClient,
}));

import {
  ProfileMutationError,
  updateReadingDaysPerWeek,
} from "./profiles";

function createClient(result: unknown) {
  const maybeSingle = vi.fn(async () => result);
  const select = vi.fn(() => ({ maybeSingle }));
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  const getClaims = vi.fn(async () => ({
    data: { claims: { sub: "current-user" } },
    error: null,
  }));
  return {
    client: { auth: { getClaims }, from: vi.fn(() => ({ update })) },
    eq,
    maybeSingle,
    select,
    update,
  };
}

describe("updateReadingDaysPerWeek", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates only reading_days_per_week on the authenticated profile", async () => {
    const query = createClient({ data: { id: "current-user" }, error: null });
    mocks.createWritableClient.mockResolvedValueOnce(query.client);

    await expect(updateReadingDaysPerWeek(3)).resolves.toBeUndefined();

    expect(query.client.from).toHaveBeenCalledOnce();
    expect(query.client.from).toHaveBeenCalledWith("profiles");
    expect(query.update).toHaveBeenCalledWith({ reading_days_per_week: 3 });
    expect(query.eq).toHaveBeenCalledWith("id", "current-user");
    expect(query.select).toHaveBeenCalledWith("id");
  });

  it.each([0, 8, -1, 1.5, Number.NaN, 2 ** 53])(
    "rejects invalid input %s before creating a client",
    async (readingDaysPerWeek) => {
      await expect(updateReadingDaysPerWeek(readingDaysPerWeek)).rejects
        .toMatchObject({ kind: "constraint" });
      expect(mocks.createWritableClient).not.toHaveBeenCalled();
    },
  );

  it("maps zero rows to not_found", async () => {
    const query = createClient({ data: null, error: null });
    mocks.createWritableClient.mockResolvedValueOnce(query.client);

    await expect(updateReadingDaysPerWeek(3)).rejects.toMatchObject({
      kind: "not_found",
    });
  });

  it("maps database errors without exposing raw details", async () => {
    const query = createClient({
      data: null,
      error: { code: "42501", message: "private policy detail" },
    });
    mocks.createWritableClient.mockResolvedValueOnce(query.client);

    const operation = updateReadingDaysPerWeek(3);
    await expect(operation).rejects.toBeInstanceOf(ProfileMutationError);
    await expect(operation).rejects.toMatchObject({
      kind: "permission",
      message: "No se ha podido completar la operación con el perfil.",
    });
  });
});
