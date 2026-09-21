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
  return typeof code === "string" && /^[A-Z0-9_]{2,20}$/.test(code)
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

function isPermissionDenied(error) {
  return error?.code === "42501";
}

function isDeniedOrEmpty({ data, error }) {
  return isPermissionDenied(error) || (!error && Array.isArray(data) && data.length === 0);
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
  assert(
    Boolean(data.session?.user.id),
    testName,
    "authenticated session was not returned",
  );

  return data.session.user.id;
}

let testsRun = 0;
let testsPassed = 0;

async function runTest(name, test) {
  testsRun += 1;

  try {
    await test();
    testsPassed += 1;
    console.log(`PASS  ${name}`);
  } catch (error) {
    if (error instanceof SafeTestError) {
      throw error;
    }

    throw new SafeTestError(name, "unexpected test failure", error?.code);
  }
}

for (const variableName of requiredEnvironmentVariables) {
  if (!process.env[variableName]?.trim()) {
    console.error(`FAIL  setup [MISSING_ENV]: required test configuration is missing`);
    process.exit(1);
  }
}

const anonClient = createTestClient();
const userAClient = createTestClient();
const userBClient = createTestClient();

let userAId;
let userBId;
let originalADisplayName;
let originalBDisplayName;
let userADisplayNameChanged = false;
let cleanupSucceeded = true;

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

  const userAProfileResult = await userAClient
    .from("profiles")
    .select("id, display_name")
    .eq("id", userAId);
  assertNoError(
    userAProfileResult.error,
    "setup user A profile",
    "could not load the test profile",
  );
  assert(
    userAProfileResult.data.length === 1 && userAProfileResult.data[0].id === userAId,
    "setup user A profile",
    "expected test profile was not available",
  );
  originalADisplayName = userAProfileResult.data[0].display_name;

  const userBProfileResult = await userBClient
    .from("profiles")
    .select("id, display_name")
    .eq("id", userBId);
  assertNoError(
    userBProfileResult.error,
    "setup user B profile",
    "could not load the test profile",
  );
  assert(
    userBProfileResult.data.length === 1 && userBProfileResult.data[0].id === userBId,
    "setup user B profile",
    "expected test profile was not available",
  );
  originalBDisplayName = userBProfileResult.data[0].display_name;

  await runTest("A reads own profile", async () => {
    const result = await userAClient.from("profiles").select("id").eq("id", userAId);
    assertNoError(result.error, "A reads own profile", "profile read failed");
    assert(
      result.data.length === 1 && result.data[0].id === userAId,
      "A reads own profile",
      "expected own profile was not returned",
    );
  });

  await runTest("A cannot read B", async () => {
    const result = await userAClient.from("profiles").select("id").eq("id", userBId);
    assert(
      isDeniedOrEmpty(result),
      "A cannot read B",
      "another user's profile was visible",
      result.error?.code,
    );
  });

  await runTest("B reads own profile", async () => {
    const result = await userBClient.from("profiles").select("id").eq("id", userBId);
    assertNoError(result.error, "B reads own profile", "profile read failed");
    assert(
      result.data.length === 1 && result.data[0].id === userBId,
      "B reads own profile",
      "expected own profile was not returned",
    );
  });

  await runTest("B cannot read A", async () => {
    const result = await userBClient.from("profiles").select("id").eq("id", userAId);
    assert(
      isDeniedOrEmpty(result),
      "B cannot read A",
      "another user's profile was visible",
      result.error?.code,
    );
  });

  await runTest("A updates own display name", async () => {
    const result = await userAClient
      .from("profiles")
      .update({ display_name: `RLS test ${randomUUID()}` })
      .eq("id", userAId)
      .select("id");
    assertNoError(result.error, "A updates own display name", "allowed update failed");
    assert(
      result.data.length === 1 && result.data[0].id === userAId,
      "A updates own display name",
      "allowed update did not return the expected profile",
    );
    userADisplayNameChanged = true;
  });

  await runTest("A cannot update B", async () => {
    const attemptedUpdate = await userAClient
      .from("profiles")
      .update({ display_name: `RLS test ${randomUUID()}` })
      .eq("id", userBId)
      .select("id");
    assert(
      isDeniedOrEmpty(attemptedUpdate),
      "A cannot update B",
      "another user's profile was updated",
      attemptedUpdate.error?.code,
    );

    const verification = await userBClient
      .from("profiles")
      .select("id, display_name")
      .eq("id", userBId);
    assertNoError(verification.error, "A cannot update B", "verification read failed");
    assert(
      verification.data.length === 1 &&
        verification.data[0].id === userBId &&
        verification.data[0].display_name === originalBDisplayName,
      "A cannot update B",
      "another user's profile changed",
    );
  });

  await runTest("A cannot update status", async () => {
    const result = await userAClient
      .from("profiles")
      .update({ status: "SUSPENDED" })
      .eq("id", userAId)
      .select("id");
    assert(
      isPermissionDenied(result.error),
      "A cannot update status",
      "restricted column update was not denied",
      result.error?.code,
    );
  });

  await runTest("A cannot update id", async () => {
    const result = await userAClient
      .from("profiles")
      .update({ id: userAId })
      .eq("id", userAId)
      .select("id");
    assert(
      isPermissionDenied(result.error),
      "A cannot update id",
      "restricted column update was not denied",
      result.error?.code,
    );
  });

  await runTest("A cannot insert profiles", async () => {
    const result = await userAClient
      .from("profiles")
      .insert({ id: randomUUID() })
      .select("id");
    assert(
      isPermissionDenied(result.error),
      "A cannot insert profiles",
      "arbitrary profile insertion was not denied",
      result.error?.code,
    );
  });

  await runTest("A cannot delete profiles", async () => {
    const deletion = await userAClient
      .from("profiles")
      .delete()
      .eq("id", userAId)
      .select("id");
    assert(
      isPermissionDenied(deletion.error),
      "A cannot delete profiles",
      "profile deletion was not denied",
      deletion.error?.code,
    );

    const verification = await userAClient
      .from("profiles")
      .select("id")
      .eq("id", userAId);
    assertNoError(
      verification.error,
      "A cannot delete profiles",
      "post-delete verification failed",
    );
    assert(
      verification.data.length === 1 && verification.data[0].id === userAId,
      "A cannot delete profiles",
      "profile was not preserved",
    );
  });

  await runTest("Anon cannot read profiles", async () => {
    const result = await anonClient.from("profiles").select("id");
    assert(
      isDeniedOrEmpty(result),
      "Anon cannot read profiles",
      "anonymous profile read was not denied",
      result.error?.code,
    );
  });
} catch (error) {
  const safeError =
    error instanceof SafeTestError
      ? error
      : new SafeTestError("setup", "unexpected integration test failure", error?.code);
  const code = safeError.code ? ` [${safeError.code}]` : "";
  console.error(`FAIL  ${safeError.testName}${code}: ${safeError.message}`);
  process.exitCode = 1;
} finally {
  if (userADisplayNameChanged) {
    const restoration = await userAClient
      .from("profiles")
      .update({ display_name: originalADisplayName })
      .eq("id", userAId)
      .select("id, display_name");

    cleanupSucceeded =
      !restoration.error &&
      restoration.data.length === 1 &&
      restoration.data[0].id === userAId &&
      restoration.data[0].display_name === originalADisplayName;

    if (!cleanupSucceeded) {
      const code = safeErrorCode(restoration.error?.code);
      console.error(
        `FAIL  cleanup${code ? ` [${code}]` : ""}: original profile value was not restored`,
      );
      process.exitCode = 1;
    }
  }
}

if (testsRun === 11 && testsPassed === 11 && cleanupSucceeded && !process.exitCode) {
  console.log("11/11 tests passed");
}
