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
  assert(result.error?.code === expectedCode, testName, description, result.error?.code);
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

const workTitle = `Reading lifecycle RLS work ${marker}`;
const editionTitles = {
  finished: `Reading lifecycle finished edition ${marker}`,
  abandoned: `Reading lifecycle abandoned edition ${marker}`,
  active: `Reading lifecycle active edition ${marker}`,
  finishChecks: `Reading lifecycle finish checks edition ${marker}`,
  abandonChecks: `Reading lifecycle abandon checks edition ${marker}`,
  concurrent: `Reading lifecycle concurrent edition ${marker}`,
};
const allEditionTitles = Object.values(editionTitles);
const startedAt = "2026-09-20";
const closedAt = "2026-09-21";
const earlierThanStart = "2026-09-19";

async function readSession(client, sessionId, testName) {
  const result = await client
    .from("reading_sessions")
    .select(
      "id, user_edition_id, status, started_at, finished_at, abandoned_at, current_value, progress_unit, created_at",
    )
    .eq("id", sessionId);
  assertNoError(result.error, testName, "session verification failed");
  assert(result.data.length === 1, testName, "expected session is not visible");
  return result.data[0];
}

function assertReadingState(row, expected, testName) {
  assert(row.status === "READING", testName, "session no longer has READING status");
  assert(row.started_at === expected.startedAt, testName, "started_at changed unexpectedly");
  assert(row.finished_at === null, testName, "finished_at changed unexpectedly");
  assert(row.abandoned_at === null, testName, "abandoned_at changed unexpectedly");
  assert(row.current_value === expected.currentValue, testName, "current_value changed unexpectedly");
  assert(row.progress_unit === expected.progressUnit, testName, "progress_unit changed unexpectedly");
}

function assertSingleUpdate(result, testName, description) {
  assertNoError(result.error, testName, description);
  assert(result.data.length === 1, testName, "expected exactly one updated row");
  return result.data[0];
}

function assertHiddenUpdate(result, testName, description) {
  assertNoError(result.error, testName, description);
  assert(result.data.length === 0, testName, "UPDATE unexpectedly affected a row");
}

async function runSetup() {
  const anonClient = createTestClient();
  const userAClient = createTestClient();
  const userBClient = createTestClient();
  const userCClient = createTestClient();

  let workId;
  const editionIds = new Map();
  const membershipIds = new Map();
  const sessionIds = new Map();
  let historyMustBePreserved = false;
  const cleanupErrors = [];

  async function cleanup(result, description) {
    if (result.error) cleanupErrors.push({ description, code: result.error.code });
  }

  async function createMembership(key) {
    const result = await userCClient
      .from("user_editions")
      .insert({ edition_id: editionIds.get(key) })
      .select("id")
      .single();
    assertNoError(result.error, `${key} membership`, "membership fixture creation failed");
    membershipIds.set(key, result.data.id);
  }

  async function createReadingSession(key, currentValue, progressUnit) {
    const result = await userCClient
      .from("reading_sessions")
      .insert({
        user_edition_id: membershipIds.get(key),
        status: "READING",
        started_at: startedAt,
        current_value: currentValue,
        progress_unit: progressUnit,
      })
      .select("id, status")
      .single();
    assertNoError(result.error, `${key} session`, "READING fixture creation failed");
    assert(uuidPattern.test(result.data.id), `${key} session`, "database UUID is invalid");
    assert(result.data.status === "READING", `${key} session`, "stored status is incorrect");
    sessionIds.set(key, result.data.id);
    historyMustBePreserved = true;
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

    const [existingWorks, existingEditions] = await Promise.all([
      userAClient.from("works").select("id").eq("title", workTitle),
      userAClient.from("editions").select("id").in("edition_title", allEditionTitles),
    ]);
    assertNoError(existingWorks.error, "fixture preflight", "work preflight failed");
    assertNoError(existingEditions.error, "fixture preflight", "edition preflight failed");
    assert(
      existingWorks.data.length === 0 && existingEditions.data.length === 0,
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

    for (const [key, title] of Object.entries(editionTitles)) {
      const edition = await userAClient
        .from("editions")
        .insert({ work_id: workId, edition_title: title, format: "PHYSICAL" })
        .select("id")
        .single();
      assertNoError(edition.error, `${key} edition`, "edition fixture creation failed");
      editionIds.set(key, edition.data.id);
      await createMembership(key);
    }

    await runTest("C creates the READING session that will become FINISHED", async () => {
      await createReadingSession("finished", 42, "PAGES");
    });

    await runTest("C closes its own session as FINISHED", async () => {
      const result = await userCClient
        .from("reading_sessions")
        .update({ status: "FINISHED", finished_at: closedAt })
        .eq("id", sessionIds.get("finished"))
        .select("id, status, finished_at, abandoned_at, current_value, progress_unit");
      const row = assertSingleUpdate(result, "finish own session", "FINISHED update failed");
      assert(row.status === "FINISHED", "finish own session", "status was not FINISHED");
      assert(row.finished_at === closedAt, "finish own session", "finished_at was not stored");
      assert(row.abandoned_at === null, "finish own session", "abandoned_at should remain null");
      assert(row.current_value === 42, "finish own session", "progress was not preserved");
      assert(row.progress_unit === "PAGES", "finish own session", "progress unit changed");
    });

    await runTest("C creates the READING session that will become ABANDONED", async () => {
      await createReadingSession("abandoned", 38, "PERCENT");
    });

    await runTest("C closes its own session as ABANDONED", async () => {
      const result = await userCClient
        .from("reading_sessions")
        .update({ status: "ABANDONED", abandoned_at: closedAt })
        .eq("id", sessionIds.get("abandoned"))
        .select("id, status, finished_at, abandoned_at, current_value, progress_unit");
      const row = assertSingleUpdate(result, "abandon own session", "ABANDONED update failed");
      assert(row.status === "ABANDONED", "abandon own session", "status was not ABANDONED");
      assert(row.abandoned_at === closedAt, "abandon own session", "abandoned_at was not stored");
      assert(row.finished_at === null, "abandon own session", "finished_at should remain null");
      assert(row.current_value === 38, "abandon own session", "progress was not preserved");
      assert(row.progress_unit === "PERCENT", "abandon own session", "progress unit changed");
    });

    await runTest("C creates an active session for isolation and grant checks", async () => {
      await createReadingSession("active", 7, "PAGES");
    });

    await runTest("B cannot close C active session", async () => {
      const result = await userBClient
        .from("reading_sessions")
        .update({ status: "FINISHED", finished_at: closedAt })
        .eq("id", sessionIds.get("active"))
        .select("id");
      assertHiddenUpdate(result, "B lifecycle isolation", "cross-user UPDATE returned an error");
      const row = await readSession(userCClient, sessionIds.get("active"), "B lifecycle isolation");
      assertReadingState(row, { startedAt, currentValue: 7, progressUnit: "PAGES" }, "B lifecycle isolation");
    });

    await runTest("anon cannot close a reading session", async () => {
      const result = await anonClient
        .from("reading_sessions")
        .update({ status: "FINISHED", finished_at: closedAt })
        .eq("id", sessionIds.get("active"))
        .select("id");
      assertCode(result, "42501", "anon lifecycle update", "anonymous UPDATE was not denied");
    });

    for (const [key, nextStatus, dateColumn] of [
      ["finished", "READING", undefined],
      ["finished", "ABANDONED", "abandoned_at"],
      ["abandoned", "READING", undefined],
      ["abandoned", "FINISHED", "finished_at"],
    ]) {
      await runTest(`${key.toUpperCase()} session cannot transition to ${nextStatus}`, async () => {
        const payload = { status: nextStatus };
        if (dateColumn) payload[dateColumn] = closedAt;
        const result = await userCClient
          .from("reading_sessions")
          .update(payload)
          .eq("id", sessionIds.get(key))
          .select("id");
        assertHiddenUpdate(result, `${key} terminal state`, "terminal UPDATE returned an error");
        const row = await readSession(userCClient, sessionIds.get(key), `${key} terminal state`);
        assert(row.status === key.toUpperCase(), `${key} terminal state`, "terminal status changed");
      });
    }

    await runTest("READING to READING is blocked by WITH CHECK", async () => {
      const result = await userCClient
        .from("reading_sessions")
        .update({ status: "READING" })
        .eq("id", sessionIds.get("active"))
        .select("id");
      assertCode(result, "42501", "READING to READING", "same-state UPDATE was not denied");
      const row = await readSession(userCClient, sessionIds.get("active"), "READING to READING");
      assertReadingState(row, { startedAt, currentValue: 7, progressUnit: "PAGES" }, "READING to READING");
    });

    await runTest("C creates a READING session for FINISHED constraint checks", async () => {
      await createReadingSession("finishChecks", 12, "PAGES");
    });

    for (const [name, payload] of [
      ["FINISHED without finished_at", { status: "FINISHED" }],
      [
        "FINISHED with both terminal dates",
        { status: "FINISHED", finished_at: closedAt, abandoned_at: closedAt },
      ],
      [
        "FINISHED before started_at",
        { status: "FINISHED", finished_at: earlierThanStart },
      ],
    ]) {
      await runTest(`${name} is rejected`, async () => {
        const result = await userCClient
          .from("reading_sessions")
          .update(payload)
          .eq("id", sessionIds.get("finishChecks"))
          .select("id");
        assertCode(result, "23514", name, "invalid FINISHED transition was not rejected");
        const row = await readSession(userCClient, sessionIds.get("finishChecks"), name);
        assertReadingState(row, { startedAt, currentValue: 12, progressUnit: "PAGES" }, name);
      });
    }

    await runTest("C creates a READING session for ABANDONED constraint checks", async () => {
      await createReadingSession("abandonChecks", 18, "MINUTES");
    });

    for (const [name, payload] of [
      ["ABANDONED without abandoned_at", { status: "ABANDONED" }],
      [
        "ABANDONED with both terminal dates",
        { status: "ABANDONED", abandoned_at: closedAt, finished_at: closedAt },
      ],
      [
        "ABANDONED before started_at",
        { status: "ABANDONED", abandoned_at: earlierThanStart },
      ],
    ]) {
      await runTest(`${name} is rejected`, async () => {
        const result = await userCClient
          .from("reading_sessions")
          .update(payload)
          .eq("id", sessionIds.get("abandonChecks"))
          .select("id");
        assertCode(result, "23514", name, "invalid ABANDONED transition was not rejected");
        const row = await readSession(userCClient, sessionIds.get("abandonChecks"), name);
        assertReadingState(row, { startedAt, currentValue: 18, progressUnit: "MINUTES" }, name);
      });
    }

    const protectedColumnUpdates = [
      ["user_edition_id", membershipIds.get("active")],
      ["started_at", "2026-09-18"],
      ["current_value", 8],
      ["progress_unit", "MINUTES"],
      ["created_at", "2026-09-20T00:00:00.000Z"],
    ];
    for (const [column, value] of protectedColumnUpdates) {
      await runTest(`${column} remains outside UPDATE grants`, async () => {
        const result = await userCClient
          .from("reading_sessions")
          .update({ [column]: value })
          .eq("id", sessionIds.get("active"))
          .select("id");
        assertCode(result, "42501", `${column} grant`, `${column} UPDATE was not denied by grants`);
        const row = await readSession(userCClient, sessionIds.get("active"), `${column} grant`);
        assertReadingState(row, { startedAt, currentValue: 7, progressUnit: "PAGES" }, `${column} grant`);
      });
    }

    await runTest("a new READING can start after FINISHED", async () => {
      const result = await userCClient
        .from("reading_sessions")
        .insert({
          user_edition_id: membershipIds.get("finished"),
          status: "READING",
          started_at: "2026-09-22",
          progress_unit: "PAGES",
        })
        .select("id, status")
        .single();
      assertNoError(result.error, "FINISHED reread", "reread creation failed");
      assert(result.data.id !== sessionIds.get("finished"), "FINISHED reread", "reread reused the old ID");
      assert(result.data.status === "READING", "FINISHED reread", "reread is not active");
      sessionIds.set("finishedReread", result.data.id);
    });

    await runTest("FINISHED history and its reread coexist", async () => {
      const result = await userCClient
        .from("reading_sessions")
        .select("id, status")
        .eq("user_edition_id", membershipIds.get("finished"));
      assertNoError(result.error, "FINISHED reread history", "history verification failed");
      assert(result.data.length === 2, "FINISHED reread history", "expected two sessions");
      assert(result.data.filter((row) => row.status === "FINISHED").length === 1, "FINISHED reread history", "FINISHED history is missing");
      assert(result.data.filter((row) => row.status === "READING").length === 1, "FINISHED reread history", "active reread is missing");
    });

    await runTest("a new READING can start after ABANDONED", async () => {
      const result = await userCClient
        .from("reading_sessions")
        .insert({
          user_edition_id: membershipIds.get("abandoned"),
          status: "READING",
          started_at: "2026-09-22",
          progress_unit: "PERCENT",
        })
        .select("id, status")
        .single();
      assertNoError(result.error, "ABANDONED reread", "reread creation failed");
      assert(result.data.id !== sessionIds.get("abandoned"), "ABANDONED reread", "reread reused the old ID");
      assert(result.data.status === "READING", "ABANDONED reread", "reread is not active");
      sessionIds.set("abandonedReread", result.data.id);
    });

    await runTest("ABANDONED history and its reread coexist", async () => {
      const result = await userCClient
        .from("reading_sessions")
        .select("id, status")
        .eq("user_edition_id", membershipIds.get("abandoned"));
      assertNoError(result.error, "ABANDONED reread history", "history verification failed");
      assert(result.data.length === 2, "ABANDONED reread history", "expected two sessions");
      assert(result.data.filter((row) => row.status === "ABANDONED").length === 1, "ABANDONED reread history", "ABANDONED history is missing");
      assert(result.data.filter((row) => row.status === "READING").length === 1, "ABANDONED reread history", "active reread is missing");
    });

    await runTest("only one active reread is allowed per membership", async () => {
      const result = await userCClient.from("reading_sessions").insert({
        user_edition_id: membershipIds.get("finished"),
        status: "READING",
        started_at: "2026-09-23",
        progress_unit: "PAGES",
      });
      assertCode(result, "23505", "active reread uniqueness", "second active reread was not rejected");
      const rows = await userCClient
        .from("reading_sessions")
        .select("id")
        .eq("user_edition_id", membershipIds.get("finished"))
        .eq("status", "READING");
      assertNoError(rows.error, "active reread uniqueness", "active count verification failed");
      assert(rows.data.length === 1, "active reread uniqueness", "active session count is incorrect");
    });

    await runTest("C creates a READING session for concurrent closure", async () => {
      await createReadingSession("concurrent", 25, "PERCENT");
    });

    await runTest("concurrent FINISH and ABANDON produce one terminal state", async () => {
      const [finishResult, abandonResult] = await Promise.all([
        userCClient
          .from("reading_sessions")
          .update({ status: "FINISHED", finished_at: closedAt })
          .eq("id", sessionIds.get("concurrent"))
          .select("id"),
        userCClient
          .from("reading_sessions")
          .update({ status: "ABANDONED", abandoned_at: closedAt })
          .eq("id", sessionIds.get("concurrent"))
          .select("id"),
      ]);
      assertNoError(finishResult.error, "concurrent lifecycle", "FINISH request returned an error");
      assertNoError(abandonResult.error, "concurrent lifecycle", "ABANDON request returned an error");
      const affectedCounts = [finishResult.data.length, abandonResult.data.length].sort();
      assert(
        affectedCounts[0] === 0 && affectedCounts[1] === 1,
        "concurrent lifecycle",
        "concurrent requests did not produce one winner and one hidden row",
      );
      const row = await readSession(userCClient, sessionIds.get("concurrent"), "concurrent lifecycle");
      assert(
        row.status === "FINISHED" || row.status === "ABANDONED",
        "concurrent lifecycle",
        "session did not reach one terminal state",
      );
      assert(
        (row.status === "FINISHED" && row.finished_at === closedAt && row.abandoned_at === null)
          || (row.status === "ABANDONED" && row.abandoned_at === closedAt && row.finished_at === null),
        "concurrent lifecycle",
        "terminal dates are incoherent after concurrency",
      );
    });

    await runTest("all lifecycle fixtures remain available for cascade verification", async () => {
      const [memberships, sessions] = await Promise.all([
        userCClient.from("user_editions").select("id").in("id", [...membershipIds.values()]),
        userCClient.from("reading_sessions").select("id").in("user_edition_id", [...membershipIds.values()]),
      ]);
      assertNoError(memberships.error, "fixture preservation", "membership inventory failed");
      assertNoError(sessions.error, "fixture preservation", "session inventory failed");
      assert(memberships.data.length === 6, "fixture preservation", "membership fixture count is incorrect");
      assert(sessions.data.length === 8, "fixture preservation", "reading session fixture count is incorrect");
    });
  } catch (error) {
    reportFailure(error);
  } finally {
    if (!historyMustBePreserved) {
      if (membershipIds.size > 0) {
        await cleanup(
          await userCClient.from("user_editions").delete().in("id", [...membershipIds.values()]),
          "memberships were not removed after pre-history failure",
        );
      }
      if (workId) {
        await cleanup(
          await userAClient.from("editions").delete().eq("work_id", workId),
          "editions were not removed after pre-history failure",
        );
        await cleanup(
          await userAClient.from("works").delete().eq("id", workId),
          "work was not removed after pre-history failure",
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
    console.error("ACTION REQUIRED: preserve disposable user C and inspect lifecycle fixtures.");
    console.error(`Safe marker: ${marker}`);
    console.error(`Work fixtures created: ${workId ? 1 : 0}`);
    console.error(`Edition fixtures created: ${editionIds.size}`);
    console.error(`Membership fixtures created: ${membershipIds.size}`);
    console.error(`Reading session fixtures tracked: ${sessionIds.size}`);
    console.error("Protected reading history exists: yes");
  }
  if (!process.exitCode && testsRun === 34 && testsPassed === 34) {
    console.log("SETUP PASS");
    console.log(`marker: ${marker}`);
    console.log("work fixture: created by A");
    console.log("edition fixtures: 6 created by A");
    console.log("memberships: 6 created by C");
    console.log("reading sessions: 8 preserved for cascade verification");
    console.log("");
    console.log("DO NOT RERUN SETUP");
    console.log("Delete only disposable user C in Supabase Dashboard.");
    console.log("Then run verify-cleanup with the same marker.");
    console.log("");
    console.log("next:");
    console.log(
      `node --env-file=.env.local --env-file=.env.test.local scripts/test-reading-session-lifecycle-rls.mjs verify-cleanup --marker ${marker}`,
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

    const [works, editions] = await Promise.all([
      userAClient.from("works").select("id").eq("title", workTitle),
      userAClient.from("editions").select("id, work_id, edition_title").in("edition_title", allEditionTitles),
    ]);
    assertNoError(works.error, "fixture discovery", "work discovery failed");
    assertNoError(editions.error, "fixture discovery", "edition discovery failed");
    assert(works.data.length === 1, "fixture discovery", "expected exactly one work fixture");
    assert(editions.data.length === 6, "fixture discovery", "expected exactly six edition fixtures");
    assert(
      editions.data.every((edition) => edition.work_id === works.data[0].id),
      "fixture discovery",
      "an edition belongs to a different work",
    );
    assert(
      new Set(editions.data.map((edition) => edition.edition_title)).size === 6,
      "fixture discovery",
      "edition fixtures are not uniquely identifiable",
    );

    await runTest("A can delete every lifecycle edition after C deletion", async () => {
      const removed = await userAClient
        .from("editions")
        .delete()
        .in("id", editions.data.map((edition) => edition.id))
        .select("id");
      assertNoError(removed.error, "cascade verification", "lifecycle edition deletion failed");
      assert(removed.data.length === 6, "cascade verification", "one or more editions remained blocked");
    });

    await runTest("A removes the lifecycle work fixture", async () => {
      const removed = await userAClient
        .from("works")
        .delete()
        .eq("id", works.data[0].id)
        .select("id");
      assertNoError(removed.error, "work cleanup", "work fixture deletion failed");
      assert(removed.data.length === 1, "work cleanup", "work fixture was not deleted");
    });

    await runTest("no global lifecycle fixtures remain", async () => {
      const checks = await Promise.all([
        userAClient.from("works").select("id").eq("title", workTitle),
        userAClient.from("editions").select("id").in("edition_title", allEditionTitles),
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
