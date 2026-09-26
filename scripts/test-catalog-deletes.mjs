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

function assertDeniedOrEmpty(result, testName) {
  assert(
    result.error?.code === "42501" || (!result.error && result.data?.length === 0),
    testName,
    "cross-user deletion succeeded",
    result.error?.code,
  );
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
}

async function createWork(client, label, workIds) {
  const result = await client.from("works").insert({ title: `Delete test ${label} ${randomUUID()}` }).select("id").single();
  assertNoError(result.error, label, "work fixture creation failed");
  workIds.push(result.data.id);
  return result.data.id;
}

async function createEdition(client, workId, label, editionIds) {
  const result = await client.from("editions").insert({ work_id: workId, format: "PHYSICAL" }).select("id").single();
  assertNoError(result.error, label, "edition fixture creation failed");
  editionIds.push(result.data.id);
  return result.data.id;
}

async function verifyExists(client, table, id, testName) {
  const result = await client.from(table).select("id").eq("id", id);
  assertNoError(result.error, testName, "verification read failed");
  assert(result.data.length === 1, testName, `${table} fixture no longer exists`);
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

const a = createTestClient();
const b = createTestClient();
const workIdsA = [];
const editionIdsA = [];
const editionIdsB = [];

try {
  await authenticate(a, process.env.FOAIE_TEST_USER_A_EMAIL, process.env.FOAIE_TEST_USER_A_PASSWORD, "setup user A");
  await authenticate(b, process.env.FOAIE_TEST_USER_B_EMAIL, process.env.FOAIE_TEST_USER_B_PASSWORD, "setup user B");

  const ownEditionWork = await createWork(a, "own edition", workIdsA);
  const ownEdition = await createEdition(a, ownEditionWork, "own edition", editionIdsA);
  await runTest("1. A can delete own edition", async () => {
    const result = await a.from("editions").delete().eq("id", ownEdition).select("id");
    assertNoError(result.error, "1. A can delete own edition", "own edition deletion failed");
    assert(result.data.length === 1, "1. A can delete own edition", "own edition was not deleted");
    editionIdsA.splice(editionIdsA.indexOf(ownEdition), 1);
  });

  const protectedEditionWork = await createWork(a, "protected edition", workIdsA);
  const protectedEdition = await createEdition(a, protectedEditionWork, "protected edition", editionIdsA);
  await runTest("2. B cannot delete A edition", async () => {
    const result = await b.from("editions").delete().eq("id", protectedEdition).select("id");
    assertDeniedOrEmpty(result, "2. B cannot delete A edition");
    await verifyExists(a, "editions", protectedEdition, "2. B cannot delete A edition");
  });

  const emptyWork = await createWork(a, "empty work", workIdsA);
  await runTest("3. A can delete empty own work", async () => {
    const result = await a.from("works").delete().eq("id", emptyWork).select("id");
    assertNoError(result.error, "3. A can delete empty own work", "own work deletion failed");
    assert(result.data.length === 1, "3. A can delete empty own work", "own work was not deleted");
    workIdsA.splice(workIdsA.indexOf(emptyWork), 1);
  });

  const foreignDeleteWork = await createWork(a, "foreign delete", workIdsA);
  await runTest("4. B cannot delete A work", async () => {
    const result = await b.from("works").delete().eq("id", foreignDeleteWork).select("id");
    assertDeniedOrEmpty(result, "4. B cannot delete A work");
    await verifyExists(a, "works", foreignDeleteWork, "4. B cannot delete A work");
  });

  const ownBlockingWork = await createWork(a, "own blocking edition", workIdsA);
  const ownBlockingEdition = await createEdition(a, ownBlockingWork, "own blocking edition", editionIdsA);
  await runTest("5. A edition blocks deletion of A work", async () => {
    const result = await a.from("works").delete().eq("id", ownBlockingWork).select("id");
    assert(result.error?.code === "23503", "5. A edition blocks deletion of A work", "work deletion was not restricted", result.error?.code);
    await verifyExists(a, "works", ownBlockingWork, "5. A edition blocks deletion of A work");
    await verifyExists(a, "editions", ownBlockingEdition, "5. A edition blocks deletion of A work");
  });

  const foreignBlockingWork = await createWork(a, "foreign blocking edition", workIdsA);
  const foreignBlockingEdition = await createEdition(b, foreignBlockingWork, "foreign blocking edition", editionIdsB);
  await runTest("6. B edition blocks deletion of A work and remains intact", async () => {
    const result = await a.from("works").delete().eq("id", foreignBlockingWork).select("id");
    assert(result.error?.code === "23503", "6. B edition blocks deletion of A work and remains intact", "foreign edition did not restrict deletion", result.error?.code);
    await verifyExists(a, "works", foreignBlockingWork, "6. B edition blocks deletion of A work and remains intact");
    await verifyExists(b, "editions", foreignBlockingEdition, "6. B edition blocks deletion of A work and remains intact");
  });

  console.log(`\n${testsPassed}/${testsRun} catalog delete integration tests passed`);
} catch (error) {
  if (error instanceof SafeTestError) console.error(`FAIL  ${error.testName}${error.code ? ` [${error.code}]` : ""}: ${error.message}`);
  else console.error("FAIL  unexpected test failure");
  process.exitCode = 1;
} finally {
  if (editionIdsA.length) await a.from("editions").delete().in("id", editionIdsA);
  if (editionIdsB.length) await b.from("editions").delete().in("id", editionIdsB);
  if (workIdsA.length) await a.from("works").delete().in("id", workIdsA);

  const remainingAEditions = editionIdsA.length ? await a.from("editions").select("id").in("id", editionIdsA) : { data: [], error: null };
  const remainingBEditions = editionIdsB.length ? await b.from("editions").select("id").in("id", editionIdsB) : { data: [], error: null };
  const remainingWorks = workIdsA.length ? await a.from("works").select("id").in("id", workIdsA) : { data: [], error: null };
  const clean = !remainingAEditions.error && !remainingBEditions.error && !remainingWorks.error
    && remainingAEditions.data.length === 0 && remainingBEditions.data.length === 0 && remainingWorks.data.length === 0;
  console.log(clean ? "Cleanup verified: no catalog delete test rows remain" : "FAIL  cleanup: catalog delete test rows remain");
  if (!clean) process.exitCode = 1;
  await Promise.all([a.auth.signOut({ scope: "local" }), b.auth.signOut({ scope: "local" })]);
}
