import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class ProfileMutationError extends Error {
    readonly kind:
      | "unauthenticated"
      | "not_found"
      | "permission"
      | "constraint"
      | "unexpected";

    constructor(
      kind: ProfileMutationError["kind"],
      options: ErrorOptions = {},
    ) {
      super("safe profile error", options);
      this.kind = kind;
    }
  }

  return {
    ProfileMutationError,
    revalidatePath: vi.fn(),
    updateReadingDaysPerWeek: vi.fn(),
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/db/profiles", () => ({
  ProfileMutationError: mocks.ProfileMutationError,
  updateCurrentUserProfile: vi.fn(),
  updateReadingDaysPerWeek: mocks.updateReadingDaysPerWeek,
}));

import { ProfileMutationError } from "@/lib/db/profiles";

import { updateReadingDaysPerWeekAction } from "./actions";

function formData(readingDaysPerWeek: string): FormData {
  const data = new FormData();
  data.set("readingDaysPerWeek", readingDaysPerWeek);
  return data;
}

describe("updateReadingDaysPerWeekAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls the primitive once and revalidates ajustes", async () => {
    const result = await updateReadingDaysPerWeekAction(
      { status: "idle" },
      formData("3"),
    );

    expect(mocks.updateReadingDaysPerWeek).toHaveBeenCalledOnce();
    expect(mocks.updateReadingDaysPerWeek).toHaveBeenCalledWith(3);
    expect(mocks.revalidatePath).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/ajustes");
    expect(result).toEqual({
      status: "success",
      message: "Ritmo de lectura actualizado.",
    });
  });

  it("does not mutate or revalidate invalid input", async () => {
    const result = await updateReadingDaysPerWeekAction(
      { status: "idle" },
      formData("8"),
    );

    expect(mocks.updateReadingDaysPerWeek).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "error",
      message: "Elige entre 1 y 7 días de lectura por semana.",
    });
  });

  it("maps profile failures to safe public messages", async () => {
    mocks.updateReadingDaysPerWeek.mockRejectedValueOnce(
      new ProfileMutationError("permission", {
        cause: { message: "private policy detail" },
      }),
    );

    const result = await updateReadingDaysPerWeekAction(
      { status: "idle" },
      formData("3"),
    );

    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "error",
      message: "No se ha podido modificar tu perfil.",
    });
  });
});
