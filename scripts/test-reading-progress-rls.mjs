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

const workTitle = `Reading progress RLS work ${marker}`;
const editionTitles = {
  base: `Reading progress base edition ${marker}`,
  percent: `Reading progress percent rollback edition ${marker}`,
  terminal: `Reading progress terminal edition ${marker}`,
  concurrentProgress: `Reading progress concurrent progress edition ${marker}`,
  concurrentFinish: `Reading progress concurrent finish edition ${marker}`,
};
const allEditionTitles = Object.values(editionTitles);
const startedAt = "2026-09-20";
const nextDay = "2026-09-21";
const secondDay = "2026-09-22";
const thirdDay = "2026-09-23";
const beforeStart = "2026-09-19";

function recordProgress(client, sessionId, targetValue, kind, occurredOn) {
  return client.rpc("record_reading_progress", {
    p_reading_session_id: sessionId,
    p_target_value: targetValue,
    p_kind: kind,
    p_occurred_on: occurredOn,
  });
}

async function readProgressState(client, sessionId, testName) {
  const [session, entries] = await Promise.all([
    client
      .from("reading_sessions")
      .select("id, status, started_at, current_value, progress_unit")
      .eq("id", sessionId),
    client
      .from("progress_entries")
      .select("id, reading_session_id, kind, previous_value, new_value, occurred_on, created_at")
      .eq("reading_session_id", sessionId)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }),
  ]);
  assertNoError(session.error, testName, "session verification failed");
  assertNoError(entries.error, testName, "progress history verification failed");
  assert(session.data.length === 1, testName, "expected session is not visible");
  return { session: session.data[0], entries: entries.data };
}

function assertSnapshot(state, expectedValue, expectedEntries, testName) {
  assert(state.session.current_value === expectedValue, testName, "snapshot value changed unexpectedly");
  assert(state.entries.length === expectedEntries, testName, "progress entry count changed unexpectedly");
}

function assertRpcEntry(result, expected, testName) {
  assertNoError(result.error, testName, "progress RPC returned an error");
  assert(result.data.length === 1, testName, "progress RPC did not return exactly one row");
  const row = result.data[0];
  const expectedKeys = [
    "created_at",
    "id",
    "kind",
    "new_value",
    "occurred_on",
    "previous_value",
    "reading_session_id",
  ];
  assert(
    JSON.stringify(Object.keys(row).sort()) === JSON.stringify(expectedKeys),
    testName,
    "RPC return contract contains missing or unexpected fields",
  );
  assert(uuidPattern.test(row.id), testName, "progress entry UUID is invalid");
  assert(row.reading_session_id === expected.sessionId, testName, "RPC returned a different session");
  assert(row.kind === expected.kind, testName, "RPC returned a different kind");
  assert(row.previous_value === expected.previousValue, testName, "RPC returned a different previous value");
  assert(row.new_value === expected.newValue, testName, "RPC returned a different new value");
  assert(row.occurred_on === expected.occurredOn, testName, "RPC returned a different occurrence date");
  assert(Boolean(row.created_at), testName, "RPC did not return created_at");
  return row;
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
  const progressEntryIds = new Set();
  let historyMustBePreserved = false;
  const cleanupErrors = [];

  async function cleanup(result, description) {
    if (result.error) cleanupErrors.push({ description, code: result.error.code });
  }

  async function createFixture(key, currentValue, progressUnit) {
    const edition = await userAClient
      .from("editions")
      .insert({ work_id: workId, edition_title: editionTitles[key], format: "PHYSICAL" })
      .select("id")
      .single();
    assertNoError(edition.error, `${key} edition`, "edition fixture creation failed");
    editionIds.set(key, edition.data.id);

    const membership = await userCClient
      .from("user_editions")
      .insert({ edition_id: edition.data.id })
      .select("id")
      .single();
    assertNoError(membership.error, `${key} membership`, "membership fixture creation failed");
    membershipIds.set(key, membership.data.id);

    const session = await userCClient
      .from("reading_sessions")
      .insert({
        user_edition_id: membership.data.id,
        status: "READING",
        started_at: startedAt,
        current_value: currentValue,
        progress_unit: progressUnit,
      })
      .select("id")
      .single();
    assertNoError(session.error, `${key} session`, "reading session fixture creation failed");
    assert(uuidPattern.test(session.data.id), `${key} session`, "database UUID is invalid");
    sessionIds.set(key, session.data.id);
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

    await runTest("C creates a base PAGES reading session at 50", async () => {
      await createFixture("base", 50, "PAGES");
    });

    await runTest("PROGRESS stores 50 to 60 and updates the snapshot", async () => {
      const result = await recordProgress(userCClient, sessionIds.get("base"), 60, "PROGRESS", nextDay);
      const row = assertRpcEntry(result, {
        sessionId: sessionIds.get("base"),
        kind: "PROGRESS",
        previousValue: 50,
        newValue: 60,
        occurredOn: nextDay,
      }, "base PROGRESS");
      progressEntryIds.add(row.id);
      const state = await readProgressState(userCClient, sessionIds.get("base"), "base PROGRESS");
      assertSnapshot(state, 60, 1, "base PROGRESS");
    });

    await runTest("descending CORRECTION stores 60 to 55", async () => {
      const result = await recordProgress(userCClient, sessionIds.get("base"), 55, "CORRECTION", secondDay);
      const row = assertRpcEntry(result, {
        sessionId: sessionIds.get("base"),
        kind: "CORRECTION",
        previousValue: 60,
        newValue: 55,
        occurredOn: secondDay,
      }, "descending CORRECTION");
      progressEntryIds.add(row.id);
      const state = await readProgressState(userCClient, sessionIds.get("base"), "descending CORRECTION");
      assertSnapshot(state, 55, 2, "descending CORRECTION");
    });

    await runTest("ascending CORRECTION remains CORRECTION and stores 55 to 58", async () => {
      const result = await recordProgress(userCClient, sessionIds.get("base"), 58, "CORRECTION", thirdDay);
      const row = assertRpcEntry(result, {
        sessionId: sessionIds.get("base"),
        kind: "CORRECTION",
        previousValue: 55,
        newValue: 58,
        occurredOn: thirdDay,
      }, "ascending CORRECTION");
      progressEntryIds.add(row.id);
      const state = await readProgressState(userCClient, sessionIds.get("base"), "ascending CORRECTION");
      assertSnapshot(state, 58, 3, "ascending CORRECTION");
    });

    await runTest("C can read its own progress entries", async () => {
      const result = await userCClient
        .from("progress_entries")
        .select("id")
        .eq("reading_session_id", sessionIds.get("base"));
      assertNoError(result.error, "C progress SELECT", "own progress SELECT failed");
      assert(result.data.length === 3, "C progress SELECT", "own progress history is incomplete");
    });

    await runTest("B cannot read C progress entries", async () => {
      const result = await userBClient
        .from("progress_entries")
        .select("id")
        .eq("reading_session_id", sessionIds.get("base"));
      assertNoError(result.error, "B progress isolation", "cross-user SELECT returned an error");
      assert(result.data.length === 0, "B progress isolation", "C progress history leaked to B");
    });

    await runTest("anon cannot read progress entries", async () => {
      const result = await anonClient.from("progress_entries").select("id").limit(1);
      assertPermissionDenied(result, "anon progress SELECT", "anonymous SELECT was not denied");
    });

    await runTest("B RPC on C session returns zero rows without mutation", async () => {
      const before = await readProgressState(userCClient, sessionIds.get("base"), "B foreign RPC");
      const result = await recordProgress(userBClient, sessionIds.get("base"), 70, "PROGRESS", thirdDay);
      assertNoError(result.error, "B foreign RPC", "cross-user RPC returned an error");
      assert(result.data.length === 0, "B foreign RPC", "cross-user RPC returned a row");
      const after = await readProgressState(userCClient, sessionIds.get("base"), "B foreign RPC");
      assertSnapshot(after, before.session.current_value, before.entries.length, "B foreign RPC");
    });

    await runTest("authenticated RPC on an unknown UUID returns zero rows", async () => {
      const result = await recordProgress(userCClient, crypto.randomUUID(), 1, "PROGRESS", nextDay);
      assertNoError(result.error, "unknown session RPC", "unknown-session RPC returned an error");
      assert(result.data.length === 0, "unknown session RPC", "unknown-session RPC returned a row");
    });

    await runTest("anon cannot execute the progress RPC", async () => {
      const result = await recordProgress(anonClient, crypto.randomUUID(), 1, "PROGRESS", nextDay);
      assertPermissionDenied(result, "anon progress RPC", "anonymous RPC was not denied");
    });

    const firstEntryId = [...progressEntryIds][0];
    await runTest("authenticated cannot INSERT progress_entries directly", async () => {
      const result = await userCClient.from("progress_entries").insert({
        reading_session_id: sessionIds.get("base"),
        kind: "PROGRESS",
        previous_value: 58,
        new_value: 59,
        occurred_on: thirdDay,
      });
      assertPermissionDenied(result, "direct progress INSERT", "direct INSERT was not denied");
    });

    await runTest("authenticated cannot UPDATE progress_entries directly", async () => {
      const result = await userCClient
        .from("progress_entries")
        .update({ new_value: 59 })
        .eq("id", firstEntryId)
        .select("id");
      assertPermissionDenied(result, "direct progress UPDATE", "direct UPDATE was not denied");
    });

    await runTest("authenticated cannot DELETE progress_entries directly", async () => {
      const result = await userCClient
        .from("progress_entries")
        .delete()
        .eq("id", firstEntryId)
        .select("id");
      assertPermissionDenied(result, "direct progress DELETE", "direct DELETE was not denied");
    });

    await runTest("authenticated cannot UPDATE current_value directly", async () => {
      const result = await userCClient
        .from("reading_sessions")
        .update({ current_value: 59 })
        .eq("id", sessionIds.get("base"))
        .select("id");
      assertPermissionDenied(result, "direct snapshot UPDATE", "direct current_value UPDATE was not denied");
    });

    for (const [name, targetValue, kind, expectedCode] of [
      ["PROGRESS no-op", 58, "PROGRESS", "23514"],
      ["PROGRESS decrement", 57, "PROGRESS", "23514"],
      ["CORRECTION no-op", 58, "CORRECTION", "23514"],
      ["negative target", -1, "CORRECTION", "23514"],
      ["invalid kind", 59, "INVALID", "23514"],
    ]) {
      await runTest(`${name} rolls back without changing state`, async () => {
        const result = await recordProgress(
          userCClient,
          sessionIds.get("base"),
          targetValue,
          kind,
          thirdDay,
        );
        assertCode(result, expectedCode, name, `${name} was not rejected`);
        const state = await readProgressState(userCClient, sessionIds.get("base"), name);
        assertSnapshot(state, 58, 3, name);
      });
    }

    for (const [name, targetValue, kind, occurredOn] of [
      ["null target", null, "PROGRESS", thirdDay],
      ["null kind", 59, null, thirdDay],
      ["null occurred_on", 59, "PROGRESS", null],
    ]) {
      await runTest(`${name} is rejected without partial state`, async () => {
        const result = await recordProgress(
          userCClient,
          sessionIds.get("base"),
          targetValue,
          kind,
          occurredOn,
        );
        assertCode(result, "23502", name, `${name} was not rejected by NOT NULL`);
        const state = await readProgressState(userCClient, sessionIds.get("base"), name);
        assertSnapshot(state, 58, 3, name);
      });
    }

    await runTest("occurred_on before started_at is rejected without partial state", async () => {
      const result = await recordProgress(
        userCClient,
        sessionIds.get("base"),
        59,
        "PROGRESS",
        beforeStart,
      );
      assertCode(result, "23514", "early occurred_on", "early occurrence date was not rejected");
      const state = await readProgressState(userCClient, sessionIds.get("base"), "early occurred_on");
      assertSnapshot(state, 58, 3, "early occurred_on");
    });

    await runTest("occurred_on equal to started_at is accepted", async () => {
      const result = await recordProgress(
        userCClient,
        sessionIds.get("base"),
        59,
        "PROGRESS",
        startedAt,
      );
      const row = assertRpcEntry(result, {
        sessionId: sessionIds.get("base"),
        kind: "PROGRESS",
        previousValue: 58,
        newValue: 59,
        occurredOn: startedAt,
      }, "started_at boundary");
      progressEntryIds.add(row.id);
      const state = await readProgressState(userCClient, sessionIds.get("base"), "started_at boundary");
      assertSnapshot(state, 59, 4, "started_at boundary");
    });

    await runTest("C creates a PERCENT session at 40 for rollback verification", async () => {
      await createFixture("percent", 40, "PERCENT");
    });

    await runTest("PERCENT above 100 rolls back both entry and snapshot", async () => {
      const result = await recordProgress(
        userCClient,
        sessionIds.get("percent"),
        101,
        "PROGRESS",
        nextDay,
      );
      assertCode(result, "23514", "PERCENT rollback", "PERCENT above 100 was not rejected");
      const state = await readProgressState(userCClient, sessionIds.get("percent"), "PERCENT rollback");
      assertSnapshot(state, 40, 0, "PERCENT rollback");
    });

    await runTest("entry constraint failure leaves the snapshot unchanged", async () => {
      const result = await recordProgress(
        userCClient,
        sessionIds.get("base"),
        40,
        "PROGRESS",
        thirdDay,
      );
      assertCode(result, "23514", "INSERT rollback", "decreasing PROGRESS was not rejected");
      const state = await readProgressState(userCClient, sessionIds.get("base"), "INSERT rollback");
      assertSnapshot(state, 59, 4, "INSERT rollback");
    });

    await runTest("C creates and finishes a terminal session", async () => {
      await createFixture("terminal", 10, "PAGES");
      const result = await userCClient
        .from("reading_sessions")
        .update({ status: "FINISHED", finished_at: nextDay })
        .eq("id", sessionIds.get("terminal"))
        .select("id");
      assertNoError(result.error, "terminal fixture", "FINISHED update failed");
      assert(result.data.length === 1, "terminal fixture", "session was not closed");
    });

    await runTest("progress RPC on a terminal session returns zero rows", async () => {
      const result = await recordProgress(
        userCClient,
        sessionIds.get("terminal"),
        11,
        "PROGRESS",
        nextDay,
      );
      assertNoError(result.error, "terminal progress", "terminal RPC returned an error");
      assert(result.data.length === 0, "terminal progress", "terminal RPC returned a row");
      const state = await readProgressState(userCClient, sessionIds.get("terminal"), "terminal progress");
      assert(state.session.status === "FINISHED", "terminal progress", "terminal status changed");
      assertSnapshot(state, 10, 0, "terminal progress");
    });

    await runTest("concurrent PROGRESS requests serialize on the session row", async () => {
      await createFixture("concurrentProgress", 50, "PAGES");
      const sessionId = sessionIds.get("concurrentProgress");
      const [to60, to70] = await Promise.all([
        recordProgress(userCClient, sessionId, 60, "PROGRESS", nextDay),
        recordProgress(userCClient, sessionId, 70, "PROGRESS", nextDay),
      ]);
      const results = [to60, to70];
      assert(
        results.every((result) => !result.error || result.error.code === "23514"),
        "concurrent PROGRESS",
        "a concurrent request returned an unexpected error",
        results.find((result) => result.error)?.error?.code,
      );
      const successfulRows = results.flatMap((result) => result.data ?? []);
      assert(
        successfulRows.length === 1 || successfulRows.length === 2,
        "concurrent PROGRESS",
        "concurrent progress produced an invalid winner count",
      );
      const state = await readProgressState(userCClient, sessionId, "concurrent PROGRESS");
      assert(state.session.current_value === 70, "concurrent PROGRESS", "final snapshot is not 70");
      assert(state.entries.length === successfulRows.length, "concurrent PROGRESS", "entry count differs from successful calls");
      const transitions = state.entries.map((entry) => `${entry.previous_value}->${entry.new_value}`);
      const valid = transitions.length === 1
        ? transitions[0] === "50->70"
        : transitions.includes("50->60") && transitions.includes("60->70");
      assert(valid, "concurrent PROGRESS", "history shows stale previous_value or incoherent serialization");
      for (const entry of state.entries) progressEntryIds.add(entry.id);
    });

    await runTest("concurrent PROGRESS and FINISH produce one coherent terminal state", async () => {
      await createFixture("concurrentFinish", 20, "PAGES");
      const sessionId = sessionIds.get("concurrentFinish");
      const [progressResult, finishResult] = await Promise.all([
        recordProgress(userCClient, sessionId, 30, "PROGRESS", nextDay),
        userCClient
          .from("reading_sessions")
          .update({ status: "FINISHED", finished_at: nextDay })
          .eq("id", sessionId)
          .eq("status", "READING")
          .select("id"),
      ]);
      assertNoError(progressResult.error, "concurrent progress/finish", "progress request returned an error");
      assertNoError(finishResult.error, "concurrent progress/finish", "finish request returned an error");
      assert(finishResult.data.length === 1, "concurrent progress/finish", "finish did not close the session");
      assert(
        progressResult.data.length === 0 || progressResult.data.length === 1,
        "concurrent progress/finish",
        "progress returned an invalid row count",
      );
      const state = await readProgressState(userCClient, sessionId, "concurrent progress/finish");
      assert(state.session.status === "FINISHED", "concurrent progress/finish", "final status is not FINISHED");
      if (progressResult.data.length === 1) {
        assertSnapshot(state, 30, 1, "concurrent progress/finish");
        assert(
          state.entries[0].previous_value === 20 && state.entries[0].new_value === 30,
          "concurrent progress/finish",
          "winning progress entry is incoherent",
        );
        progressEntryIds.add(state.entries[0].id);
      } else {
        assertSnapshot(state, 20, 0, "concurrent progress/finish");
      }
    });

    await runTest("history ordering and persisted kinds are stable", async () => {
      const tiedDateResult = await recordProgress(
        userCClient,
        sessionIds.get("base"),
        61,
        "CORRECTION",
        thirdDay,
      );
      const tiedDateEntry = assertRpcEntry(tiedDateResult, {
        sessionId: sessionIds.get("base"),
        kind: "CORRECTION",
        previousValue: 59,
        newValue: 61,
        occurredOn: thirdDay,
      }, "history ordering");
      progressEntryIds.add(tiedDateEntry.id);

      const state = await readProgressState(userCClient, sessionIds.get("base"), "history ordering");
      assertSnapshot(state, 61, 5, "history ordering");
      assert(
        JSON.stringify(state.entries.map((entry) => entry.occurred_on))
          === JSON.stringify([thirdDay, thirdDay, secondDay, nextDay, startedAt]),
        "history ordering",
        "history is not ordered by occurred_on descending",
      );
      for (let index = 0; index < state.entries.length - 1; index += 1) {
        const current = state.entries[index];
        const next = state.entries[index + 1];
        const ordered = current.occurred_on > next.occurred_on
          || (
            current.occurred_on === next.occurred_on
            && (
              current.created_at > next.created_at
              || (current.created_at === next.created_at && current.id > next.id)
            )
          );
        assert(ordered, "history ordering", "history tie-break order is unstable");
      }
      assert(
        state.entries.some((entry) => entry.previous_value === 55 && entry.new_value === 58 && entry.kind === "CORRECTION"),
        "history ordering",
        "ascending correction did not preserve its explicit kind",
      );
      assert(
        state.entries.filter((entry) => entry.kind === "CORRECTION").length === 3,
        "history ordering",
        "correction kinds were not persisted exactly",
      );
    });

    await runTest("all progress fixtures remain available for cascade verification", async () => {
      const [memberships, sessions, entries] = await Promise.all([
        userCClient.from("user_editions").select("id").in("id", [...membershipIds.values()]),
        userCClient.from("reading_sessions").select("id").in("id", [...sessionIds.values()]),
        userCClient.from("progress_entries").select("id").in("reading_session_id", [...sessionIds.values()]),
      ]);
      assertNoError(memberships.error, "fixture preservation", "membership inventory failed");
      assertNoError(sessions.error, "fixture preservation", "session inventory failed");
      assertNoError(entries.error, "fixture preservation", "progress entry inventory failed");
      assert(memberships.data.length === 5, "fixture preservation", "membership fixture count is incorrect");
      assert(sessions.data.length === 5, "fixture preservation", "session fixture count is incorrect");
      assert(entries.data.length >= 6, "fixture preservation", "progress history was not preserved");
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
    console.error("ACTION REQUIRED: preserve disposable user C and inspect progress fixtures.");
    console.error(`Safe marker: ${marker}`);
    console.error(`Work fixtures created: ${workId ? 1 : 0}`);
    console.error(`Edition fixtures created: ${editionIds.size}`);
    console.error(`Membership fixtures created: ${membershipIds.size}`);
    console.error(`Reading session fixtures tracked: ${sessionIds.size}`);
    console.error(`Progress entries tracked: ${progressEntryIds.size}`);
  }
  if (!process.exitCode && testsRun === 34 && testsPassed === 34) {
    console.log("SETUP PASS");
    console.log(`marker: ${marker}`);
    console.log("work fixture: 1 created by A");
    console.log("edition fixtures: 5 created by A");
    console.log("memberships: 5 created by C");
    console.log("reading sessions: 5 created by C");
    console.log("progress entries: preserved for cascade verification");
    console.log("");
    console.log("DO NOT RERUN SETUP");
    console.log("Delete only disposable user C in Supabase Dashboard.");
    console.log("Then run verify-cleanup with the same marker.");
    console.log("");
    console.log("next:");
    console.log(
      `node --env-file=.env.local --env-file=.env.test.local scripts/test-reading-progress-rls.mjs verify-cleanup --marker ${marker}`,
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
    assert(editions.data.length === 5, "fixture discovery", "expected exactly five edition fixtures");
    assert(
      editions.data.every((edition) => edition.work_id === works.data[0].id),
      "fixture discovery",
      "an edition belongs to a different work",
    );
    assert(
      new Set(editions.data.map((edition) => edition.edition_title)).size === 5,
      "fixture discovery",
      "edition fixtures are not uniquely identifiable",
    );

    await runTest("A can delete every progress edition after C deletion", async () => {
      const removed = await userAClient
        .from("editions")
        .delete()
        .in("id", editions.data.map((edition) => edition.id))
        .select("id");
      assertNoError(removed.error, "cascade verification", "progress edition deletion failed");
      assert(removed.data.length === 5, "cascade verification", "one or more editions remained blocked");
    });

    await runTest("A removes the progress work fixture", async () => {
      const removed = await userAClient
        .from("works")
        .delete()
        .eq("id", works.data[0].id)
        .select("id");
      assertNoError(removed.error, "work cleanup", "work fixture deletion failed");
      assert(removed.data.length === 1, "work cleanup", "work fixture was not deleted");
    });

    await runTest("no global progress fixtures remain", async () => {
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
