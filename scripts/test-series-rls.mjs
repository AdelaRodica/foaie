import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const requiredEnvironmentVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "FOAIE_TEST_USER_A_EMAIL",
  "FOAIE_TEST_USER_A_PASSWORD",
  "FOAIE_TEST_USER_B_EMAIL",
  "FOAIE_TEST_USER_B_PASSWORD",
];

class SafeTestError extends Error {
  constructor(testName, description, code) {
    super(description);
    this.name = "SafeTestError";
    this.testName = testName;
    this.code = safeErrorCode(code);
  }
}

function safeErrorCode(code) {
  return typeof code === "string" && /^[A-Z0-9_]{2,30}$/.test(code)
    ? code
    : undefined;
}

function assert(condition, testName, description, code) {
  if (!condition) {
    throw new SafeTestError(testName, description, code);
  }
}

function assertNoError(error, testName, description) {
  if (error) {
    throw new SafeTestError(testName, description, error.code);
  }
}

function assertCode(result, expectedCode, testName, description) {
  assert(
    result.error?.code === expectedCode,
    testName,
    description,
    result.error?.code,
  );
}

function assertDeniedOrEmpty(result, testName, description) {
  if (result.error) {
    assertCode(result, "42501", testName, description);
    return;
  }

  assert(
    Array.isArray(result.data) && result.data.length === 0,
    testName,
    description,
  );
}

function createTestClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

async function authenticate(client, email, password, testName) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assertNoError(error, testName, "authentication or network setup failed");
  assert(Boolean(data.user?.id), testName, "authenticated user was not returned");
  return data.user.id;
}

async function verifyRow(client, table, id, columns, testName) {
  const result = await client.from(table).select(columns).eq("id", id);
  assertNoError(result.error, testName, "verification read failed");
  assert(
    result.data.length === 1 && result.data[0].id === id,
    testName,
    "expected row was not preserved",
  );
  return result.data[0];
}

async function verifyRelation(client, workId, seriesId, testName) {
  const result = await client
    .from("work_series")
    .select("work_id, series_id, position, position_label")
    .eq("work_id", workId)
    .eq("series_id", seriesId);
  assertNoError(result.error, testName, "relationship verification failed");
  assert(result.data.length === 1, testName, "expected relationship was not preserved");
  return result.data[0];
}

function numericEquals(value, expected) {
  return Number(value) === expected;
}

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

let testsRun = 0;
let testsPassed = 0;

async function runTest(name, test) {
  testsRun += 1;
  try {
    await test();
    testsPassed += 1;
    console.log(`PASS  ${name}`);
  } catch (error) {
    if (error instanceof SafeTestError) throw error;
    throw new SafeTestError(name, "unexpected test failure", error?.code);
  }
}

for (const variableName of requiredEnvironmentVariables) {
  if (!process.env[variableName]?.trim()) {
    console.error("FAIL  setup [MISSING_ENV]: required test configuration is missing");
    process.exit(1);
  }
}

const anonClient = createTestClient();
const userAClient = createTestClient();
const userBClient = createTestClient();

const runMarker = randomUUID().replaceAll("-", "").slice(0, 16);
const initialSeriesAName = `   SAGA    FICTICIA   DE   PRUEBA   ${runMarker}   `;
const normalizedSeriesAName = `saga ficticia de prueba ${runMarker}`;

const workIdsA = [];
const workIdsB = [];
const seriesIdsA = [];
const seriesIdsB = [];
const allWorkIds = [];
const allSeriesIds = [];

let userAId;
let userBId;
let seriesAId;
let seriesBId;
let seriesBExtraId;
let workAId;
let workBId;
let workASecondId;
let cleanupSucceeded = true;

function trackId(id, activeIds, allIds) {
  activeIds.push(id);
  allIds.push(id);
}

try {
  userAId = await authenticate(
    userAClient,
    process.env.FOAIE_TEST_USER_A_EMAIL,
    process.env.FOAIE_TEST_USER_A_PASSWORD,
    "setup user A authentication",
  );
  userBId = await authenticate(
    userBClient,
    process.env.FOAIE_TEST_USER_B_EMAIL,
    process.env.FOAIE_TEST_USER_B_PASSWORD,
    "setup user B authentication",
  );

  await runTest("1. anon cannot read series", async () => {
    const result = await anonClient.from("series").select("id").limit(1);
    assertCode(result, "42501", "1. anon cannot read series", "anonymous series read was not denied");
  });

  await runTest("2. anon cannot read work_series", async () => {
    const result = await anonClient.from("work_series").select("work_id").limit(1);
    assertCode(result, "42501", "2. anon cannot read work_series", "anonymous relation read was not denied");
  });

  let initialSeriesUpdatedAt;
  await runTest("3. A creates a series", async () => {
    const result = await userAClient
      .from("series")
      .insert({ name: initialSeriesAName })
      .select("id, created_by_profile_id, normalized_name, updated_at");
    assertNoError(result.error, "3. A creates a series", "allowed series insert failed");
    assert(result.data.length === 1, "3. A creates a series", "series was not returned");
    seriesAId = result.data[0].id;
    initialSeriesUpdatedAt = result.data[0].updated_at;
    trackId(seriesAId, seriesIdsA, allSeriesIds);
    assert(
      result.data[0].created_by_profile_id === userAId,
      "3. A creates a series",
      "database did not assign user A as creator",
    );
  });

  await runTest("4. normalized_name is generated", async () => {
    const row = await verifyRow(
      userAClient,
      "series",
      seriesAId,
      "id, normalized_name",
      "4. normalized_name is generated",
    );
    assert(
      row.normalized_name === normalizedSeriesAName,
      "4. normalized_name is generated",
      "generated name did not normalize whitespace and case",
    );
  });

  await runTest("5. B reads A series", async () => {
    await verifyRow(userBClient, "series", seriesAId, "id", "5. B reads A series");
  });

  await runTest("6. B cannot update A series", async () => {
    const attempted = await userBClient
      .from("series")
      .update({ description: `Unauthorized ${runMarker}` })
      .eq("id", seriesAId)
      .select("id");
    assertDeniedOrEmpty(attempted, "6. B cannot update A series", "cross-user update was not denied");
    const row = await verifyRow(userAClient, "series", seriesAId, "id, description", "6. B cannot update A series");
    assert(row.description === null, "6. B cannot update A series", "series changed after denied update");
  });

  await runTest("7. B cannot delete A series", async () => {
    const attempted = await userBClient.from("series").delete().eq("id", seriesAId).select("id");
    assertDeniedOrEmpty(attempted, "7. B cannot delete A series", "cross-user delete was not denied");
    await verifyRow(userAClient, "series", seriesAId, "id", "7. B cannot delete A series");
  });

  await runTest("8. A updates own series", async () => {
    await wait(20);
    const result = await userAClient
      .from("series")
      .update({ description: `Descripción ficticia ${runMarker}` })
      .eq("id", seriesAId)
      .select("id, description, updated_at");
    assertNoError(result.error, "8. A updates own series", "allowed update failed");
    assert(
      result.data.length === 1 && result.data[0].description === `Descripción ficticia ${runMarker}`,
      "8. A updates own series",
      "series description did not change",
    );
  });

  await runTest("9. updated_at changes", async () => {
    const row = await verifyRow(userAClient, "series", seriesAId, "id, updated_at", "9. updated_at changes");
    assert(
      Date.parse(row.updated_at) > Date.parse(initialSeriesUpdatedAt),
      "9. updated_at changes",
      "updated_at did not advance",
    );
  });

  await runTest("10. A cannot forge created_by_profile_id", async () => {
    const forgedName = `Forged series ${runMarker}`;
    const attempted = await userAClient
      .from("series")
      .insert({ name: forgedName, created_by_profile_id: userBId })
      .select("id");
    assertCode(attempted, "42501", "10. A cannot forge created_by_profile_id", "protected creator column was writable");
    const verification = await userAClient.from("series").select("id").eq("name", forgedName);
    assertNoError(verification.error, "10. A cannot forge created_by_profile_id", "verification failed");
    assert(verification.data.length === 0, "10. A cannot forge created_by_profile_id", "forged series was created");
  });

  await runTest("11. A cannot modify created_by_profile_id", async () => {
    const attempted = await userAClient
      .from("series")
      .update({ created_by_profile_id: userBId })
      .eq("id", seriesAId)
      .select("id");
    assertCode(attempted, "42501", "11. A cannot modify created_by_profile_id", "protected creator column was writable");
    const row = await verifyRow(userAClient, "series", seriesAId, "id, created_by_profile_id", "11. A cannot modify created_by_profile_id");
    assert(row.created_by_profile_id === userAId, "11. A cannot modify created_by_profile_id", "series creator changed");
  });

  await runTest("12. A creates own work", async () => {
    const result = await userAClient.from("works").insert({ title: `Series work A ${runMarker}` }).select("id, created_by_profile_id");
    assertNoError(result.error, "12. A creates own work", "work A creation failed");
    workAId = result.data[0]?.id;
    assert(workAId && result.data[0].created_by_profile_id === userAId, "12. A creates own work", "work A creator incorrect");
    trackId(workAId, workIdsA, allWorkIds);
  });

  await runTest("13. B creates own work", async () => {
    const result = await userBClient.from("works").insert({ title: `Series work B ${runMarker}` }).select("id, created_by_profile_id");
    assertNoError(result.error, "13. B creates own work", "work B creation failed");
    workBId = result.data[0]?.id;
    assert(workBId && result.data[0].created_by_profile_id === userBId, "13. B creates own work", "work B creator incorrect");
    trackId(workBId, workIdsB, allWorkIds);
  });

  await runTest("14. B creates own series", async () => {
    const result = await userBClient.from("series").insert({ name: `Series B ${runMarker}` }).select("id, created_by_profile_id");
    assertNoError(result.error, "14. B creates own series", "series B creation failed");
    seriesBId = result.data[0]?.id;
    assert(seriesBId && result.data[0].created_by_profile_id === userBId, "14. B creates own series", "series B creator incorrect");
    trackId(seriesBId, seriesIdsB, allSeriesIds);
  });

  await runTest("15. A links own series to own work", async () => {
    const result = await userAClient
      .from("work_series")
      .insert({ work_id: workAId, series_id: seriesAId, position: 1 })
      .select("work_id, series_id, position");
    assertNoError(result.error, "15. A links own series to own work", "allowed relation insert failed");
    assert(result.data.length === 1 && numericEquals(result.data[0].position, 1), "15. A links own series to own work", "relation was not stored");
  });

  await runTest("16. A links B series to own work", async () => {
    const result = await userAClient
      .from("work_series")
      .insert({ work_id: workAId, series_id: seriesBId, position: 2.5 })
      .select("work_id, series_id, position");
    assertNoError(result.error, "16. A links B series to own work", "cross-creator series link failed");
    assert(result.data.length === 1 && numericEquals(result.data[0].position, 2.5), "16. A links B series to own work", "relation was not stored");
  });

  await runTest("17. B reads A relations", async () => {
    const result = await userBClient.from("work_series").select("series_id").eq("work_id", workAId);
    assertNoError(result.error, "17. B reads A relations", "catalog relation read failed");
    assert(result.data.length === 2, "17. B reads A relations", "expected relations were not visible");
  });

  await runTest("18. B cannot add relations to A work", async () => {
    const fixture = await userBClient.from("series").insert({ name: `Series B extra ${runMarker}` }).select("id");
    assertNoError(fixture.error, "18. B cannot add relations to A work", "fixture series creation failed");
    seriesBExtraId = fixture.data[0]?.id;
    trackId(seriesBExtraId, seriesIdsB, allSeriesIds);
    const attempted = await userBClient
      .from("work_series")
      .insert({ work_id: workAId, series_id: seriesBExtraId })
      .select("work_id");
    assertDeniedOrEmpty(attempted, "18. B cannot add relations to A work", "cross-user relation insert was not denied");
    const verification = await userAClient.from("work_series").select("work_id").eq("work_id", workAId).eq("series_id", seriesBExtraId);
    assertNoError(verification.error, "18. B cannot add relations to A work", "verification failed");
    assert(verification.data.length === 0, "18. B cannot add relations to A work", "unauthorized relation was created");
  });

  await runTest("19. B cannot update A relation", async () => {
    const attempted = await userBClient.from("work_series").update({ position: 7 }).eq("work_id", workAId).eq("series_id", seriesAId).select("position");
    assertDeniedOrEmpty(attempted, "19. B cannot update A relation", "cross-user relation update was not denied");
    const row = await verifyRelation(userAClient, workAId, seriesAId, "19. B cannot update A relation");
    assert(numericEquals(row.position, 1), "19. B cannot update A relation", "relation changed after denied update");
  });

  await runTest("20. B cannot delete A relation", async () => {
    const attempted = await userBClient.from("work_series").delete().eq("work_id", workAId).eq("series_id", seriesAId).select("work_id");
    assertDeniedOrEmpty(attempted, "20. B cannot delete A relation", "cross-user relation delete was not denied");
    await verifyRelation(userAClient, workAId, seriesAId, "20. B cannot delete A relation");
  });

  await runTest("21. A updates position", async () => {
    const result = await userAClient.from("work_series").update({ position: 2.125 }).eq("work_id", workAId).eq("series_id", seriesAId).select("position");
    assertNoError(result.error, "21. A updates position", "allowed position update failed");
    assert(result.data.length === 1 && numericEquals(result.data[0].position, 2.125), "21. A updates position", "position was not stored numerically");
  });

  await runTest("22. A updates position_label", async () => {
    const result = await userAClient.from("work_series").update({ position_label: "Historia complementaria" }).eq("work_id", workAId).eq("series_id", seriesAId).select("position_label");
    assertNoError(result.error, "22. A updates position_label", "allowed label update failed");
    assert(result.data[0]?.position_label === "Historia complementaria", "22. A updates position_label", "label was not stored");
  });

  await runTest("23. work_id cannot be modified", async () => {
    const attempted = await userAClient.from("work_series").update({ work_id: workBId }).eq("work_id", workAId).eq("series_id", seriesAId).select("work_id");
    assertCode(attempted, "42501", "23. work_id cannot be modified", "protected work_id was writable");
    const row = await verifyRelation(userAClient, workAId, seriesAId, "23. work_id cannot be modified");
    assert(row.work_id === workAId, "23. work_id cannot be modified", "relation moved to another work");
  });

  await runTest("24. series_id cannot be modified", async () => {
    const attempted = await userAClient.from("work_series").update({ series_id: seriesBExtraId }).eq("work_id", workAId).eq("series_id", seriesAId).select("series_id");
    assertCode(attempted, "42501", "24. series_id cannot be modified", "protected series_id was writable");
    const row = await verifyRelation(userAClient, workAId, seriesAId, "24. series_id cannot be modified");
    assert(row.series_id === seriesAId, "24. series_id cannot be modified", "relation moved to another series");
  });

  for (const [number, value] of [[25, 1], [26, 2.5], [27, 2.125]]) {
    await runTest(`${number}. position ${value} is accepted`, async () => {
      const result = await userAClient.from("work_series").update({ position: value }).eq("work_id", workAId).eq("series_id", seriesAId).select("position");
      assertNoError(result.error, `${number}. position ${value} is accepted`, "valid position update failed");
      assert(result.data.length === 1 && numericEquals(result.data[0].position, value), `${number}. position ${value} is accepted`, "numeric position changed unexpectedly");
    });
  }

  await runTest("28. position zero is rejected", async () => {
    const attempted = await userAClient.from("work_series").update({ position: 0 }).eq("work_id", workAId).eq("series_id", seriesAId).select("position");
    assertCode(attempted, "23514", "28. position zero is rejected", "position check did not reject zero");
    const row = await verifyRelation(userAClient, workAId, seriesAId, "28. position zero is rejected");
    assert(numericEquals(row.position, 2.125), "28. position zero is rejected", "position changed after rejected update");
  });

  await runTest("29. negative position is rejected", async () => {
    const attempted = await userAClient.from("work_series").update({ position: -1 }).eq("work_id", workAId).eq("series_id", seriesAId).select("position");
    assertCode(attempted, "23514", "29. negative position is rejected", "position check did not reject negative value");
    const row = await verifyRelation(userAClient, workAId, seriesAId, "29. negative position is rejected");
    assert(numericEquals(row.position, 2.125), "29. negative position is rejected", "position changed after rejected update");
  });

  await runTest("30. Precuela position_label is accepted", async () => {
    const result = await userAClient.from("work_series").update({ position: null, position_label: "Precuela" }).eq("work_id", workAId).eq("series_id", seriesAId).select("position, position_label");
    assertNoError(result.error, "30. Precuela position_label is accepted", "valid label update failed");
    assert(result.data[0]?.position === null && result.data[0]?.position_label === "Precuela", "30. Precuela position_label is accepted", "prequel representation changed");
  });

  for (const [number, label] of [[31, ""], [32, "   "]]) {
    await runTest(`${number}. blank position_label is rejected`, async () => {
      const attempted = await userAClient.from("work_series").update({ position_label: label }).eq("work_id", workAId).eq("series_id", seriesAId).select("position_label");
      assertCode(attempted, "23514", `${number}. blank position_label is rejected`, "label check did not reject blank text");
      const row = await verifyRelation(userAClient, workAId, seriesAId, `${number}. blank position_label is rejected`);
      assert(row.position_label === "Precuela", `${number}. blank position_label is rejected`, "label changed after rejected update");
    });
  }

  await runTest("33. null position and null label are accepted", async () => {
    const result = await userAClient.from("work_series").update({ position: null, position_label: null }).eq("work_id", workAId).eq("series_id", seriesAId).select("position, position_label");
    assertNoError(result.error, "33. null position and null label are accepted", "null relation metadata failed");
    assert(result.data[0]?.position === null && result.data[0]?.position_label === null, "33. null position and null label are accepted", "null metadata changed");
  });

  await runTest("34. one work belongs to two series", async () => {
    const result = await userAClient.from("work_series").select("series_id").eq("work_id", workAId);
    assertNoError(result.error, "34. one work belongs to two series", "relation query failed");
    assert(result.data.length === 2, "34. one work belongs to two series", "work did not retain both series");
  });

  await runTest("35. one series contains multiple works", async () => {
    const work = await userAClient.from("works").insert({ title: `Series second work A ${runMarker}` }).select("id");
    assertNoError(work.error, "35. one series contains multiple works", "second work creation failed");
    workASecondId = work.data[0]?.id;
    trackId(workASecondId, workIdsA, allWorkIds);
    const relation = await userAClient.from("work_series").insert({ work_id: workASecondId, series_id: seriesAId, position: 1 }).select("work_id");
    assertNoError(relation.error, "35. one series contains multiple works", "second relation creation failed");
    const verification = await userAClient.from("work_series").select("work_id").eq("series_id", seriesAId);
    assertNoError(verification.error, "35. one series contains multiple works", "verification failed");
    assert(verification.data.length === 2, "35. one series contains multiple works", "series did not contain both works");
  });

  await runTest("36. duplicate work-series pair is rejected", async () => {
    const attempted = await userAClient.from("work_series").insert({ work_id: workAId, series_id: seriesAId }).select("work_id");
    assertCode(attempted, "23505", "36. duplicate work-series pair is rejected", "primary key did not reject duplicate pair");
    const verification = await userAClient.from("work_series").select("work_id").eq("work_id", workAId).eq("series_id", seriesAId);
    assertNoError(verification.error, "36. duplicate work-series pair is rejected", "verification failed");
    assert(verification.data.length === 1, "36. duplicate work-series pair is rejected", "duplicate relation remained");
  });

  await runTest("37. different works share a position in one series", async () => {
    const first = await userAClient.from("work_series").update({ position: 1 }).eq("work_id", workAId).eq("series_id", seriesAId).select("position");
    assertNoError(first.error, "37. different works share a position in one series", "first position update failed");
    const result = await userAClient.from("work_series").select("work_id, position").eq("series_id", seriesAId).eq("position", 1);
    assertNoError(result.error, "37. different works share a position in one series", "shared position query failed");
    assert(result.data.length === 2 && result.data.every((row) => numericEquals(row.position, 1)), "37. different works share a position in one series", "shared position was not accepted");
  });

  await runTest("38. B links A series to B work", async () => {
    const result = await userBClient.from("work_series").insert({ work_id: workBId, series_id: seriesAId, position: 2 }).select("work_id, series_id");
    assertNoError(result.error, "38. B links A series to B work", "cross-creator series link failed");
    assert(result.data.length === 1, "38. B links A series to B work", "relation was not created");
  });

  await runTest("39. ON DELETE CASCADE, RESTRICT, and free series deletion", async () => {
    const cascadeWork = await userAClient.from("works").insert({ title: `Cascade work ${runMarker}` }).select("id");
    assertNoError(cascadeWork.error, "39. ON DELETE CASCADE, RESTRICT, and free series deletion", "cascade work setup failed");
    const cascadeWorkId = cascadeWork.data[0]?.id;
    trackId(cascadeWorkId, workIdsA, allWorkIds);
    const cascadeSeries = await userAClient.from("series").insert({ name: `Cascade series ${runMarker}` }).select("id");
    assertNoError(cascadeSeries.error, "39. ON DELETE CASCADE, RESTRICT, and free series deletion", "cascade series setup failed");
    const cascadeSeriesId = cascadeSeries.data[0]?.id;
    trackId(cascadeSeriesId, seriesIdsA, allSeriesIds);
    const cascadeRelation = await userAClient.from("work_series").insert({ work_id: cascadeWorkId, series_id: cascadeSeriesId }).select("work_id");
    assertNoError(cascadeRelation.error, "39. ON DELETE CASCADE, RESTRICT, and free series deletion", "cascade relation setup failed");
    const deletedWork = await userAClient.from("works").delete().eq("id", cascadeWorkId).select("id");
    assertNoError(deletedWork.error, "39. ON DELETE CASCADE, RESTRICT, and free series deletion", "work deletion failed");
    const cascadeCheck = await userAClient.from("work_series").select("work_id").eq("work_id", cascadeWorkId);
    assertNoError(cascadeCheck.error, "39. ON DELETE CASCADE, RESTRICT, and free series deletion", "cascade verification failed");
    assert(cascadeCheck.data.length === 0, "39. ON DELETE CASCADE, RESTRICT, and free series deletion", "work relation did not cascade");

    const restrictWork = await userAClient.from("works").insert({ title: `Restrict work ${runMarker}` }).select("id");
    assertNoError(restrictWork.error, "39. ON DELETE CASCADE, RESTRICT, and free series deletion", "restrict work setup failed");
    const restrictWorkId = restrictWork.data[0]?.id;
    trackId(restrictWorkId, workIdsA, allWorkIds);
    const restrictSeries = await userAClient.from("series").insert({ name: `Restrict series ${runMarker}` }).select("id");
    assertNoError(restrictSeries.error, "39. ON DELETE CASCADE, RESTRICT, and free series deletion", "restrict series setup failed");
    const restrictSeriesId = restrictSeries.data[0]?.id;
    trackId(restrictSeriesId, seriesIdsA, allSeriesIds);
    const restrictRelation = await userAClient.from("work_series").insert({ work_id: restrictWorkId, series_id: restrictSeriesId }).select("work_id");
    assertNoError(restrictRelation.error, "39. ON DELETE CASCADE, RESTRICT, and free series deletion", "restrict relation setup failed");
    const restrictedDelete = await userAClient.from("series").delete().eq("id", restrictSeriesId).select("id");
    assertCode(restrictedDelete, "23503", "39. ON DELETE CASCADE, RESTRICT, and free series deletion", "used series deletion was not restricted");
    await verifyRow(userAClient, "series", restrictSeriesId, "id", "39. ON DELETE CASCADE, RESTRICT, and free series deletion");

    const freeSeries = await userAClient.from("series").insert({ name: `Free series ${runMarker}` }).select("id");
    assertNoError(freeSeries.error, "39. ON DELETE CASCADE, RESTRICT, and free series deletion", "free series setup failed");
    const freeSeriesId = freeSeries.data[0]?.id;
    trackId(freeSeriesId, seriesIdsA, allSeriesIds);
    const freeDelete = await userAClient.from("series").delete().eq("id", freeSeriesId).select("id");
    assertNoError(freeDelete.error, "39. ON DELETE CASCADE, RESTRICT, and free series deletion", "free series deletion failed");
    assert(freeDelete.data.length === 1, "39. ON DELETE CASCADE, RESTRICT, and free series deletion", "free series was not deleted");
  });
} catch (error) {
  const safeError = error instanceof SafeTestError
    ? error
    : new SafeTestError("setup", "unexpected integration test failure", error?.code);
  const code = safeError.code ? ` [${safeError.code}]` : "";
  console.error(`FAIL  ${safeError.testName}${code}: ${safeError.message}`);
  process.exitCode = 1;
} finally {
  const cleanupErrors = [];
  async function cleanup(result, description) {
    if (result.error) cleanupErrors.push({ description, code: safeErrorCode(result.error.code) });
  }

  if (workIdsA.length) {
    await cleanup(await userAClient.from("work_series").delete().in("work_id", workIdsA), "A relations were not removed");
  }
  if (workIdsB.length) {
    await cleanup(await userBClient.from("work_series").delete().in("work_id", workIdsB), "B relations were not removed");
  }
  if (workIdsA.length) {
    await cleanup(await userAClient.from("works").delete().in("id", workIdsA), "A works were not removed");
  }
  if (workIdsB.length) {
    await cleanup(await userBClient.from("works").delete().in("id", workIdsB), "B works were not removed");
  }
  if (seriesIdsA.length) {
    await cleanup(await userAClient.from("series").delete().in("id", seriesIdsA), "A series were not removed");
  }
  if (seriesIdsB.length) {
    await cleanup(await userBClient.from("series").delete().in("id", seriesIdsB), "B series were not removed");
  }

  if (userAId) {
    const remainingWorks = allWorkIds.length
      ? await userAClient.from("works").select("id").in("id", allWorkIds)
      : { data: [], error: null };
    const remainingSeries = allSeriesIds.length
      ? await userAClient.from("series").select("id").in("id", allSeriesIds)
      : { data: [], error: null };
    const remainingRelations = allWorkIds.length
      ? await userAClient.from("work_series").select("work_id").in("work_id", allWorkIds)
      : { data: [], error: null };
    if (
      remainingWorks.error || remainingSeries.error || remainingRelations.error ||
      remainingWorks.data.length || remainingSeries.data.length || remainingRelations.data.length
    ) {
      cleanupErrors.push({ description: "test rows remain after cleanup" });
    }
  }

  cleanupSucceeded = cleanupErrors.length === 0;
  for (const cleanupError of cleanupErrors) {
    const code = cleanupError.code ? ` [${cleanupError.code}]` : "";
    console.error(`FAIL  cleanup${code}: ${cleanupError.description}`);
  }
  if (!cleanupSucceeded) process.exitCode = 1;
}

if (testsRun === 39 && testsPassed === 39 && cleanupSucceeded && !process.exitCode) {
  console.log("39/39 tests passed");
  console.log("Cleanup verified: no series, work_series, or work test rows remain");
}
