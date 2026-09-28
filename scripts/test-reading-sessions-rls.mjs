import { createClient } from "@supabase/supabase-js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const mode = process.argv[2];
const markerFlagIndex = process.argv.indexOf("--marker");
const marker = markerFlagIndex >= 0 ? process.argv[markerFlagIndex + 1] : undefined;

if (!new Set(["setup", "verify-cleanup"]).has(mode)) {
  console.error("FAIL  usage: expected setup or verify-cleanup");
  process.exit(1);
}

if (!marker || !uuidPattern.test(marker)) {
  console.error("FAIL  usage: --marker must be a valid UUID");
  process.exit(1);
}

const commonEnvironmentVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "FOAIE_TEST_USER_A_EMAIL",
  "FOAIE_TEST_USER_A_PASSWORD",
];
const setupEnvironmentVariables = [
  "FOAIE_TEST_USER_B_EMAIL",
  "FOAIE_TEST_USER_B_PASSWORD",
  "FOAIE_TEST_USER_C_EMAIL",
  "FOAIE_TEST_USER_C_PASSWORD",
];
const requiredEnvironmentVariables = mode === "setup"
  ? [...commonEnvironmentVariables, ...setupEnvironmentVariables]
  : commonEnvironmentVariables;

for (const name of requiredEnvironmentVariables) {
  if (!process.env[name]?.trim()) {
    console.error("FAIL  setup [MISSING_ENV]: required test configuration is missing");
    process.exit(1);
  }
}

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

function reportFailure(error) {
  const safeError = error instanceof SafeTestError
    ? error
    : new SafeTestError("setup", "unexpected integration test failure", error?.code);
  console.error(
    `FAIL  ${safeError.testName}${safeError.code ? ` [${safeError.code}]` : ""}: ${safeError.message}`,
  );
  process.exitCode = 1;
}

const workTitle = `Reading sessions RLS work ${marker}`;
const historyEditionTitle = `Reading sessions history edition ${marker}`;
const emptyEditionTitle = `Reading sessions empty edition ${marker}`;

async function runSetup() {
  const anonClient = createTestClient();
  const userAClient = createTestClient();
  const userBClient = createTestClient();
  const userCClient = createTestClient();

  let workId;
  let historyEditionId;
  let emptyEditionId;
  let historyMembershipId;
  let emptyMembershipId;
  let readingSessionId;
  let historyMustBePreserved = false;
  const cleanupErrors = [];

  async function cleanup(result, description) {
    if (result.error) cleanupErrors.push({ description, code: result.error.code });
  }

  try {
    await authenticate(
      userAClient,
      process.env.FOAIE_TEST_USER_A_EMAIL,
      process.env.FOAIE_TEST_USER_A_PASSWORD,
      "user A authentication",
    );
    await authenticate(
      userBClient,
      process.env.FOAIE_TEST_USER_B_EMAIL,
      process.env.FOAIE_TEST_USER_B_PASSWORD,
      "user B authentication",
    );
    const userCId = await authenticate(
      userCClient,
      process.env.FOAIE_TEST_USER_C_EMAIL,
      process.env.FOAIE_TEST_USER_C_PASSWORD,
      "user C authentication",
    );

    await runTest("C has a profile created by the normal Auth trigger", async () => {
      const result = await userCClient.from("profiles").select("id").eq("id", userCId);
      assertNoError(result.error, "C profile", "profile verification failed");
      assert(result.data.length === 1, "C profile", "C profile is missing");
    });

    const existingFixtures = await Promise.all([
      userAClient.from("works").select("id").eq("title", workTitle),
      userAClient.from("editions").select("id").in("edition_title", [
        historyEditionTitle,
        emptyEditionTitle,
      ]),
    ]);
    assertNoError(existingFixtures[0].error, "fixture preflight", "work preflight failed");
    assertNoError(existingFixtures[1].error, "fixture preflight", "edition preflight failed");
    assert(
      existingFixtures.every((result) => result.data.length === 0),
      "fixture preflight",
      "the marker already has remote fixtures",
    );

    const work = await userAClient
      .from("works")
      .insert({ title: workTitle })
      .select("id")
      .single();
    assertNoError(work.error, "work fixture", "work fixture creation failed");
    workId = work.data.id;

    const historyEdition = await userAClient
      .from("editions")
      .insert({
        work_id: workId,
        edition_title: historyEditionTitle,
        format: "PHYSICAL",
      })
      .select("id")
      .single();
    assertNoError(
      historyEdition.error,
      "history edition fixture",
      "history edition fixture creation failed",
    );
    historyEditionId = historyEdition.data.id;

    const emptyEdition = await userAClient
      .from("editions")
      .insert({
        work_id: workId,
        edition_title: emptyEditionTitle,
        format: "PHYSICAL",
      })
      .select("id")
      .single();
    assertNoError(
      emptyEdition.error,
      "empty edition fixture",
      "empty edition fixture creation failed",
    );
    emptyEditionId = emptyEdition.data.id;

    await runTest("C creates its history membership", async () => {
      const result = await userCClient
        .from("user_editions")
        .insert({ edition_id: historyEditionId })
        .select("id")
        .single();
      assertNoError(result.error, "history membership", "history membership creation failed");
      historyMembershipId = result.data.id;
    });

    {
      const result = await userCClient
        .from("user_editions")
        .insert({ edition_id: emptyEditionId })
        .select("id")
        .single();
      assertNoError(result.error, "empty membership", "empty membership creation failed");
      emptyMembershipId = result.data.id;
    }

    await runTest("C creates a READING session with database defaults", async () => {
      const result = await userCClient
        .from("reading_sessions")
        .insert({
          user_edition_id: historyMembershipId,
          status: "READING",
          started_at: "2026-09-28",
          progress_unit: "PAGES",
        })
        .select("id, status, current_value, progress_unit, created_at")
        .single();
      assertNoError(result.error, "READING creation", "allowed READING insert failed");
      assert(uuidPattern.test(result.data.id), "READING creation", "database UUID is invalid");
      assert(result.data.status === "READING", "READING creation", "stored status is incorrect");
      assert(result.data.current_value === 0, "READING creation", "current_value default is incorrect");
      assert(result.data.progress_unit === "PAGES", "READING creation", "stored unit is incorrect");
      assert(Boolean(result.data.created_at), "READING creation", "created_at default is missing");
      readingSessionId = result.data.id;
      historyMustBePreserved = true;
    });

    await runTest("C reads exactly its own session", async () => {
      const result = await userCClient
        .from("reading_sessions")
        .select("id")
        .eq("id", readingSessionId);
      assertNoError(result.error, "C session read", "C session read failed");
      assert(result.data.length === 1, "C session read", "C session was not visible");
    });

    await runTest("B cannot read C session", async () => {
      const result = await userBClient
        .from("reading_sessions")
        .select("id")
        .eq("id", readingSessionId);
      assertNoError(result.error, "B session isolation", "cross-user read returned an error");
      assert(result.data.length === 0, "B session isolation", "C session leaked to B");
    });

    await runTest("B cannot create a session on C membership", async () => {
      const result = await userBClient.from("reading_sessions").insert({
        user_edition_id: historyMembershipId,
        status: "READING",
        started_at: "2026-09-28",
        progress_unit: "PAGES",
      });
      assertPermissionDenied(result, "B session insert", "cross-user insert was not denied");
    });

    await runTest("anon cannot read reading sessions", async () => {
      const result = await anonClient.from("reading_sessions").select("id").limit(1);
      assertPermissionDenied(result, "anon session read", "anonymous SELECT was not denied");
    });

    await runTest("anon cannot insert reading sessions", async () => {
      const result = await anonClient.from("reading_sessions").insert({
        user_edition_id: historyMembershipId,
        status: "READING",
        started_at: "2026-09-28",
        progress_unit: "PAGES",
      });
      assertPermissionDenied(result, "anon session insert", "anonymous INSERT was not denied");
    });

    for (const status of ["FINISHED", "ABANDONED", "INVENTED"]) {
      await runTest(`direct ${status} insert is rejected by policy`, async () => {
        const result = await userCClient.from("reading_sessions").insert({
          user_edition_id: historyMembershipId,
          status,
          started_at: "2026-09-28",
          progress_unit: "PAGES",
        });
        assertPermissionDenied(result, `${status} insert`, `${status} insert was not denied`);
      });
    }

    await runTest("invalid progress unit is rejected", async () => {
      const result = await userCClient.from("reading_sessions").insert({
        user_edition_id: emptyMembershipId,
        status: "READING",
        started_at: "2026-09-28",
        progress_unit: "INVALID",
      });
      assertCode(result, "23514", "invalid unit", "invalid unit was not rejected");
    });

    await runTest("negative current_value is rejected", async () => {
      const result = await userCClient.from("reading_sessions").insert({
        user_edition_id: emptyMembershipId,
        status: "READING",
        started_at: "2026-09-28",
        current_value: -1,
        progress_unit: "PAGES",
      });
      assertCode(result, "23514", "negative progress", "negative progress was not rejected");
    });

    await runTest("PERCENT above 100 is rejected", async () => {
      const result = await userCClient.from("reading_sessions").insert({
        user_edition_id: emptyMembershipId,
        status: "READING",
        started_at: "2026-09-28",
        current_value: 101,
        progress_unit: "PERCENT",
      });
      assertCode(result, "23514", "percent range", "PERCENT above 100 was not rejected");
    });

    await runTest("READING without started_at is rejected", async () => {
      const result = await userCClient.from("reading_sessions").insert({
        user_edition_id: emptyMembershipId,
        status: "READING",
        progress_unit: "PAGES",
      });
      assertCode(result, "23514", "missing started_at", "READING without started_at was not rejected");
    });

    await runTest("finished_at cannot be supplied on INSERT", async () => {
      const result = await userCClient.from("reading_sessions").insert({
        user_edition_id: emptyMembershipId,
        status: "READING",
        started_at: "2026-09-28",
        finished_at: "2026-09-28",
        progress_unit: "PAGES",
      });
      assertPermissionDenied(result, "finished_at grant", "finished_at was accepted");
    });

    await runTest("abandoned_at cannot be supplied on INSERT", async () => {
      const result = await userCClient.from("reading_sessions").insert({
        user_edition_id: emptyMembershipId,
        status: "READING",
        started_at: "2026-09-28",
        abandoned_at: "2026-09-28",
        progress_unit: "PAGES",
      });
      assertPermissionDenied(result, "abandoned_at grant", "abandoned_at was accepted");
    });

    await runTest("a second simultaneous READING is rejected", async () => {
      const result = await userCClient.from("reading_sessions").insert({
        user_edition_id: historyMembershipId,
        status: "READING",
        started_at: "2026-09-29",
        progress_unit: "PAGES",
      });
      assertCode(result, "23505", "second READING", "second READING was not rejected");
      const rows = await userCClient
        .from("reading_sessions")
        .select("id")
        .eq("user_edition_id", historyMembershipId);
      assertNoError(rows.error, "second READING", "session count verification failed");
      assert(rows.data.length === 1, "second READING", "session count changed after rejection");
    });

    await runTest("C removes a membership without reading history", async () => {
      const removed = await userCClient
        .from("user_editions")
        .delete()
        .eq("id", emptyMembershipId)
        .select("id");
      assertNoError(removed.error, "empty membership", "empty membership deletion failed");
      assert(removed.data.length === 1, "empty membership", "empty membership was not deleted");
      emptyMembershipId = undefined;

      const remaining = await userCClient
        .from("user_editions")
        .select("id")
        .eq("edition_id", emptyEditionId);
      assertNoError(remaining.error, "empty membership", "empty membership verification failed");
      assert(remaining.data.length === 0, "empty membership", "empty membership remains");
    });

    const removedEmptyEdition = await userAClient
      .from("editions")
      .delete()
      .eq("id", emptyEditionId)
      .select("id");
    assertNoError(
      removedEmptyEdition.error,
      "empty edition cleanup",
      "empty edition cleanup failed",
    );
    assert(
      removedEmptyEdition.data.length === 1,
      "empty edition cleanup",
      "empty edition was not removed",
    );
    emptyEditionId = undefined;

    await runTest("history membership cannot be removed", async () => {
      const removed = await userCClient
        .from("user_editions")
        .delete()
        .eq("id", historyMembershipId)
        .select("id");
      assertNoError(removed.error, "history membership", "protected DELETE returned an error");
      assert(removed.data.length === 0, "history membership", "history membership was deleted");

      const [membership, session] = await Promise.all([
        userCClient.from("user_editions").select("id").eq("id", historyMembershipId),
        userCClient.from("reading_sessions").select("id").eq("id", readingSessionId),
      ]);
      assertNoError(membership.error, "history membership", "membership verification failed");
      assertNoError(session.error, "history membership", "session verification failed");
      assert(membership.data.length === 1, "history membership", "membership did not remain");
      assert(session.data.length === 1, "history membership", "session did not remain");
    });
  } catch (error) {
    reportFailure(error);
  } finally {
    if (emptyMembershipId) {
      await cleanup(
        await userCClient.from("user_editions").delete().eq("id", emptyMembershipId),
        "empty membership was not removed",
      );
    }
    if (emptyEditionId) {
      await cleanup(
        await userAClient.from("editions").delete().eq("id", emptyEditionId),
        "empty edition was not removed",
      );
    }

    if (!historyMustBePreserved) {
      if (historyMembershipId) {
        await cleanup(
          await userCClient.from("user_editions").delete().eq("id", historyMembershipId),
          "history membership was not removed after pre-session failure",
        );
      }
      if (historyEditionId) {
        await cleanup(
          await userAClient.from("editions").delete().eq("id", historyEditionId),
          "history edition was not removed after pre-session failure",
        );
      }
      if (workId) {
        await cleanup(
          await userAClient.from("works").delete().eq("id", workId),
          "work was not removed after pre-session failure",
        );
      }
    }

    for (const cleanupError of cleanupErrors) {
      const code = cleanupError.code ? ` [${cleanupError.code}]` : "";
      console.error(`FAIL  cleanup${code}: ${cleanupError.description}`);
    }
    if (cleanupErrors.length > 0) process.exitCode = 1;

    await Promise.all([
      userAClient.auth.signOut({ scope: "local" }),
      userBClient.auth.signOut({ scope: "local" }),
      userCClient.auth.signOut({ scope: "local" }),
    ]);
  }

  console.log(`RESULT ${testsPassed} PASS / ${testsRun - testsPassed} FAIL / 0 SKIP`);
  if (process.exitCode && historyMustBePreserved) {
    console.error(
      "ACTION REQUIRED: delete test user C in Supabase Dashboard before running verify-cleanup.",
    );
    console.error(`Safe marker: ${marker}`);
  }
  if (!process.exitCode && testsRun === 20 && testsPassed === 20) {
    console.log("SETUP PASS");
    console.log(`marker: ${marker}`);
    console.log("work fixture: created");
    console.log("history edition fixture: created");
    console.log("history membership: protected");
    console.log("reading session: preserved for cascade verification");
    console.log("");
    console.log("TEST USER C MUST NOW BE DELETED FROM SUPABASE AUTH");
    console.log("");
    console.log("next:");
    console.log(
      `node --env-file=.env.local --env-file=.env.test.local scripts/test-reading-sessions-rls.mjs verify-cleanup --marker ${marker}`,
    );
  }
}

async function runVerifyCleanup() {
  const userAClient = createTestClient();

  try {
    await authenticate(
      userAClient,
      process.env.FOAIE_TEST_USER_A_EMAIL,
      process.env.FOAIE_TEST_USER_A_PASSWORD,
      "user A authentication",
    );

    const [works, historyEditions, emptyEditions] = await Promise.all([
      userAClient.from("works").select("id").eq("title", workTitle),
      userAClient.from("editions").select("id, work_id").eq("edition_title", historyEditionTitle),
      userAClient.from("editions").select("id").eq("edition_title", emptyEditionTitle),
    ]);
    assertNoError(works.error, "fixture discovery", "work discovery failed");
    assertNoError(historyEditions.error, "fixture discovery", "history edition discovery failed");
    assertNoError(emptyEditions.error, "fixture discovery", "empty edition discovery failed");
    assert(works.data.length === 1, "fixture discovery", "expected exactly one work fixture");
    assert(
      historyEditions.data.length === 1,
      "fixture discovery",
      "expected exactly one history edition fixture",
    );
    assert(emptyEditions.data.length === 0, "fixture discovery", "empty edition fixture still exists");
    assert(
      historyEditions.data[0].work_id === works.data[0].id,
      "fixture discovery",
      "history edition belongs to a different work",
    );

    await runTest("A can delete the history edition after C deletion", async () => {
      const removed = await userAClient
        .from("editions")
        .delete()
        .eq("id", historyEditions.data[0].id)
        .select("id");
      assertNoError(removed.error, "cascade verification", "history edition deletion failed");
      assert(
        removed.data.length === 1,
        "cascade verification",
        "history edition remained blocked after C deletion",
      );
    });

    await runTest("A removes the global work fixture", async () => {
      const removed = await userAClient
        .from("works")
        .delete()
        .eq("id", works.data[0].id)
        .select("id");
      assertNoError(removed.error, "work cleanup", "work fixture deletion failed");
      assert(removed.data.length === 1, "work cleanup", "work fixture was not deleted");
    });

    await runTest("no global fixtures remain", async () => {
      const checks = await Promise.all([
        userAClient.from("works").select("id").eq("title", workTitle),
        userAClient.from("editions").select("id").eq("edition_title", historyEditionTitle),
        userAClient.from("editions").select("id").eq("edition_title", emptyEditionTitle),
      ]);
      for (const result of checks) {
        assertNoError(result.error, "global fixture cleanup", "cleanup verification failed");
      }
      assert(
        checks.every((result) => result.data.length === 0),
        "global fixture cleanup",
        "one or more global fixtures remain",
      );
    });
  } catch (error) {
    reportFailure(error);
  } finally {
    await userAClient.auth.signOut({ scope: "local" });
  }

  console.log(`RESULT ${testsPassed} PASS / ${testsRun - testsPassed} FAIL / 0 SKIP`);
  if (!process.exitCode && testsRun === 3 && testsPassed === 3) {
    console.log("VERIFY CLEANUP PASS");
    console.log("global fixtures remaining: 0");
  }
}

if (mode === "setup") {
  await runSetup();
} else {
  await runVerifyCleanup();
}
