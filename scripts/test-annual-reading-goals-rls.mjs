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
    this.code = typeof code === "string" && /^[A-Z0-9_]{2,30}$/.test(code)
      ? code
      : undefined;
  }
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

function assertPermissionDenied(result, testName, description) {
  assertCode(result, "42501", testName, description);
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
  assert(Boolean(data.user?.id), testName, "authenticated identity was not returned");
  return data.user.id;
}

let testsRun = 0;
let testsPassed = 0;

async function runTest(name, operation) {
  testsRun += 1;
  await operation();
  testsPassed += 1;
  console.log(`PASS  ${testsRun}. ${name}`);
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
const marker = randomUUID().replaceAll("-", "");
const testYear = 2_000_000_000 + (Number.parseInt(marker.slice(0, 7), 16) % 100_000_000);

let userAId;
let userBId;
let goalId;
let cleanupSucceeded = false;

async function readGoal(client, id, testName) {
  const result = await client
    .from("annual_reading_goals")
    .select("id, user_id, year, target_count, created_at, updated_at")
    .eq("id", id);
  assertNoError(result.error, testName, "goal verification failed");
  return result.data;
}

try {
  userAId = await authenticate(
    userAClient,
    process.env.FOAIE_TEST_USER_A_EMAIL,
    process.env.FOAIE_TEST_USER_A_PASSWORD,
    "user A authentication",
  );
  userBId = await authenticate(
    userBClient,
    process.env.FOAIE_TEST_USER_B_EMAIL,
    process.env.FOAIE_TEST_USER_B_PASSWORD,
    "user B authentication",
  );

  const existing = await userAClient
    .from("annual_reading_goals")
    .select("id")
    .eq("year", testYear);
  assertNoError(existing.error, "fixture collision check", "fixture collision check failed");
  assert(existing.data.length === 0, "fixture collision check", "generated test year already exists");

  await runTest("A creates a goal using only year and target_count", async () => {
    const result = await userAClient
      .from("annual_reading_goals")
      .insert({ year: testYear, target_count: 12 })
      .select("id, user_id, year, target_count, created_at, updated_at")
      .single();
    assertNoError(result.error, "own INSERT", "allowed INSERT failed");
    goalId = result.data.id;
    assert(result.data.user_id === userAId, "own INSERT", "auth.uid() default was incorrect");
    assert(result.data.year === testYear, "own INSERT", "year was incorrect");
    assert(result.data.target_count === 12, "own INSERT", "target_count was incorrect");
    assert(Boolean(result.data.id), "own INSERT", "id default was missing");
    assert(Boolean(result.data.created_at), "own INSERT", "created_at default was missing");
    assert(Boolean(result.data.updated_at), "own INSERT", "updated_at default was missing");
  });

  await runTest("A reads its own goal", async () => {
    const rows = await readGoal(userAClient, goalId, "own SELECT");
    assert(rows.length === 1, "own SELECT", "A goal was not visible");
  });

  await runTest("B cannot read A goal", async () => {
    const rows = await readGoal(userBClient, goalId, "isolated SELECT");
    assert(rows.length === 0, "isolated SELECT", "A goal leaked to B");
  });

  await runTest("A cannot supply another user_id", async () => {
    const result = await userAClient
      .from("annual_reading_goals")
      .insert({ user_id: userBId, year: testYear + 1, target_count: 3 })
      .select("id");
    assertPermissionDenied(result, "protected user_id INSERT", "user_id column grant did not reject INSERT");
  });

  await runTest("duplicate user and year is rejected", async () => {
    const result = await userAClient
      .from("annual_reading_goals")
      .insert({ year: testYear, target_count: 24 })
      .select("id");
    assertCode(result, "23505", "UNIQUE", "duplicate goal was not rejected");
  });

  await runTest("zero target_count is rejected", async () => {
    const result = await userAClient
      .from("annual_reading_goals")
      .insert({ year: testYear + 2, target_count: 0 })
      .select("id");
    assertCode(result, "23514", "zero target_count", "zero target_count was not rejected");
  });

  await runTest("negative target_count is rejected", async () => {
    const result = await userAClient
      .from("annual_reading_goals")
      .insert({ year: testYear + 3, target_count: -1 })
      .select("id");
    assertCode(result, "23514", "negative target_count", "negative target_count was not rejected");
  });

  let updatedAtBefore;
  await runTest("A updates target_count and the trigger updates updated_at", async () => {
    const before = await readGoal(userAClient, goalId, "updated_at baseline");
    updatedAtBefore = before[0].updated_at;
    const result = await userAClient
      .from("annual_reading_goals")
      .update({ target_count: 5 })
      .eq("id", goalId)
      .select("id, target_count, updated_at")
      .single();
    assertNoError(result.error, "own UPDATE", "allowed target_count UPDATE failed");
    assert(result.data.target_count === 5, "own UPDATE", "target_count was not updated");
    assert(result.data.updated_at > updatedAtBefore, "updated_at trigger", "updated_at did not advance");
  });

  await runTest("user_id cannot be updated directly", async () => {
    const result = await userAClient
      .from("annual_reading_goals")
      .update({ user_id: userBId })
      .eq("id", goalId)
      .select("id");
    assertPermissionDenied(result, "protected user_id UPDATE", "user_id column grant did not reject UPDATE");
  });

  await runTest("year cannot be updated directly", async () => {
    const result = await userAClient
      .from("annual_reading_goals")
      .update({ year: testYear + 4 })
      .eq("id", goalId)
      .select("id");
    assertPermissionDenied(result, "protected year UPDATE", "year column grant did not reject UPDATE");
  });

  await runTest("updated_at cannot be updated directly", async () => {
    const result = await userAClient
      .from("annual_reading_goals")
      .update({ updated_at: "2000-01-01T00:00:00.000Z" })
      .eq("id", goalId)
      .select("id");
    assertPermissionDenied(result, "protected updated_at UPDATE", "updated_at column grant did not reject UPDATE");
  });

  await runTest("B cannot update A goal", async () => {
    const result = await userBClient
      .from("annual_reading_goals")
      .update({ target_count: 99 })
      .eq("id", goalId)
      .select("id");
    assertNoError(result.error, "isolated UPDATE", "cross-user UPDATE returned an unexpected error");
    assert(result.data.length === 0, "isolated UPDATE", "B updated A goal");
    const rows = await readGoal(userAClient, goalId, "isolated UPDATE verification");
    assert(rows.length === 1 && rows[0].target_count === 5, "isolated UPDATE", "A goal changed");
  });

  await runTest("B cannot delete A goal", async () => {
    const result = await userBClient
      .from("annual_reading_goals")
      .delete()
      .eq("id", goalId)
      .select("id");
    assertNoError(result.error, "isolated DELETE", "cross-user DELETE returned an unexpected error");
    assert(result.data.length === 0, "isolated DELETE", "B deleted A goal");
    const rows = await readGoal(userAClient, goalId, "isolated DELETE verification");
    assert(rows.length === 1, "isolated DELETE", "A goal disappeared");
  });

  await runTest("anon cannot SELECT goals", async () => {
    const result = await anonClient.from("annual_reading_goals").select("id").limit(1);
    assertPermissionDenied(result, "anon SELECT", "anonymous SELECT was not denied");
  });

  await runTest("anon cannot INSERT goals", async () => {
    const result = await anonClient
      .from("annual_reading_goals")
      .insert({ year: testYear + 5, target_count: 1 })
      .select("id");
    assertPermissionDenied(result, "anon INSERT", "anonymous INSERT was not denied");
  });

  await runTest("anon cannot UPDATE goals", async () => {
    const result = await anonClient
      .from("annual_reading_goals")
      .update({ target_count: 1 })
      .eq("id", goalId)
      .select("id");
    assertPermissionDenied(result, "anon UPDATE", "anonymous UPDATE was not denied");
  });

  await runTest("anon cannot DELETE goals", async () => {
    const result = await anonClient
      .from("annual_reading_goals")
      .delete()
      .eq("id", goalId)
      .select("id");
    assertPermissionDenied(result, "anon DELETE", "anonymous DELETE was not denied");
  });

  await runTest("A deletes its own goal", async () => {
    const result = await userAClient
      .from("annual_reading_goals")
      .delete()
      .eq("id", goalId)
      .select("id");
    assertNoError(result.error, "own DELETE", "allowed DELETE failed");
    assert(result.data.length === 1, "own DELETE", "A goal was not deleted");
    goalId = undefined;
  });
} catch (error) {
  const safeError = error instanceof SafeTestError
    ? error
    : new SafeTestError("setup", "unexpected integration test failure", error?.code);
  console.error(
    `FAIL  ${safeError.testName}${safeError.code ? ` [${safeError.code}]` : ""}: ${safeError.message}`,
  );
  process.exitCode = 1;
} finally {
  const cleanupErrors = [];

  if (goalId) {
    const result = await userAClient
      .from("annual_reading_goals")
      .delete()
      .eq("id", goalId);
    if (result.error) cleanupErrors.push(result.error.code);
  }

  if (userAId) {
    const remaining = await userAClient
      .from("annual_reading_goals")
      .select("id")
      .eq("year", testYear);
    if (remaining.error || remaining.data.length > 0) {
      cleanupErrors.push(remaining.error?.code ?? "ROWS_REMAIN");
    }
  }

  cleanupSucceeded = cleanupErrors.length === 0;
  for (const code of cleanupErrors) {
    console.error(`FAIL  cleanup${code ? ` [${code}]` : ""}: goal fixture remains`);
  }
  if (!cleanupSucceeded) process.exitCode = 1;

  await Promise.all([
    userAClient.auth.signOut({ scope: "local" }),
    userBClient.auth.signOut({ scope: "local" }),
  ]);
}

console.log(`RESULT ${testsPassed} PASS / ${testsRun - testsPassed} FAIL / 0 SKIP`);
if (!process.exitCode && testsRun === 18 && testsPassed === 18 && cleanupSucceeded) {
  console.log("18/18 annual_reading_goals RLS integration tests passed");
  console.log("Cleanup verified: no annual_reading_goals test rows remain");
}
