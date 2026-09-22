import { randomInt, randomUUID } from "node:crypto";

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
  if (!condition) throw new SafeTestError(testName, description, code);
}

function assertNoError(error, testName, description) {
  if (error) throw new SafeTestError(testName, description, error.code);
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
  assert(
    result.error?.code === "42501" ||
      (!result.error && Array.isArray(result.data) && result.data.length === 0),
    testName,
    description,
    result.error?.code,
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

function isbn10FromBase(base) {
  assert(/^\d{9}$/.test(base), "ISBN fixture", "invalid ISBN-10 fixture base");
  const total = [...base].reduce(
    (sum, digit, index) => sum + Number(digit) * (10 - index),
    0,
  );
  const check = (11 - (total % 11)) % 11;
  return `${base}${check === 10 ? "X" : check}`;
}

function isbn13FromBase(base) {
  assert(/^\d{12}$/.test(base), "ISBN fixture", "invalid ISBN-13 fixture base");
  const total = [...base].reduce(
    (sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  return `${base}${(10 - (total % 10)) % 10}`;
}

function isbn13FromIsbn10(isbn10) {
  return isbn13FromBase(`978${isbn10.slice(0, 9)}`);
}

function randomDigits(length) {
  return Array.from({ length }, () => randomInt(0, 10)).join("");
}

function createIsbn10(requireX = false) {
  for (;;) {
    const isbn = isbn10FromBase(randomDigits(9));
    if (!requireX || isbn.endsWith("X")) return isbn;
  }
}

function createIsbn13(prefix = "978") {
  return isbn13FromBase(`${prefix}${randomDigits(9)}`);
}

function invalidateChecksum(isbn) {
  const last = isbn.at(-1);
  const replacement = last === "0" ? "1" : "0";
  return `${isbn.slice(0, -1)}${replacement}`;
}

function formatIsbn10(isbn) {
  return `  ${isbn.slice(0, 1)}-${isbn.slice(1, 4)} ${isbn.slice(4, 9)}-${isbn.slice(9)}  `;
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

let userAId;
let userBId;
let workAId;
let workBId;
let publisherAId;
const editionIdsA = [];
const editionIdsB = [];
const publisherIdsA = [];
const publisherIdsB = [];
const workIdsA = [];
const workIdsB = [];
let fixtureCounter = 0;
let cleanupSucceeded = true;

function editionTitle(label) {
  fixtureCounter += 1;
  return `Foaie 3B ${label} ${runMarker} ${fixtureCounter}`;
}

async function verifyRow(client, table, id, columns, testName) {
  const result = await client.from(table).select(columns).eq("id", id);
  assertNoError(result.error, testName, "verification read failed");
  assert(result.data.length === 1, testName, "expected row was not preserved");
  return result.data[0];
}

async function insertEdition(client, owner, values, testName) {
  const result = await client
    .from("editions")
    .insert({
      work_id: workAId,
      format: "PHYSICAL",
      edition_title: editionTitle(testName),
      ...values,
    })
    .select("*");
  assertNoError(result.error, testName, "allowed edition insert failed");
  assert(result.data.length === 1, testName, "inserted edition was not returned");
  (owner === "A" ? editionIdsA : editionIdsB).push(result.data[0].id);
  return result.data[0];
}

async function assertEditionRejected(client, values, code, testName) {
  const title = editionTitle(testName);
  const result = await client
    .from("editions")
    .insert({ work_id: workAId, format: "PHYSICAL", edition_title: title, ...values })
    .select("id");
  assertCode(result, code, testName, `expected database rejection ${code}`);
  const verification = await userAClient
    .from("editions")
    .select("id")
    .eq("edition_title", title);
  assertNoError(verification.error, testName, "rejection verification failed");
  assert(verification.data.length === 0, testName, "rejected edition persisted");
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

  await runTest("1. anon cannot read publishers", async () => {
    const result = await anonClient.from("publishers").select("id").limit(1);
    assertDeniedOrEmpty(result, "1. anon cannot read publishers", "anonymous publisher read exposed rows");
  });

  await runTest("2. anon cannot read editions", async () => {
    const result = await anonClient.from("editions").select("id").limit(1);
    assertDeniedOrEmpty(result, "2. anon cannot read editions", "anonymous edition read exposed rows");
  });

  const originalPublisherName = `  FOAIE   PRESS\t${runMarker}  `;
  const normalizedPublisherName = `foaie press ${runMarker}`;
  const revisedPublisherName = `Foaie Press Revised ${runMarker}`;

  await runTest("3. A creates a publisher", async () => {
    const result = await userAClient
      .from("publishers")
      .insert({ name: originalPublisherName })
      .select("id, name, normalized_name, created_by_profile_id, created_at, updated_at");
    assertNoError(result.error, "3. A creates a publisher", "allowed publisher insert failed");
    assert(result.data.length === 1, "3. A creates a publisher", "publisher was not returned");
    publisherAId = result.data[0].id;
    publisherIdsA.push(publisherAId);
    assert(
      result.data[0].created_by_profile_id === userAId,
      "3. A creates a publisher",
      "database did not assign A as creator",
    );
  });

  await runTest("4. normalized_name is generated", async () => {
    const row = await verifyRow(
      userAClient,
      "publishers",
      publisherAId,
      "id, normalized_name",
      "4. normalized_name is generated",
    );
    assert(
      row.normalized_name === normalizedPublisherName,
      "4. normalized_name is generated",
      "publisher name normalization was incorrect",
    );
  });

  await runTest("5. B reads A publisher", async () => {
    await verifyRow(userBClient, "publishers", publisherAId, "id", "5. B reads A publisher");
  });

  await runTest("6. B cannot update A publisher", async () => {
    const attempted = await userBClient
      .from("publishers")
      .update({ name: `Unauthorized ${runMarker}` })
      .eq("id", publisherAId)
      .select("id");
    assertDeniedOrEmpty(attempted, "6. B cannot update A publisher", "cross-user update succeeded");
    const row = await verifyRow(
      userAClient,
      "publishers",
      publisherAId,
      "id, name",
      "6. B cannot update A publisher",
    );
    assert(row.name === originalPublisherName, "6. B cannot update A publisher", "publisher changed");
  });

  await runTest("7. B cannot delete A publisher", async () => {
    const attempted = await userBClient
      .from("publishers")
      .delete()
      .eq("id", publisherAId)
      .select("id");
    assertDeniedOrEmpty(attempted, "7. B cannot delete A publisher", "cross-user delete succeeded");
    await verifyRow(userAClient, "publishers", publisherAId, "id", "7. B cannot delete A publisher");
  });

  await runTest("8. A updates own publisher and updated_at", async () => {
    const before = await verifyRow(
      userAClient,
      "publishers",
      publisherAId,
      "id, updated_at",
      "8. A updates own publisher and updated_at",
    );
    await wait(20);
    const result = await userAClient
      .from("publishers")
      .update({ name: revisedPublisherName })
      .eq("id", publisherAId)
      .select("id, name, updated_at");
    assertNoError(result.error, "8. A updates own publisher and updated_at", "allowed update failed");
    assert(
      result.data.length === 1 &&
        result.data[0].name === revisedPublisherName &&
        Date.parse(result.data[0].updated_at) > Date.parse(before.updated_at),
      "8. A updates own publisher and updated_at",
      "publisher or timestamp did not update",
    );
  });

  await runTest("9. A cannot forge publisher creator", async () => {
    const attempted = await userAClient
      .from("publishers")
      .insert({ name: `Forged publisher ${runMarker}`, created_by_profile_id: userBId })
      .select("id");
    assertCode(attempted, "42501", "9. A cannot forge publisher creator", "protected creator was writable");
  });

  await runTest("10. A cannot change publisher creator", async () => {
    const attempted = await userAClient
      .from("publishers")
      .update({ created_by_profile_id: userBId })
      .eq("id", publisherAId)
      .select("id");
    assertCode(attempted, "42501", "10. A cannot change publisher creator", "protected creator was writable");
    const row = await verifyRow(
      userAClient,
      "publishers",
      publisherAId,
      "id, created_by_profile_id",
      "10. A cannot change publisher creator",
    );
    assert(row.created_by_profile_id === userAId, "10. A cannot change publisher creator", "creator changed");
  });

  const workA = await userAClient
    .from("works")
    .insert({ title: `Foaie 3B work A ${runMarker}` })
    .select("id");
  assertNoError(workA.error, "setup work A", "could not create work A");
  workAId = workA.data[0].id;
  workIdsA.push(workAId);

  const workB = await userBClient
    .from("works")
    .insert({ title: `Foaie 3B work B ${runMarker}` })
    .select("id");
  assertNoError(workB.error, "setup work B", "could not create work B");
  workBId = workB.data[0].id;
  workIdsB.push(workBId);

  let editionAId;
  await runTest("11. A creates an edition on own work", async () => {
    const row = await insertEdition(
      userAClient,
      "A",
      { publisher_id: publisherAId },
      "11. A creates an edition on own work",
    );
    editionAId = row.id;
    assert(row.created_by_profile_id === userAId, "11. A creates an edition on own work", "creator incorrect");
  });

  await runTest("12. B reads A edition", async () => {
    await verifyRow(userBClient, "editions", editionAId, "id", "12. B reads A edition");
  });

  await runTest("13. B cannot update A edition", async () => {
    const attempted = await userBClient
      .from("editions")
      .update({ subtitle: `Unauthorized ${runMarker}` })
      .eq("id", editionAId)
      .select("id");
    assertDeniedOrEmpty(attempted, "13. B cannot update A edition", "cross-user update succeeded");
    const row = await verifyRow(userAClient, "editions", editionAId, "id, subtitle", "13. B cannot update A edition");
    assert(row.subtitle === null, "13. B cannot update A edition", "edition changed");
  });

  await runTest("14. B cannot delete A edition", async () => {
    const attempted = await userBClient.from("editions").delete().eq("id", editionAId).select("id");
    assertDeniedOrEmpty(attempted, "14. B cannot delete A edition", "cross-user delete succeeded");
    await verifyRow(userAClient, "editions", editionAId, "id", "14. B cannot delete A edition");
  });

  await runTest("15. A updates own edition and updated_at", async () => {
    const before = await verifyRow(userAClient, "editions", editionAId, "id, updated_at", "15. A updates own edition and updated_at");
    await wait(20);
    const result = await userAClient
      .from("editions")
      .update({ subtitle: `Revised ${runMarker}` })
      .eq("id", editionAId)
      .select("id, subtitle, updated_at");
    assertNoError(result.error, "15. A updates own edition and updated_at", "allowed update failed");
    assert(
      result.data.length === 1 && Date.parse(result.data[0].updated_at) > Date.parse(before.updated_at),
      "15. A updates own edition and updated_at",
      "edition timestamp did not update",
    );
  });

  let editionBId;
  await runTest("16. B creates edition on A work", async () => {
    const row = await insertEdition(userBClient, "B", {}, "16. B creates edition on A work");
    editionBId = row.id;
    assert(row.work_id === workAId && row.created_by_profile_id === userBId, "16. B creates edition on A work", "shared catalog contribution failed");
  });

  await runTest("17. B reuses A publisher", async () => {
    const result = await userBClient
      .from("editions")
      .update({ publisher_id: publisherAId })
      .eq("id", editionBId)
      .select("id, publisher_id");
    assertNoError(result.error, "17. B reuses A publisher", "publisher reuse failed");
    assert(result.data[0]?.publisher_id === publisherAId, "17. B reuses A publisher", "publisher was not linked");
  });

  await runTest("18. A cannot forge edition creator", async () => {
    const attempted = await userAClient
      .from("editions")
      .insert({ work_id: workAId, format: "PHYSICAL", created_by_profile_id: userBId })
      .select("id");
    assertCode(attempted, "42501", "18. A cannot forge edition creator", "protected creator was writable");
  });

  await runTest("19. A cannot change edition creator", async () => {
    const attempted = await userAClient
      .from("editions")
      .update({ created_by_profile_id: userBId })
      .eq("id", editionAId)
      .select("id");
    assertCode(attempted, "42501", "19. A cannot change edition creator", "protected creator was writable");
    const row = await verifyRow(userAClient, "editions", editionAId, "id, created_by_profile_id", "19. A cannot change edition creator");
    assert(row.created_by_profile_id === userAId, "19. A cannot change edition creator", "creator changed");
  });

  await runTest("20. edition work_id cannot change", async () => {
    const attempted = await userAClient
      .from("editions")
      .update({ work_id: workBId })
      .eq("id", editionAId)
      .select("id");
    assertCode(attempted, "42501", "20. edition work_id cannot change", "protected work_id was writable");
    const row = await verifyRow(userAClient, "editions", editionAId, "id, work_id", "20. edition work_id cannot change");
    assert(row.work_id === workAId, "20. edition work_id cannot change", "edition moved to another work");
  });

  await runTest("21. formatted ISBN-10 is normalized and derives ISBN-13", async () => {
    const isbn10 = createIsbn10();
    const row = await insertEdition(userAClient, "A", { isbn10: formatIsbn10(isbn10) }, "21. formatted ISBN-10 is normalized and derives ISBN-13");
    assert(row.isbn10 === isbn10 && row.isbn13 === isbn13FromIsbn10(isbn10), "21. formatted ISBN-10 is normalized and derives ISBN-13", "ISBN normalization or derivation failed");
  });

  await runTest("22. valid ISBN-10 ending X is accepted", async () => {
    const isbn10 = createIsbn10(true);
    const row = await insertEdition(userAClient, "A", { isbn10 }, "22. valid ISBN-10 ending X is accepted");
    assert(row.isbn10 === isbn10 && row.isbn13 === isbn13FromIsbn10(isbn10), "22. valid ISBN-10 ending X is accepted", "X checksum ISBN was not preserved");
  });

  await runTest("23. invalid ISBN-10 checksum is rejected", async () => {
    await assertEditionRejected(userAClient, { isbn10: invalidateChecksum(createIsbn10()) }, "23514", "23. invalid ISBN-10 checksum is rejected");
  });

  await runTest("24. valid ISBN-13 978 is accepted", async () => {
    const isbn13 = createIsbn13("978");
    const row = await insertEdition(userAClient, "A", { isbn13 }, "24. valid ISBN-13 978 is accepted");
    assert(row.isbn13 === isbn13, "24. valid ISBN-13 978 is accepted", "ISBN-13 changed");
  });

  await runTest("25. valid ISBN-13 979 does not create ISBN-10", async () => {
    const isbn13 = createIsbn13("979");
    const row = await insertEdition(userAClient, "A", { isbn13 }, "25. valid ISBN-13 979 does not create ISBN-10");
    assert(row.isbn13 === isbn13 && row.isbn10 === null, "25. valid ISBN-13 979 does not create ISBN-10", "979 handling was incorrect");
  });

  await runTest("26. invalid ISBN-13 checksum is rejected", async () => {
    await assertEditionRejected(userAClient, { isbn13: invalidateChecksum(createIsbn13()) }, "23514", "26. invalid ISBN-13 checksum is rejected");
  });

  await runTest("27. non-ISBN EAN prefix is rejected", async () => {
    await assertEditionRejected(userAClient, { isbn13: createIsbn13("977") }, "23514", "27. non-ISBN EAN prefix is rejected");
  });

  await runTest("28. equivalent ISBN-10 and ISBN-13 are accepted", async () => {
    const isbn10 = createIsbn10();
    const isbn13 = isbn13FromIsbn10(isbn10);
    const row = await insertEdition(userAClient, "A", { isbn10, isbn13 }, "28. equivalent ISBN-10 and ISBN-13 are accepted");
    assert(row.isbn10 === isbn10 && row.isbn13 === isbn13, "28. equivalent ISBN-10 and ISBN-13 are accepted", "equivalent pair changed");
  });

  await runTest("29. mismatched ISBN pair is rejected", async () => {
    const isbn10 = createIsbn10();
    let isbn13 = createIsbn13("978");
    while (isbn13 === isbn13FromIsbn10(isbn10)) isbn13 = createIsbn13("978");
    await assertEditionRejected(userAClient, { isbn10, isbn13 }, "23514", "29. mismatched ISBN pair is rejected");
  });

  await runTest("30. duplicate ISBN-10 is rejected", async () => {
    const isbn10 = createIsbn10();
    await insertEdition(userAClient, "A", { isbn10 }, "30. duplicate ISBN-10 fixture");
    await assertEditionRejected(userAClient, { isbn10 }, "23505", "30. duplicate ISBN-10 is rejected");
  });

  await runTest("31. duplicate ISBN-13 is rejected", async () => {
    const isbn13 = createIsbn13("979");
    await insertEdition(userAClient, "A", { isbn13 }, "31. duplicate ISBN-13 fixture");
    await assertEditionRejected(userAClient, { isbn13 }, "23505", "31. duplicate ISBN-13 is rejected");
  });

  await runTest("32. cross ISBN-10 to ISBN-13 duplicate is rejected", async () => {
    const isbn10 = createIsbn10();
    const first = await insertEdition(userAClient, "A", { isbn10 }, "32. cross duplicate fixture");
    await assertEditionRejected(userAClient, { isbn13: first.isbn13 }, "23505", "32. cross ISBN-10 to ISBN-13 duplicate is rejected");
  });

  await runTest("33. multiple editions without ISBN are accepted", async () => {
    const first = await insertEdition(userAClient, "A", {}, "33. no ISBN first");
    const second = await insertEdition(userAClient, "A", {}, "33. no ISBN second");
    assert(first.isbn10 === null && second.isbn13 === null, "33. multiple editions without ISBN are accepted", "ISBN was unexpectedly generated");
  });

  for (const [number, format] of [[34, "PHYSICAL"], [35, "EBOOK"], [36, "AUDIOBOOK"]]) {
    await runTest(`${number}. ${format} is accepted`, async () => {
      const row = await insertEdition(userAClient, "A", { format }, `${number}. ${format} is accepted`);
      assert(row.format === format, `${number}. ${format} is accepted`, "format was not stored");
    });
  }

  await runTest("37. unknown format is rejected", async () => {
    await assertEditionRejected(userAClient, { format: "SCROLL" }, "23514", "37. unknown format is rejected");
  });
  await runTest("38. page_count zero is rejected", async () => {
    await assertEditionRejected(userAClient, { page_count: 0 }, "23514", "38. page_count zero is rejected");
  });
  await runTest("39. negative page_count is rejected", async () => {
    await assertEditionRejected(userAClient, { page_count: -1 }, "23514", "39. negative page_count is rejected");
  });
  await runTest("40. zero audio duration is rejected", async () => {
    await assertEditionRejected(userAClient, { audio_duration_minutes: 0 }, "23514", "40. zero audio duration is rejected");
  });
  await runTest("41. negative audio duration is rejected", async () => {
    await assertEditionRejected(userAClient, { audio_duration_minutes: -1 }, "23514", "41. negative audio duration is rejected");
  });

  await runTest("42. null publication date and precision are accepted", async () => {
    const row = await insertEdition(userAClient, "A", { publication_date: null, publication_date_precision: null }, "42. null publication date and precision are accepted");
    assert(row.publication_date === null && row.publication_date_precision === null, "42. null publication date and precision are accepted", "null date pair changed");
  });
  await runTest("43. valid YEAR precision is accepted", async () => {
    await insertEdition(userAClient, "A", { publication_date: "2020-01-01", publication_date_precision: "YEAR" }, "43. valid YEAR precision is accepted");
  });
  await runTest("44. YEAR with non-January month is rejected", async () => {
    await assertEditionRejected(userAClient, { publication_date: "2020-02-01", publication_date_precision: "YEAR" }, "23514", "44. YEAR with non-January month is rejected");
  });
  await runTest("45. YEAR with non-first day is rejected", async () => {
    await assertEditionRejected(userAClient, { publication_date: "2020-01-02", publication_date_precision: "YEAR" }, "23514", "45. YEAR with non-first day is rejected");
  });
  await runTest("46. valid MONTH precision is accepted", async () => {
    await insertEdition(userAClient, "A", { publication_date: "2020-05-01", publication_date_precision: "MONTH" }, "46. valid MONTH precision is accepted");
  });
  await runTest("47. MONTH with non-first day is rejected", async () => {
    await assertEditionRejected(userAClient, { publication_date: "2020-05-02", publication_date_precision: "MONTH" }, "23514", "47. MONTH with non-first day is rejected");
  });
  await runTest("48. DAY with complete date is accepted", async () => {
    await insertEdition(userAClient, "A", { publication_date: "2020-05-17", publication_date_precision: "DAY" }, "48. DAY with complete date is accepted");
  });
  await runTest("49. date without precision is rejected", async () => {
    await assertEditionRejected(userAClient, { publication_date: "2020-05-17" }, "23514", "49. date without precision is rejected");
  });
  await runTest("50. precision without date is rejected", async () => {
    await assertEditionRejected(userAClient, { publication_date_precision: "DAY" }, "23514", "50. precision without date is rejected");
  });
  await runTest("51. unknown date precision is rejected", async () => {
    await assertEditionRejected(userAClient, { publication_date: "2020-05-17", publication_date_precision: "WEEK" }, "23514", "51. unknown date precision is rejected");
  });

  await runTest("52. edition without cover is accepted", async () => {
    const row = await insertEdition(userAClient, "A", {}, "52. edition without cover is accepted");
    assert(row.cover_url === null && row.cover_storage_key === null, "52. edition without cover is accepted", "cover was unexpectedly set");
  });
  await runTest("53. cover_url alone is accepted", async () => {
    const row = await insertEdition(userAClient, "A", { cover_url: `https://example.invalid/${runMarker}.jpg` }, "53. cover_url alone is accepted");
    assert(Boolean(row.cover_url) && row.cover_storage_key === null, "53. cover_url alone is accepted", "cover URL handling failed");
  });
  await runTest("54. cover_storage_key alone is accepted", async () => {
    const row = await insertEdition(userAClient, "A", { cover_storage_key: `tests/${runMarker}.jpg` }, "54. cover_storage_key alone is accepted");
    assert(row.cover_url === null && Boolean(row.cover_storage_key), "54. cover_storage_key alone is accepted", "storage cover handling failed");
  });
  await runTest("55. two cover sources are rejected", async () => {
    await assertEditionRejected(userAClient, { cover_url: "https://example.invalid/a.jpg", cover_storage_key: `tests/${runMarker}.jpg` }, "23514", "55. two cover sources are rejected");
  });
  await runTest("56. blank cover_url is rejected", async () => {
    await assertEditionRejected(userAClient, { cover_url: "   " }, "23514", "56. blank cover_url is rejected");
  });
  await runTest("57. blank cover_storage_key is rejected", async () => {
    await assertEditionRejected(userAClient, { cover_storage_key: "   " }, "23514", "57. blank cover_storage_key is rejected");
  });

  await runTest("58. referenced publisher cannot be deleted", async () => {
    const attempted = await userAClient.from("publishers").delete().eq("id", publisherAId).select("id");
    assertCode(attempted, "23503", "58. referenced publisher cannot be deleted", "publisher FK did not restrict deletion");
    await verifyRow(userAClient, "publishers", publisherAId, "id", "58. referenced publisher cannot be deleted");
  });
  await runTest("59. work with edition cannot be deleted", async () => {
    const attempted = await userAClient.from("works").delete().eq("id", workAId).select("id");
    assertCode(attempted, "23503", "59. work with edition cannot be deleted", "work FK did not restrict deletion");
    await verifyRow(userAClient, "works", workAId, "id", "59. work with edition cannot be deleted");
  });
  await runTest("60. unreferenced publisher can be deleted", async () => {
    const created = await userAClient
      .from("publishers")
      .insert({ name: `Disposable publisher ${runMarker}` })
      .select("id");
    assertNoError(created.error, "60. unreferenced publisher can be deleted", "fixture creation failed");
    const id = created.data[0].id;
    publisherIdsA.push(id);
    const deleted = await userAClient.from("publishers").delete().eq("id", id).select("id");
    assertNoError(deleted.error, "60. unreferenced publisher can be deleted", "allowed delete failed");
    assert(deleted.data.length === 1, "60. unreferenced publisher can be deleted", "publisher was not deleted");
    publisherIdsA.splice(publisherIdsA.indexOf(id), 1);
  });
  await runTest("61. publisher id cannot be supplied", async () => {
    const attempted = await userAClient
      .from("publishers")
      .insert({ id: randomUUID(), name: `Explicit id ${runMarker}` })
      .select("id");
    assertCode(attempted, "42501", "61. publisher id cannot be supplied", "publisher id was writable");
  });
  await runTest("62. timestamps cannot be written directly", async () => {
    const attempted = await userAClient
      .from("publishers")
      .insert({ name: `Explicit timestamp ${runMarker}`, created_at: new Date().toISOString() })
      .select("id");
    assertCode(attempted, "42501", "62. timestamps cannot be written directly", "timestamp was writable");
  });
  await runTest("63. edition id cannot be modified", async () => {
    const attempted = await userAClient
      .from("editions")
      .update({ id: randomUUID() })
      .eq("id", editionAId)
      .select("id");
    assertCode(attempted, "42501", "63. edition id cannot be modified", "edition id was writable");
    await verifyRow(userAClient, "editions", editionAId, "id", "63. edition id cannot be modified");
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

  if (editionIdsA.length) {
    await cleanup(await userAClient.from("editions").delete().in("id", editionIdsA), "A editions were not removed");
  }
  if (editionIdsB.length) {
    await cleanup(await userBClient.from("editions").delete().in("id", editionIdsB), "B editions were not removed");
  }
  if (publisherIdsA.length) {
    await cleanup(await userAClient.from("publishers").delete().in("id", publisherIdsA), "A publishers were not removed");
  }
  if (publisherIdsB.length) {
    await cleanup(await userBClient.from("publishers").delete().in("id", publisherIdsB), "B publishers were not removed");
  }
  if (workIdsA.length) {
    await cleanup(await userAClient.from("works").delete().in("id", workIdsA), "A works were not removed");
  }
  if (workIdsB.length) {
    await cleanup(await userBClient.from("works").delete().in("id", workIdsB), "B works were not removed");
  }

  if (userAId) {
    const remainingEditions = await userAClient.from("editions").select("id").ilike("edition_title", `%${runMarker}%`);
    const remainingPublishers = await userAClient.from("publishers").select("id").ilike("name", `%${runMarker}%`);
    const remainingWorks = await userAClient.from("works").select("id").ilike("title", `%${runMarker}%`);
    if (
      remainingEditions.error || remainingPublishers.error || remainingWorks.error ||
      remainingEditions.data.length || remainingPublishers.data.length || remainingWorks.data.length
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

if (testsRun === 63 && testsPassed === 63 && cleanupSucceeded && !process.exitCode) {
  console.log("63/63 tests passed");
  console.log("Cleanup verified: no publisher, edition, or work test rows remain");
}
