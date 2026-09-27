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
    this.code = typeof code === "string" && /^[A-Z0-9_]{2,30}$/.test(code) ? code : undefined;
  }
}

function assert(condition, testName, description, code) {
  if (!condition) throw new SafeTestError(testName, description, code);
}

function assertNoError(error, testName, description) {
  if (error) throw new SafeTestError(testName, description, error.code);
}

function assertPermissionDenied(result, testName, description) {
  assert(result.error?.code === "42501", testName, description, result.error?.code);
}

function createTestClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}

async function authenticate(client, email, password, testName) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assertNoError(error, testName, "authentication or network setup failed");
  assert(Boolean(data.user?.id), testName, "authenticated user was not returned");
  return data.user.id;
}

let testsRun = 0;
let testsPassed = 0;

async function runTest(name, test) {
  testsRun += 1;
  await test();
  testsPassed += 1;
  console.log(`PASS  ${name}`);
}

for (const name of requiredEnvironmentVariables) {
  if (!process.env[name]?.trim()) {
    console.error("FAIL  setup [MISSING_ENV]: required test configuration is missing");
    process.exit(1);
  }
}

const anonClient = createTestClient();
const userAClient = createTestClient();
const userBClient = createTestClient();
const marker = randomUUID().replaceAll("-", "").slice(0, 16);

let userAId;
let userBId;
let workId;
let editionId;
let relationAId;
let relationBId;
let cleanupSucceeded = true;

async function readOwnRelation(client, relationId, testName) {
  const result = await client
    .from("user_editions")
    .select("id, user_id, edition_id, created_at")
    .eq("id", relationId);
  assertNoError(result.error, testName, "membership verification failed");
  return result.data;
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

  const work = await userAClient
    .from("works")
    .insert({ title: `Library RLS fixture ${marker}` })
    .select("id")
    .single();
  assertNoError(work.error, "setup work fixture", "work fixture creation failed");
  workId = work.data.id;

  const edition = await userAClient
    .from("editions")
    .insert({ work_id: workId, format: "PHYSICAL" })
    .select("id")
    .single();
  assertNoError(edition.error, "setup edition fixture", "edition fixture creation failed");
  editionId = edition.data.id;

  await runTest("1. A adds an edition using only edition_id", async () => {
    const result = await userAClient
      .from("user_editions")
      .insert({ edition_id: editionId })
      .select("id, user_id, edition_id, created_at")
      .single();
    assertNoError(result.error, "1. A adds an edition using only edition_id", "allowed insert failed");
    relationAId = result.data.id;
    assert(result.data.user_id === userAId, "1. A adds an edition using only edition_id", "user default was incorrect");
    assert(result.data.edition_id === editionId, "1. A adds an edition using only edition_id", "edition was incorrect");
    assert(Boolean(result.data.id), "1. A adds an edition using only edition_id", "id default was missing");
    assert(Boolean(result.data.created_at), "1. A adds an edition using only edition_id", "created_at default was missing");
  });

  await runTest("2. A reads its own membership", async () => {
    const rows = await readOwnRelation(userAClient, relationAId, "2. A reads its own membership");
    assert(rows.length === 1, "2. A reads its own membership", "A membership was not visible");
  });

  await runTest("3. B cannot read A membership", async () => {
    const rows = await readOwnRelation(userBClient, relationAId, "3. B cannot read A membership");
    assert(rows.length === 0, "3. B cannot read A membership", "A membership leaked to B");
  });

  await runTest("4. B adds the same edition", async () => {
    const result = await userBClient
      .from("user_editions")
      .insert({ edition_id: editionId })
      .select("id, user_id, edition_id")
      .single();
    assertNoError(result.error, "4. B adds the same edition", "B insert failed");
    relationBId = result.data.id;
    assert(result.data.user_id === userBId, "4. B adds the same edition", "B user default was incorrect");
    assert(result.data.edition_id === editionId, "4. B adds the same edition", "B edition was incorrect");
  });

  await runTest("5. A and B each see only their own membership", async () => {
    const [rowsA, rowsB] = await Promise.all([
      userAClient.from("user_editions").select("id, user_id").eq("edition_id", editionId),
      userBClient.from("user_editions").select("id, user_id").eq("edition_id", editionId),
    ]);
    assertNoError(rowsA.error, "5. A and B each see only their own membership", "A privacy read failed");
    assertNoError(rowsB.error, "5. A and B each see only their own membership", "B privacy read failed");
    assert(rowsA.data.length === 1 && rowsA.data[0].id === relationAId, "5. A and B each see only their own membership", "A saw an incorrect membership set");
    assert(rowsB.data.length === 1 && rowsB.data[0].id === relationBId, "5. A and B each see only their own membership", "B saw an incorrect membership set");
  });

  await runTest("6. duplicate A membership is rejected", async () => {
    const result = await userAClient.from("user_editions").insert({ edition_id: editionId }).select("id");
    assert(result.error?.code === "23505", "6. duplicate A membership is rejected", "duplicate was not rejected", result.error?.code);
    const rows = await userAClient.from("user_editions").select("id").eq("edition_id", editionId);
    assertNoError(rows.error, "6. duplicate A membership is rejected", "duplicate verification failed");
    assert(rows.data.length === 1, "6. duplicate A membership is rejected", "A has an incorrect membership count");
  });

  await runTest("7. A cannot forge user_id", async () => {
    const result = await userAClient
      .from("user_editions")
      .insert({ edition_id: editionId, user_id: userBId })
      .select("id");
    assertPermissionDenied(result, "7. A cannot forge user_id", "protected user_id was accepted");
    const rows = await userBClient.from("user_editions").select("id").eq("edition_id", editionId);
    assertNoError(rows.error, "7. A cannot forge user_id", "forgery verification failed");
    assert(rows.data.length === 1 && rows.data[0].id === relationBId, "7. A cannot forge user_id", "forged row was created");
  });

  await runTest("8. UPDATE is denied and membership remains intact", async () => {
    const result = await userAClient
      .from("user_editions")
      .update({ edition_id: editionId })
      .eq("id", relationAId)
      .select("id");
    assertPermissionDenied(result, "8. UPDATE is denied and membership remains intact", "UPDATE was not denied");
    const rows = await readOwnRelation(userAClient, relationAId, "8. UPDATE is denied and membership remains intact");
    assert(rows.length === 1 && rows[0].edition_id === editionId, "8. UPDATE is denied and membership remains intact", "membership changed after denied UPDATE");
  });

  await runTest("9. B cannot delete A membership", async () => {
    const result = await userBClient.from("user_editions").delete().eq("id", relationAId).select("id");
    assertNoError(result.error, "9. B cannot delete A membership", "cross-user delete returned an unexpected error");
    assert(result.data.length === 0, "9. B cannot delete A membership", "B deleted A membership");
    const rows = await readOwnRelation(userAClient, relationAId, "9. B cannot delete A membership");
    assert(rows.length === 1, "9. B cannot delete A membership", "A membership did not remain intact");
  });

  await runTest("10. referenced edition deletion is restricted", async () => {
    const result = await userAClient.from("editions").delete().eq("id", editionId).select("id");
    assert(result.error?.code === "23503", "10. referenced edition deletion is restricted", "edition deletion was not restricted", result.error?.code);
    const [editionRows, rowsA, rowsB] = await Promise.all([
      userAClient.from("editions").select("id").eq("id", editionId),
      readOwnRelation(userAClient, relationAId, "10. referenced edition deletion is restricted"),
      readOwnRelation(userBClient, relationBId, "10. referenced edition deletion is restricted"),
    ]);
    assertNoError(editionRows.error, "10. referenced edition deletion is restricted", "edition verification failed");
    assert(editionRows.data.length === 1, "10. referenced edition deletion is restricted", "edition disappeared after restricted delete");
    assert(rowsA.length === 1 && rowsB.length === 1, "10. referenced edition deletion is restricted", "memberships changed after restricted delete");
  });

  await runTest("11. anon cannot SELECT memberships", async () => {
    const result = await anonClient.from("user_editions").select("id").limit(1);
    assertPermissionDenied(result, "11. anon cannot SELECT memberships", "anonymous SELECT was not denied");
  });

  await runTest("12. anon cannot INSERT memberships", async () => {
    const result = await anonClient.from("user_editions").insert({ edition_id: editionId }).select("id");
    assertPermissionDenied(result, "12. anon cannot INSERT memberships", "anonymous INSERT was not denied");
  });

  await runTest("13. anon cannot DELETE memberships", async () => {
    const result = await anonClient.from("user_editions").delete().eq("id", relationAId).select("id");
    assertPermissionDenied(result, "13. anon cannot DELETE memberships", "anonymous DELETE was not denied");
  });

  await runTest("14. A removes only its own membership", async () => {
    const result = await userAClient.from("user_editions").delete().eq("id", relationAId).select("id");
    assertNoError(result.error, "14. A removes only its own membership", "A delete failed");
    assert(result.data.length === 1, "14. A removes only its own membership", "A membership was not deleted");
    relationAId = undefined;
    const rowsB = await readOwnRelation(userBClient, relationBId, "14. A removes only its own membership");
    assert(rowsB.length === 1, "14. A removes only its own membership", "B membership was removed with A membership");
  });

  await runTest("15. B removes its own membership", async () => {
    const result = await userBClient.from("user_editions").delete().eq("id", relationBId).select("id");
    assertNoError(result.error, "15. B removes its own membership", "B delete failed");
    assert(result.data.length === 1, "15. B removes its own membership", "B membership was not deleted");
    relationBId = undefined;
    const [rowsA, rowsB] = await Promise.all([
      userAClient.from("user_editions").select("id").eq("edition_id", editionId),
      userBClient.from("user_editions").select("id").eq("edition_id", editionId),
    ]);
    assertNoError(rowsA.error, "15. B removes its own membership", "A zero-count verification failed");
    assertNoError(rowsB.error, "15. B removes its own membership", "B zero-count verification failed");
    assert(rowsA.data.length === 0 && rowsB.data.length === 0, "15. B removes its own membership", "memberships remain after both deletes");
  });

  await runTest("16. edition is deletable after the last membership", async () => {
    const result = await userAClient.from("editions").delete().eq("id", editionId).select("id");
    assertNoError(result.error, "16. edition is deletable after the last membership", "edition remained blocked");
    assert(result.data.length === 1, "16. edition is deletable after the last membership", "edition was not deleted");
  });
} catch (error) {
  const safeError = error instanceof SafeTestError
    ? error
    : new SafeTestError("setup", "unexpected integration test failure", error?.code);
  console.error(`FAIL  ${safeError.testName}${safeError.code ? ` [${safeError.code}]` : ""}: ${safeError.message}`);
  process.exitCode = 1;
} finally {
  const cleanupErrors = [];

  async function cleanup(result, description) {
    if (result.error) cleanupErrors.push({ description, code: result.error.code });
  }

  if (editionId) {
    await cleanup(
      await userAClient.from("user_editions").delete().eq("edition_id", editionId),
      "A memberships were not removed",
    );
    await cleanup(
      await userBClient.from("user_editions").delete().eq("edition_id", editionId),
      "B memberships were not removed",
    );
    await cleanup(await userAClient.from("editions").delete().eq("id", editionId), "edition fixture was not removed");
  }
  if (workId) {
    await cleanup(await userAClient.from("works").delete().eq("id", workId), "work fixture was not removed");
  }

  if (workId && userAId) {
    const [memberships, editions, works] = await Promise.all([
      userAClient.from("user_editions").select("id").eq("edition_id", editionId),
      userAClient.from("editions").select("id").eq("work_id", workId),
      userAClient.from("works").select("id").eq("id", workId),
    ]);
    if (
      memberships.error || editions.error || works.error ||
      memberships.data.length > 0 || editions.data.length > 0 || works.data.length > 0
    ) {
      cleanupErrors.push({ description: "test fixtures remain after cleanup" });
    }
  }

  cleanupSucceeded = cleanupErrors.length === 0;
  for (const cleanupError of cleanupErrors) {
    const code = typeof cleanupError.code === "string" ? ` [${cleanupError.code}]` : "";
    console.error(`FAIL  cleanup${code}: ${cleanupError.description}`);
  }
  if (!cleanupSucceeded) process.exitCode = 1;
  await Promise.all([
    userAClient.auth.signOut({ scope: "local" }),
    userBClient.auth.signOut({ scope: "local" }),
  ]);
}

if (testsRun === 16 && testsPassed === 16 && cleanupSucceeded && !process.exitCode) {
  console.log("16/16 user_editions RLS integration tests passed");
  console.log("Cleanup verified: no user_editions, edition, or work test rows remain");
}
