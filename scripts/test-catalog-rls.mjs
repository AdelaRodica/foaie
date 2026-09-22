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

function assertPermissionDenied(result, testName, description) {
  assert(
    result.error?.code === "42501",
    testName,
    description,
    result.error?.code,
  );
}

function assertRlsDeniedOrEmpty(result, testName, description) {
  if (result.error) {
    assertPermissionDenied(result, testName, description);
    return;
  }

  assert(
    Array.isArray(result.data) && result.data.length === 0,
    testName,
    description,
  );
}

function assertConstraintError(result, expectedCode, testName, description) {
  assert(
    result.error?.code === expectedCode,
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

async function verifySingleRow(client, table, id, columns, testName) {
  const result = await client.from(table).select(columns).eq("id", id);
  assertNoError(result.error, testName, "verification read failed");
  assert(
    result.data.length === 1 && result.data[0].id === id,
    testName,
    "expected row was not preserved",
  );
  return result.data[0];
}

async function verifySingleRelation(client, workId, authorId, testName) {
  const result = await client
    .from("work_authors")
    .select("work_id, author_id, position")
    .eq("work_id", workId)
    .eq("author_id", authorId);
  assertNoError(result.error, testName, "relationship verification failed");
  assert(result.data.length === 1, testName, "expected relationship was not preserved");
  return result.data[0];
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
    if (error instanceof SafeTestError) {
      throw error;
    }

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
const initialWorkATitle = `  FOAIE   CATALOG\tTEST ${runMarker}  `;
const normalizedWorkATitle = `foaie catalog test ${runMarker}`;
const updatedWorkATitle = `Foaie catalog revised ${runMarker}`;
const initialAuthorAName = `  AUTHOR   ALPHA\t${runMarker}  `;
const normalizedAuthorAName = `author alpha ${runMarker}`;

let userAId;
let userBId;
let workAId;
let workBId;
let negativeYearWorkId;
let authorAId;
let authorBId;
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

  await runTest("1. anon cannot read works", async () => {
    const result = await anonClient.from("works").select("id").limit(1);
    assertPermissionDenied(result, "1. anon cannot read works", "anonymous read was not denied");
  });

  await runTest("2. anon cannot read authors", async () => {
    const result = await anonClient.from("authors").select("id").limit(1);
    assertPermissionDenied(result, "2. anon cannot read authors", "anonymous read was not denied");
  });

  await runTest("3. A creates own work", async () => {
    const result = await userAClient
      .from("works")
      .insert({ title: initialWorkATitle })
      .select("id, created_by_profile_id, normalized_title, created_at, updated_at");
    assertNoError(result.error, "3. A creates own work", "allowed work insert failed");
    assert(result.data.length === 1, "3. A creates own work", "work was not returned");
    workAId = result.data[0].id;
    assert(
      result.data[0].created_by_profile_id === userAId,
      "3. A creates own work",
      "database did not assign user A as creator",
    );
  });

  await runTest("4. normalized_title is generated", async () => {
    const row = await verifySingleRow(
      userAClient,
      "works",
      workAId,
      "id, normalized_title",
      "4. normalized_title is generated",
    );
    assert(
      row.normalized_title === normalizedWorkATitle,
      "4. normalized_title is generated",
      "generated title did not normalize whitespace and case",
    );
  });

  await runTest("5. B reads A work", async () => {
    await verifySingleRow(userBClient, "works", workAId, "id", "5. B reads A work");
  });

  await runTest("6. B cannot update A work", async () => {
    const attempted = await userBClient
      .from("works")
      .update({ description: `unauthorized ${runMarker}` })
      .eq("id", workAId)
      .select("id");
    assertRlsDeniedOrEmpty(
      attempted,
      "6. B cannot update A work",
      "cross-user update was not denied",
    );
    const row = await verifySingleRow(
      userAClient,
      "works",
      workAId,
      "id, description",
      "6. B cannot update A work",
    );
    assert(row.description === null, "6. B cannot update A work", "work changed after denied update");
  });

  await runTest("7. B cannot delete A work", async () => {
    const attempted = await userBClient.from("works").delete().eq("id", workAId).select("id");
    assertRlsDeniedOrEmpty(
      attempted,
      "7. B cannot delete A work",
      "cross-user delete was not denied",
    );
    await verifySingleRow(userAClient, "works", workAId, "id", "7. B cannot delete A work");
  });

  await runTest("8. A updates own work and updated_at changes", async () => {
    const before = await verifySingleRow(
      userAClient,
      "works",
      workAId,
      "id, updated_at",
      "8. A updates own work and updated_at changes",
    );
    await wait(20);
    const updated = await userAClient
      .from("works")
      .update({ title: updatedWorkATitle })
      .eq("id", workAId)
      .select("id, title, updated_at");
    assertNoError(updated.error, "8. A updates own work and updated_at changes", "allowed update failed");
    assert(
      updated.data.length === 1 &&
        updated.data[0].title === updatedWorkATitle &&
        Date.parse(updated.data[0].updated_at) > Date.parse(before.updated_at),
      "8. A updates own work and updated_at changes",
      "work or updated_at did not change as expected",
    );
  });

  await runTest("9. A cannot forge created_by_profile_id", async () => {
    const forgedTitle = `Forged creator ${runMarker}`;
    const attempted = await userAClient
      .from("works")
      .insert({ title: forgedTitle, created_by_profile_id: userBId })
      .select("id");
    assertPermissionDenied(
      attempted,
      "9. A cannot forge created_by_profile_id",
      "protected creator column was accepted",
    );
    const verification = await userAClient.from("works").select("id").eq("title", forgedTitle);
    assertNoError(verification.error, "9. A cannot forge created_by_profile_id", "verification failed");
    assert(
      verification.data.length === 0,
      "9. A cannot forge created_by_profile_id",
      "forged work was created",
    );
  });

  await runTest("10. A cannot change created_by_profile_id", async () => {
    const attempted = await userAClient
      .from("works")
      .update({ created_by_profile_id: userBId })
      .eq("id", workAId)
      .select("id");
    assertPermissionDenied(
      attempted,
      "10. A cannot change created_by_profile_id",
      "protected creator column was updated",
    );
    const row = await verifySingleRow(
      userAClient,
      "works",
      workAId,
      "id, created_by_profile_id",
      "10. A cannot change created_by_profile_id",
    );
    assert(
      row.created_by_profile_id === userAId,
      "10. A cannot change created_by_profile_id",
      "work creator changed",
    );
  });

  await runTest("11. A creates an author", async () => {
    const result = await userAClient
      .from("authors")
      .insert({ name: initialAuthorAName })
      .select("id, created_by_profile_id, normalized_name");
    assertNoError(result.error, "11. A creates an author", "allowed author insert failed");
    assert(result.data.length === 1, "11. A creates an author", "author was not returned");
    authorAId = result.data[0].id;
    assert(
      result.data[0].created_by_profile_id === userAId,
      "11. A creates an author",
      "database did not assign user A as author creator",
    );
  });

  await runTest("12. normalized_name is generated", async () => {
    const row = await verifySingleRow(
      userAClient,
      "authors",
      authorAId,
      "id, normalized_name",
      "12. normalized_name is generated",
    );
    assert(
      row.normalized_name === normalizedAuthorAName,
      "12. normalized_name is generated",
      "generated author name did not normalize whitespace and case",
    );
  });

  await runTest("13. B reads A author", async () => {
    await verifySingleRow(userBClient, "authors", authorAId, "id", "13. B reads A author");
  });

  await runTest("14. B cannot update A author", async () => {
    const attempted = await userBClient
      .from("authors")
      .update({ sort_name: `Unauthorized ${runMarker}` })
      .eq("id", authorAId)
      .select("id");
    assertRlsDeniedOrEmpty(
      attempted,
      "14. B cannot update A author",
      "cross-user author update was not denied",
    );
    const row = await verifySingleRow(
      userAClient,
      "authors",
      authorAId,
      "id, sort_name",
      "14. B cannot update A author",
    );
    assert(row.sort_name === null, "14. B cannot update A author", "author changed after denied update");
  });

  await runTest("15. B cannot delete A author", async () => {
    const attempted = await userBClient.from("authors").delete().eq("id", authorAId).select("id");
    assertRlsDeniedOrEmpty(
      attempted,
      "15. B cannot delete A author",
      "cross-user author delete was not denied",
    );
    await verifySingleRow(userAClient, "authors", authorAId, "id", "15. B cannot delete A author");
  });

  await runTest("16. A links an author created by B to A work", async () => {
    const workB = await userBClient
      .from("works")
      .insert({ title: `B work ${runMarker}` })
      .select("id, created_by_profile_id");
    assertNoError(workB.error, "16. A links an author created by B to A work", "B work setup failed");
    assert(workB.data.length === 1, "16. A links an author created by B to A work", "B work missing");
    workBId = workB.data[0].id;
    assert(
      workB.data[0].created_by_profile_id === userBId,
      "16. A links an author created by B to A work",
      "B work creator was incorrect",
    );

    const authorB = await userBClient
      .from("authors")
      .insert({ name: `Author beta ${runMarker}` })
      .select("id, created_by_profile_id");
    assertNoError(authorB.error, "16. A links an author created by B to A work", "B author setup failed");
    assert(authorB.data.length === 1, "16. A links an author created by B to A work", "B author missing");
    authorBId = authorB.data[0].id;
    assert(
      authorB.data[0].created_by_profile_id === userBId,
      "16. A links an author created by B to A work",
      "B author creator was incorrect",
    );

    const relation = await userAClient
      .from("work_authors")
      .insert({ work_id: workAId, author_id: authorBId, position: 1 })
      .select("work_id, author_id, position");
    assertNoError(relation.error, "16. A links an author created by B to A work", "allowed relation insert failed");
    assert(relation.data.length === 1, "16. A links an author created by B to A work", "relation missing");
  });

  await runTest("17. B cannot add relations to A work", async () => {
    const attempted = await userBClient
      .from("work_authors")
      .insert({ work_id: workAId, author_id: authorAId, position: 2 })
      .select("work_id, author_id");
    assertRlsDeniedOrEmpty(
      attempted,
      "17. B cannot add relations to A work",
      "cross-user relation insert was not denied",
    );
    const verification = await userAClient
      .from("work_authors")
      .select("work_id")
      .eq("work_id", workAId)
      .eq("author_id", authorAId);
    assertNoError(verification.error, "17. B cannot add relations to A work", "verification failed");
    assert(verification.data.length === 0, "17. B cannot add relations to A work", "relation was created");
  });

  await runTest("18. A updates relation position", async () => {
    const result = await userAClient
      .from("work_authors")
      .update({ position: 2 })
      .eq("work_id", workAId)
      .eq("author_id", authorBId)
      .select("position");
    assertNoError(result.error, "18. A updates relation position", "allowed relation update failed");
    assert(
      result.data.length === 1 && result.data[0].position === 2,
      "18. A updates relation position",
      "relation position did not change",
    );
  });

  await runTest("19. B cannot update relation position on A work", async () => {
    const attempted = await userBClient
      .from("work_authors")
      .update({ position: 3 })
      .eq("work_id", workAId)
      .eq("author_id", authorBId)
      .select("position");
    assertRlsDeniedOrEmpty(
      attempted,
      "19. B cannot update relation position on A work",
      "cross-user relation update was not denied",
    );
    const relation = await verifySingleRelation(
      userAClient,
      workAId,
      authorBId,
      "19. B cannot update relation position on A work",
    );
    assert(relation.position === 2, "19. B cannot update relation position on A work", "position changed");
  });

  await runTest("20. B cannot delete relation on A work", async () => {
    const attempted = await userBClient
      .from("work_authors")
      .delete()
      .eq("work_id", workAId)
      .eq("author_id", authorBId)
      .select("work_id");
    assertRlsDeniedOrEmpty(
      attempted,
      "20. B cannot delete relation on A work",
      "cross-user relation delete was not denied",
    );
    await verifySingleRelation(userAClient, workAId, authorBId, "20. B cannot delete relation on A work");
  });

  await runTest("21. relation cannot be moved to another work", async () => {
    const attempted = await userAClient
      .from("work_authors")
      .update({ work_id: workBId })
      .eq("work_id", workAId)
      .eq("author_id", authorBId)
      .select("work_id");
    assertPermissionDenied(
      attempted,
      "21. relation cannot be moved to another work",
      "protected work_id update was not denied",
    );
    const relation = await verifySingleRelation(
      userAClient,
      workAId,
      authorBId,
      "21. relation cannot be moved to another work",
    );
    assert(relation.work_id === workAId, "21. relation cannot be moved to another work", "relation moved");
  });

  await runTest("22. duplicate author position is rejected", async () => {
    const attempted = await userAClient
      .from("work_authors")
      .insert({ work_id: workAId, author_id: authorAId, position: 2 })
      .select("work_id");
    assertConstraintError(
      attempted,
      "23505",
      "22. duplicate author position is rejected",
      "unique position constraint did not reject the insert",
    );
    const verification = await userAClient
      .from("work_authors")
      .select("work_id")
      .eq("work_id", workAId)
      .eq("author_id", authorAId);
    assertNoError(verification.error, "22. duplicate author position is rejected", "verification failed");
    assert(verification.data.length === 0, "22. duplicate author position is rejected", "duplicate remained");
  });

  await runTest("23. position zero is rejected", async () => {
    const attempted = await userAClient
      .from("work_authors")
      .insert({ work_id: workAId, author_id: authorAId, position: 0 })
      .select("work_id");
    assertConstraintError(
      attempted,
      "23514",
      "23. position zero is rejected",
      "position check did not reject zero",
    );
  });

  await runTest("24. used author cannot be deleted", async () => {
    const attempted = await userBClient.from("authors").delete().eq("id", authorBId).select("id");
    assertConstraintError(
      attempted,
      "23503",
      "24. used author cannot be deleted",
      "foreign key did not restrict author deletion",
    );
    await verifySingleRow(userAClient, "authors", authorBId, "id", "24. used author cannot be deleted");
  });

  await runTest("25. publication year zero is rejected", async () => {
    const invalidTitle = `Invalid year ${runMarker}`;
    const attempted = await userAClient
      .from("works")
      .insert({ title: invalidTitle, original_publication_year: 0 })
      .select("id");
    assertConstraintError(
      attempted,
      "23514",
      "25. publication year zero is rejected",
      "year check did not reject zero",
    );
    const verification = await userAClient.from("works").select("id").eq("title", invalidTitle);
    assertNoError(verification.error, "25. publication year zero is rejected", "verification failed");
    assert(verification.data.length === 0, "25. publication year zero is rejected", "invalid work remained");
  });

  await runTest("26. negative publication year is accepted", async () => {
    const result = await userAClient
      .from("works")
      .insert({ title: `Ancient work ${runMarker}`, original_publication_year: -500 })
      .select("id, original_publication_year");
    assertNoError(result.error, "26. negative publication year is accepted", "valid negative year failed");
    assert(
      result.data.length === 1 && result.data[0].original_publication_year === -500,
      "26. negative publication year is accepted",
      "negative year was not stored",
    );
    negativeYearWorkId = result.data[0].id;
  });

  await runTest("27. authenticated can read genres", async () => {
    const result = await userAClient.from("genres").select("id, name, slug").limit(1);
    assertNoError(result.error, "27. authenticated can read genres", "authenticated genre read failed");
    assert(Array.isArray(result.data), "27. authenticated can read genres", "genre result was invalid");
  });

  await runTest("28. A cannot insert genres", async () => {
    const result = await userAClient
      .from("genres")
      .insert({ name: `Genre A ${runMarker}`, slug: `genre-a-${runMarker}` })
      .select("id");
    assertPermissionDenied(result, "28. A cannot insert genres", "genre insert was not denied");
  });

  await runTest("29. B cannot insert genres", async () => {
    const result = await userBClient
      .from("genres")
      .insert({ name: `Genre B ${runMarker}`, slug: `genre-b-${runMarker}` })
      .select("id");
    assertPermissionDenied(result, "29. B cannot insert genres", "genre insert was not denied");
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
  const cleanupErrors = [];

  async function cleanup(result, description) {
    if (result.error) {
      cleanupErrors.push({ description, code: safeErrorCode(result.error.code) });
    }
  }

  if (workAId) {
    await cleanup(
      await userAClient.from("work_authors").delete().eq("work_id", workAId),
      "A work relationships were not removed",
    );
  }
  if (workBId) {
    await cleanup(
      await userBClient.from("work_authors").delete().eq("work_id", workBId),
      "B work relationships were not removed",
    );
  }
  if (workAId) {
    await cleanup(await userAClient.from("works").delete().eq("id", workAId), "A work was not removed");
  }
  if (negativeYearWorkId) {
    await cleanup(
      await userAClient.from("works").delete().eq("id", negativeYearWorkId),
      "negative-year work was not removed",
    );
  }
  if (workBId) {
    await cleanup(await userBClient.from("works").delete().eq("id", workBId), "B work was not removed");
  }
  if (authorAId) {
    await cleanup(
      await userAClient.from("authors").delete().eq("id", authorAId),
      "A author was not removed",
    );
  }
  if (authorBId) {
    await cleanup(
      await userBClient.from("authors").delete().eq("id", authorBId),
      "B author was not removed",
    );
  }

  if (userAId) {
    const remainingWorks = await userAClient
      .from("works")
      .select("id")
      .ilike("title", `%${runMarker}%`);
    const remainingAuthors = await userAClient
      .from("authors")
      .select("id")
      .ilike("name", `%${runMarker}%`);

    if (
      remainingWorks.error ||
      remainingAuthors.error ||
      remainingWorks.data.length > 0 ||
      remainingAuthors.data.length > 0
    ) {
      cleanupErrors.push({ description: "test rows remain after cleanup" });
    }
  }

  cleanupSucceeded = cleanupErrors.length === 0;

  for (const cleanupError of cleanupErrors) {
    const code = cleanupError.code ? ` [${cleanupError.code}]` : "";
    console.error(`FAIL  cleanup${code}: ${cleanupError.description}`);
  }

  if (!cleanupSucceeded) {
    process.exitCode = 1;
  }
}

if (testsRun === 29 && testsPassed === 29 && cleanupSucceeded && !process.exitCode) {
  console.log("29/29 tests passed");
  console.log("Cleanup verified: no catalog test rows remain");
  console.log("work_genres: positive policy tests pending Stage 3 seed");
}
