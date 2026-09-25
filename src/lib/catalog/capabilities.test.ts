import { describe, expect, it } from "vitest";

import { mapWorkCapabilities } from "./mappers";

const viewerId = "00000000-0000-4000-8000-000000000001";
const otherUserId = "00000000-0000-4000-8000-000000000002";
const editionId = "00000000-0000-4000-8000-000000000003";

describe("mapWorkCapabilities", () => {
  it("allows editing and deleting an owned work without editions", () => {
    expect(mapWorkCapabilities({
      currentUserId: viewerId,
      workCreatorId: viewerId,
      editions: [],
    })).toEqual({
      canEditWork: true,
      canDeleteWork: true,
      editions: {},
    });
  });

  it("blocks work deletion when its owned edition exists", () => {
    expect(mapWorkCapabilities({
      currentUserId: viewerId,
      workCreatorId: viewerId,
      editions: [{ id: editionId, creatorId: viewerId }],
    })).toEqual({
      canEditWork: true,
      canDeleteWork: false,
      editions: {
        [editionId]: { canEditEdition: true, canDeleteEdition: true },
      },
    });
  });

  it("blocks work deletion and edition changes when an edition is foreign", () => {
    expect(mapWorkCapabilities({
      currentUserId: viewerId,
      workCreatorId: viewerId,
      editions: [{ id: editionId, creatorId: otherUserId }],
    })).toEqual({
      canEditWork: true,
      canDeleteWork: false,
      editions: {
        [editionId]: { canEditEdition: false, canDeleteEdition: false },
      },
    });
  });

  it("allows changing an owned edition independently from a foreign work", () => {
    expect(mapWorkCapabilities({
      currentUserId: viewerId,
      workCreatorId: otherUserId,
      editions: [{ id: editionId, creatorId: viewerId }],
    })).toEqual({
      canEditWork: false,
      canDeleteWork: false,
      editions: {
        [editionId]: { canEditEdition: true, canDeleteEdition: true },
      },
    });
  });

  it("keeps seed records with null creators read-only", () => {
    expect(mapWorkCapabilities({
      currentUserId: viewerId,
      workCreatorId: null,
      editions: [{ id: editionId, creatorId: null }],
    })).toEqual({
      canEditWork: false,
      canDeleteWork: false,
      editions: {
        [editionId]: { canEditEdition: false, canDeleteEdition: false },
      },
    });
  });
});
