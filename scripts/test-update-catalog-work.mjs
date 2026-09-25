import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "FOAIE_TEST_USER_A_EMAIL", "FOAIE_TEST_USER_A_PASSWORD",
  "FOAIE_TEST_USER_B_EMAIL", "FOAIE_TEST_USER_B_PASSWORD",
];

class SafeTestError extends Error {
  constructor(test, message, code) {
    super(message);
    this.test = test;
    this.code = safeCode(code);
  }
}

const safeCode = (code) =>
  typeof code === "string" && /^[A-Za-z0-9_-]{2,50}$/.test(code)
    ? code
    : undefined;

function assert(value, test, message, code) {
  if (!value) throw new SafeTestError(test, message, code);
}

function noError(error, test, message) {
  if (error) throw new SafeTestError(test, message, error.code);
}

function codeIs(result, code, test) {
  assert(
    result.error?.code === code,
    test,
    `expected ${code}`,
    result.error?.code,
  );
}

function client() {
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

async function authenticate(api, email, password, testName) {
  const { data, error } = await api.auth.signInWithPassword({ email, password });
  noError(error, testName, "authentication failed");
  assert(data.user?.id, testName, "authenticated identity missing");
}

const marker = randomUUID().replaceAll("-", "").slice(0, 14);
const anon = client();
const a = client();
const b = client();
const fixture = {
  workId: undefined,
  authorAId: undefined,
  authorBId: undefined,
  seriesAId: undefined,
  seriesBId: undefined,
};
let tests = 0;
let passed = 0;
let skipped = 0;

function work(title) {
  return {
    title,
    original_title: null,
    description: `Update RPC fixture ${marker}`,
    original_publication_year: 1963,
    original_language_code: "es",
  };
}

function args(title, extra = {}) {
  return {
    p_work_id: fixture.workId,
    p_work: work(title),
    p_author_relations: [],
    p_genre_relations: [],
    p_series_relations: [],
    ...extra,
  };
}

async function rpc(api, payload) {
  return api.rpc("update_catalog_work", payload);
}

async function test(name, operation) {
  tests += 1;
  await operation();
  passed += 1;
  console.log(`PASS  ${tests}. ${name}`);
}

function skip(name, reason) {
  tests += 1;
  skipped += 1;
  console.log(`SKIP  ${tests}. ${name}: ${reason}`);
}

async function insertFixture(api, table, values, testName) {
  const result = await api.from(table).insert(values).select("id").single();
  noError(result.error, testName, `could not create ${table} fixture`);
  return result.data.id;
}

async function readState(testName) {
  const results = await Promise.all([
    a.from("works")
      .select("title,normalized_title,description,original_publication_year,original_language_code,updated_at")
      .eq("id", fixture.workId)
      .single(),
    a.from("work_authors")
      .select("author_id,position")
      .eq("work_id", fixture.workId)
      .order("position"),
    a.from("work_genres")
      .select("genre_id,is_primary")
      .eq("work_id", fixture.workId)
      .order("genre_id"),
    a.from("work_series")
      .select("series_id,position,position_label")
      .eq("work_id", fixture.workId)
      .order("series_id"),
  ]);
  for (const result of results) {
    noError(result.error, testName, "could not read fixture state");
  }
  return {
    work: results[0].data,
    authors: results[1].data,
    genres: results[2].data,
    series: results[3].data,
  };
}

async function assertUnchanged(before, testName) {
  const after = await readState(testName);
  assert(
    JSON.stringify(after) === JSON.stringify(before),
    testName,
    "work or relations changed despite rejected update",
  );
}

async function updateSuccessfully(payload, testName) {
  const result = await rpc(a, payload);
  noError(result.error, testName, "RPC failed");
  assert(
    Array.isArray(result.data) && result.data.length === 1,
    testName,
    "RPC did not return exactly one row",
  );
  assert(
    result.data[0].work_id === fixture.workId,
    testName,
    "RPC returned a different work",
  );
}

async function restoreBaseline(testName) {
  await updateSuccessfully(args(`Baseline ${marker}`, {
    p_author_relations: [{ author_id: fixture.authorAId, position: 1 }],
    p_series_relations: [{
      series_id: fixture.seriesAId,
      position: 1,
      position_label: "Inicio",
    }],
  }), testName);
}

async function rejectedUpdate(name, payload, expectedCode) {
  await restoreBaseline(`${name} baseline`);
  const before = await readState(name);
  await test(name, async () => {
    const result = await rpc(a, payload);
    codeIs(result, expectedCode, name);
    await assertUnchanged(before, name);
  });
}

for (const name of required) {
  if (!process.env[name]?.trim()) {
    console.error("FAIL setup [MISSING_ENV]");
    process.exit(1);
  }
}

let cleanupOk = true;
try {
  await authenticate(
    a,
    process.env.FOAIE_TEST_USER_A_EMAIL,
    process.env.FOAIE_TEST_USER_A_PASSWORD,
    "user A setup",
  );
  await authenticate(
    b,
    process.env.FOAIE_TEST_USER_B_EMAIL,
    process.env.FOAIE_TEST_USER_B_PASSWORD,
    "user B setup",
  );

  fixture.authorAId = await insertFixture(
    a,
    "authors",
    { name: `Update author A ${marker}` },
    "author A fixture",
  );
  fixture.authorBId = await insertFixture(
    b,
    "authors",
    { name: `Update author B ${marker}` },
    "author B fixture",
  );
  fixture.seriesAId = await insertFixture(
    a,
    "series",
    { name: `Update series A ${marker}` },
    "series A fixture",
  );
  fixture.seriesBId = await insertFixture(
    b,
    "series",
    { name: `Update series B ${marker}` },
    "series B fixture",
  );
  fixture.workId = await insertFixture(
    a,
    "works",
    work(`Initial ${marker}`),
    "work fixture",
  );
  await restoreBaseline("initial relations");

  await test("anon cannot execute RPC", async () => {
    const result = await rpc(anon, args(`Anon ${marker}`));
    assert(
      result.error && result.error.code !== "PGRST202",
      "anon cannot execute RPC",
      "RPC was executable or missing from schema cache",
      result.error?.code,
    );
  });

  const beforePositive = await readState("positive update baseline");
  await test("A updates its work and replaces relations", async () => {
    await updateSuccessfully(args(`Updated   Work ${marker}`, {
      p_author_relations: [
        { author_id: fixture.authorBId, position: 1 },
        { author_id: fixture.authorAId, position: 2 },
      ],
      p_series_relations: [{
        series_id: fixture.seriesBId,
        position: 2.125,
        position_label: "Precuela",
      }],
    }), "positive update");
  });
  const positive = await readState("positive state");
  await test("title and normalized_title are updated", async () => {
    assert(
      positive.work.title === `Updated   Work ${marker}` &&
        positive.work.normalized_title === `updated work ${marker}`,
      "title normalization",
      "title or generated normalization is incorrect",
    );
  });
  await test("updated_at changes through the existing trigger", async () => {
    assert(
      positive.work.updated_at !== beforePositive.work.updated_at,
      "updated_at",
      "updated_at did not change",
    );
  });
  await test("authors are fully replaced and ordered", async () => {
    assert(
      positive.authors.length === 2 &&
        positive.authors[0].author_id === fixture.authorBId &&
        positive.authors[0].position === 1 &&
        positive.authors[1].author_id === fixture.authorAId &&
        positive.authors[1].position === 2,
      "author replacement",
      "authors were not replaced in order",
    );
  });
  await test("A can link an author created by B", async () => {
    assert(
      positive.authors.some(({ author_id }) => author_id === fixture.authorBId),
      "foreign author link",
      "B author was not linked",
    );
  });
  await test("series position and label are replaced", async () => {
    assert(
      positive.series.length === 1 &&
        positive.series[0].series_id === fixture.seriesBId &&
        Number(positive.series[0].position) === 2.125 &&
        positive.series[0].position_label === "Precuela",
      "series replacement",
      "series relation was not replaced",
    );
  });

  await test("empty arrays remove all relations", async () => {
    await updateSuccessfully(args(`Empty relations ${marker}`), "empty arrays");
    const state = await readState("empty arrays");
    assert(
      state.authors.length === 0 &&
        state.genres.length === 0 &&
        state.series.length === 0,
      "empty arrays",
      "one or more relation types remain",
    );
  });

  const genres = await a.from("genres").select("id").limit(1);
  noError(genres.error, "genre discovery", "genre read failed");
  if (genres.data.length) {
    await test("A replaces controlled genres", async () => {
      await updateSuccessfully(args(`Genre update ${marker}`, {
        p_genre_relations: [{
          genre_id: genres.data[0].id,
          is_primary: true,
        }],
      }), "genre update");
    });
    await test("primary genre state is stored", async () => {
      const state = await readState("genre state");
      assert(
        state.genres.length === 1 && state.genres[0].is_primary === true,
        "genre state",
        "primary genre was not stored",
      );
    });
  } else {
    skip("A replaces controlled genres", "pending controlled seed in Stage 3F");
    skip("primary genre state is stored", "pending controlled seed in Stage 3F");
  }

  await restoreBaseline("B ownership baseline");
  const beforeB = await readState("B ownership state");
  await test("B receives zero rows when updating A work", async () => {
    const result = await rpc(b, args(`B forbidden ${marker}`, {
      p_author_relations: [{ author_id: fixture.authorBId, position: 1 }],
      p_series_relations: [],
    }));
    noError(result.error, "B ownership", "unexpected RPC error");
    assert(
      Array.isArray(result.data) && result.data.length === 0,
      "B ownership",
      "B update did not return zero rows",
    );
  });
  await test("B cannot change A work or its relations", async () => {
    await assertUnchanged(beforeB, "B ownership state");
  });

  await rejectedUpdate("missing author rolls back", args(`Missing author ${marker}`, {
    p_author_relations: [{ author_id: randomUUID(), position: 1 }],
    p_series_relations: [],
  }), "23503");
  await rejectedUpdate("duplicate author rolls back", args(`Duplicate author ${marker}`, {
    p_author_relations: [
      { author_id: fixture.authorAId, position: 1 },
      { author_id: fixture.authorAId, position: 2 },
    ],
  }), "23505");
  await rejectedUpdate("duplicate author position rolls back", args(`Duplicate position ${marker}`, {
    p_author_relations: [
      { author_id: fixture.authorAId, position: 1 },
      { author_id: fixture.authorBId, position: 1 },
    ],
  }), "23505");
  await rejectedUpdate("zero author position rolls back", args(`Zero author ${marker}`, {
    p_author_relations: [{ author_id: fixture.authorAId, position: 0 }],
  }), "23514");
  await rejectedUpdate("missing series rolls back", args(`Missing series ${marker}`, {
    p_series_relations: [{
      series_id: randomUUID(),
      position: 1,
      position_label: null,
    }],
  }), "23503");
  await rejectedUpdate("zero series position rolls back", args(`Zero series ${marker}`, {
    p_series_relations: [{
      series_id: fixture.seriesAId,
      position: 0,
      position_label: null,
    }],
  }), "23514");
  await rejectedUpdate("missing genre rolls back", args(`Missing genre ${marker}`, {
    p_genre_relations: [{ genre_id: randomUUID(), is_primary: true }],
  }), "23503");

  const hostileShapes = [
    ["work array", { p_work: [] }],
    ["author relations object", { p_author_relations: {} }],
    ["genre relations scalar", { p_genre_relations: 1 }],
    ["series relations null", { p_series_relations: null }],
    ["author relation string", { p_author_relations: ["invalid"] }],
    ["genre relation number", { p_genre_relations: [1] }],
    ["series relation array", { p_series_relations: [[]] }],
  ];
  for (const [name, override] of hostileShapes) {
    await restoreBaseline(`${name} baseline`);
    const before = await readState(name);
    await test(`${name} returns 22023`, async () => {
      const result = await rpc(a, { ...args(`Hostile ${marker}`), ...override });
      codeIs(result, "22023", name);
      await assertUnchanged(before, name);
    });
  }

  const unknownKeys = [
    ["work userId", { p_work: { ...work(`Unknown ${marker}`), userId: randomUUID() } }],
    ["work creator", { p_work: { ...work(`Unknown ${marker}`), created_by_profile_id: randomUUID() } }],
    ["author work_id", { p_author_relations: [{ author_id: fixture.authorAId, position: 1, work_id: fixture.workId }] }],
    ["genre foo", { p_genre_relations: [{ genre_id: randomUUID(), is_primary: false, foo: true }] }],
    ["series creator", { p_series_relations: [{ series_id: fixture.seriesAId, position: 1, position_label: null, created_by_profile_id: randomUUID() }] }],
  ];
  for (const [name, override] of unknownKeys) {
    await restoreBaseline(`${name} baseline`);
    const before = await readState(name);
    await test(`${name} returns 22023`, async () => {
      const result = await rpc(a, { ...args(`Unknown ${marker}`), ...override });
      codeIs(result, "22023", name);
      await assertUnchanged(before, name);
    });
  }

  await test("nonexistent work returns zero rows", async () => {
    const result = await rpc(a, {
      ...args(`Missing work ${marker}`),
      p_work_id: randomUUID(),
    });
    noError(result.error, "missing work", "unexpected RPC error");
    assert(
      Array.isArray(result.data) && result.data.length === 0,
      "missing work",
      "nonexistent work did not return zero rows",
    );
  });

  const nullOwner = await a.from("works")
    .select("id,title,original_title,description,original_publication_year,original_language_code")
    .is("created_by_profile_id", null)
    .limit(1);
  noError(nullOwner.error, "null owner discovery", "null owner read failed");
  if (nullOwner.data.length) {
    await test("null-owner work cannot be updated", async () => {
      const row = nullOwner.data[0];
      const result = await rpc(a, {
        p_work_id: row.id,
        p_work: {
          title: row.title,
          original_title: row.original_title,
          description: row.description,
          original_publication_year: row.original_publication_year,
          original_language_code: row.original_language_code,
        },
        p_author_relations: [],
        p_genre_relations: [],
        p_series_relations: [],
      });
      noError(result.error, "null owner", "unexpected RPC error");
      assert(result.data.length === 0, "null owner", "null-owner work was editable");
    });
  } else {
    skip("null-owner work cannot be updated", "will be verified after Stage 3F seed");
  }
} catch (error) {
  const safe = error instanceof SafeTestError
    ? error
    : new SafeTestError("setup", "unexpected integration failure", error?.code);
  console.error(
    `FAIL  ${safe.test}${safe.code ? ` [${safe.code}]` : ""}: ${safe.message}`,
  );
  process.exitCode = 1;
} finally {
  const errors = [];
  async function clean(result, label) {
    if (result.error) {
      errors.push(
        `${label}${safeCode(result.error.code) ? ` [${safeCode(result.error.code)}]` : ""}`,
      );
    }
  }

  if (fixture.workId) {
    await clean(
      await a.from("works").delete().eq("id", fixture.workId),
      "work fixture",
    );
  }
  if (fixture.authorAId) {
    await clean(
      await a.from("authors").delete().eq("id", fixture.authorAId),
      "author A fixture",
    );
  }
  if (fixture.authorBId) {
    await clean(
      await b.from("authors").delete().eq("id", fixture.authorBId),
      "author B fixture",
    );
  }
  if (fixture.seriesAId) {
    await clean(
      await a.from("series").delete().eq("id", fixture.seriesAId),
      "series A fixture",
    );
  }
  if (fixture.seriesBId) {
    await clean(
      await b.from("series").delete().eq("id", fixture.seriesBId),
      "series B fixture",
    );
  }

  const checks = await Promise.all([
    a.from("works").select("id").ilike("title", `%${marker}%`),
    a.from("authors").select("id").ilike("name", `%${marker}%`),
    a.from("series").select("id").ilike("name", `%${marker}%`),
  ]);
  if (checks.some((result) => result.error || result.data.length)) {
    errors.push("marker fixtures remain");
  }
  if (fixture.workId) {
    const relations = await Promise.all([
      a.from("work_authors").select("work_id").eq("work_id", fixture.workId),
      a.from("work_genres").select("work_id").eq("work_id", fixture.workId),
      a.from("work_series").select("work_id").eq("work_id", fixture.workId),
    ]);
    if (relations.some((result) => result.error || result.data.length)) {
      errors.push("relation fixtures remain");
    }
  }

  cleanupOk = errors.length === 0;
  for (const error of errors) console.error(`FAIL cleanup: ${error}`);
  if (!cleanupOk) process.exitCode = 1;
}

console.log(`RESULT ${passed} PASS / ${tests - passed - skipped} FAIL / ${skipped} SKIP`);
if (cleanupOk) {
  console.log("Cleanup verified: no update catalog work fixtures remain");
}
