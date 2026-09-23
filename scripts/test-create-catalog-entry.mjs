import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "FOAIE_TEST_USER_A_EMAIL", "FOAIE_TEST_USER_A_PASSWORD",
  "FOAIE_TEST_USER_B_EMAIL", "FOAIE_TEST_USER_B_PASSWORD",
];

class SafeTestError extends Error {
  constructor(test, message, code) { super(message); this.test = test; this.code = safeCode(code); }
}
const safeCode = (code) => typeof code === "string" && /^[A-Za-z0-9_-]{2,50}$/.test(code) ? code : undefined;
function assert(value, test, message, code) { if (!value) throw new SafeTestError(test, message, code); }
function noError(error, test, message) { if (error) throw new SafeTestError(test, message, error.code); }
function codeIs(result, code, test) { assert(result.error?.code === code, test, `expected ${code}`, result.error?.code); }
function client() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
async function authenticate(api, email, password, test) {
  const { data, error } = await api.auth.signInWithPassword({ email, password });
  noError(error, test, "authentication failed");
  assert(data.user?.id, test, "authenticated identity missing");
  return data.user.id;
}

const marker = randomUUID().replaceAll("-", "").slice(0, 14);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const anon = client(); const a = client(); const b = client();
let userA; let userB; let tests = 0; let passed = 0; let skipped = 0; let invalidIsbnCode;
const worksA = []; const editionsA = []; const authorsA = []; const authorsB = [];
const publishersB = []; const seriesB = [];

function work(title, extra = {}) {
  return { title, original_title: null, description: null, original_publication_year: null, original_language_code: null, ...extra };
}
function edition(title, extra = {}) {
  return { publisher_id: null, edition_title: title, subtitle: null, isbn10: null, isbn13: null, publication_date: null, publication_date_precision: null, language_code: "es", format: "PHYSICAL", page_count: null, audio_duration_minutes: null, cover_url: null, cover_storage_key: null, ...extra };
}
function args(title, editionTitle, extra = {}) {
  return { p_work: work(title), p_author_relations: [], p_genre_relations: [], p_series_relations: [], p_edition: edition(editionTitle), ...extra };
}
async function rpc(api, payload) { return api.rpc("create_catalog_entry", payload); }
async function test(name, operation) {
  tests += 1;
  await operation();
  passed += 1;
  console.log(`PASS  ${tests}. ${name}`);
}
function skip(name, reason) { tests += 1; skipped += 1; console.log(`SKIP  ${tests}. ${name}: ${reason}`); }
async function createEntry(api, payload, testName) {
  const result = await rpc(api, payload); noError(result.error, testName, "RPC failed");
  assert(Array.isArray(result.data) && result.data.length === 1, testName, "RPC did not return exactly one row");
  return result.data[0];
}
async function assertRollback(title, editionTitle, testName) {
  const workRows = await a.from("works").select("id").eq("title", title);
  const editionRows = await a.from("editions").select("id").eq("edition_title", editionTitle);
  const relationRows = await Promise.all([
    a.from("work_authors").select("work_id, works!inner(title)").eq("works.title", title),
    a.from("work_genres").select("work_id, works!inner(title)").eq("works.title", title),
    a.from("work_series").select("work_id, works!inner(title)").eq("works.title", title),
  ]);
  noError(workRows.error, testName, "work rollback verification failed");
  noError(editionRows.error, testName, "edition rollback verification failed");
  for (const result of relationRows) noError(result.error, testName, "relation rollback verification failed");
  assert(workRows.data.length === 0 && editionRows.data.length === 0, testName, "partial work or edition persisted");
  assert(relationRows.every((result) => result.data.length === 0), testName, "partial relation persisted");
}
function makeIsbn10(seed) {
  const digits = seed.replace(/\D/g, "").padEnd(9, "7").slice(0, 9).split("").map(Number);
  const sum = digits.reduce((total, digit, index) => total + digit * (10 - index), 0);
  const check = (11 - (sum % 11)) % 11;
  return `${digits.join("")}${check === 10 ? "X" : check}`;
}
function isbn13From10(isbn10) {
  const first = `978${isbn10.slice(0, 9)}`;
  const sum = [...first].reduce((total, value, index) => total + Number(value) * (index % 2 ? 3 : 1), 0);
  return `${first}${(10 - (sum % 10)) % 10}`;
}
function formattedIsbn10(value) { return `${value.slice(0, 1)}-${value.slice(1, 4)} ${value.slice(4, 9)}-${value.slice(9)}`; }
async function insertFixture(api, table, values, columns, testName) {
  const result = await api.from(table).insert(values).select(columns).single();
  noError(result.error, testName, `could not create ${table} fixture`); return result.data;
}

for (const name of required) if (!process.env[name]?.trim()) { console.error("FAIL setup [MISSING_ENV]"); process.exit(1); }

let cleanupOk = true;
try {
  userA = await authenticate(a, process.env.FOAIE_TEST_USER_A_EMAIL, process.env.FOAIE_TEST_USER_A_PASSWORD, "user A setup");
  userB = await authenticate(b, process.env.FOAIE_TEST_USER_B_EMAIL, process.env.FOAIE_TEST_USER_B_PASSWORD, "user B setup");

  await test("anon cannot execute RPC", async () => {
    const result = await rpc(anon, args(`Anon ${marker}`, `Anon edition ${marker}`));
    assert(result.error && result.error.code !== "PGRST202", "anon cannot execute RPC", "RPC was executable or absent from schema cache", result.error?.code);
  });

  let minimum;
  const minimumTitle = `RPC minimum ${marker}`; const minimumEdition = `RPC minimum edition ${marker}`;
  await test("A creates minimum entry", async () => { minimum = await createEntry(a, args(minimumTitle, minimumEdition), "minimum entry"); worksA.push(minimum.work_id); editionsA.push(minimum.edition_id); });
  await test("minimum RPC returns one row", async () => assert(minimum, "minimum row", "missing response"));
  await test("work_id is UUID", async () => assert(uuidPattern.test(minimum.work_id), "work UUID", "invalid work UUID"));
  await test("edition_id is UUID", async () => assert(uuidPattern.test(minimum.edition_id), "edition UUID", "invalid edition UUID"));
  let minimumWork; let minimumEditionRow;
  await test("minimum work exists", async () => { const result = await a.from("works").select("id,created_by_profile_id").eq("id", minimum.work_id).single(); noError(result.error, "work exists", "work missing"); minimumWork = result.data; });
  await test("minimum edition exists", async () => { const result = await a.from("editions").select("id,work_id,created_by_profile_id").eq("id", minimum.edition_id).single(); noError(result.error, "edition exists", "edition missing"); minimumEditionRow = result.data; });
  await test("edition references returned work", async () => assert(minimumEditionRow.work_id === minimum.work_id, "edition work", "wrong work relation"));
  await test("work ownership is A", async () => assert(minimumWork.created_by_profile_id === userA, "work owner", "wrong creator"));
  await test("edition ownership is A", async () => assert(minimumEditionRow.created_by_profile_id === userA, "edition owner", "wrong creator"));
  await test("B reads A work", async () => { const result = await b.from("works").select("id").eq("id", minimum.work_id); noError(result.error, "B reads work", "read failed"); assert(result.data.length === 1, "B reads work", "work hidden"); });
  await test("B reads A edition", async () => { const result = await b.from("editions").select("id").eq("id", minimum.edition_id); noError(result.error, "B reads edition", "read failed"); assert(result.data.length === 1, "B reads edition", "edition hidden"); });
  await test("minimum entry has no relations", async () => { for (const table of ["work_authors", "work_genres", "work_series"]) { const result = await a.from(table).select("work_id").eq("work_id", minimum.work_id); noError(result.error, "empty relations", "relation read failed"); assert(result.data.length === 0, "empty relations", `${table} not empty`); } });

  const authorA = await insertFixture(a, "authors", { name: `Author A ${marker}` }, "id", "author A fixture"); authorsA.push(authorA.id);
  const authorB = await insertFixture(b, "authors", { name: `Author B ${marker}` }, "id", "author B fixture"); authorsB.push(authorB.id);
  const publisherB = await insertFixture(b, "publishers", { name: `Publisher B ${marker}` }, "id", "publisher B fixture"); publishersB.push(publisherB.id);
  const seriesFixtureB = await insertFixture(b, "series", { name: `Series B ${marker}` }, "id", "series B fixture"); seriesB.push(seriesFixtureB.id);

  let ownAuthorEntry;
  await test("A creates entry with own author", async () => { ownAuthorEntry = await createEntry(a, args(`Own author ${marker}`, `Own author edition ${marker}`, { p_author_relations: [{ author_id: authorA.id, position: 1 }] }), "own author"); worksA.push(ownAuthorEntry.work_id); editionsA.push(ownAuthorEntry.edition_id); });
  let ownAuthorRelation;
  await test("own author relation persists", async () => { const r = await a.from("work_authors").select("author_id,position").eq("work_id", ownAuthorEntry.work_id).single(); noError(r.error, "own author relation", "missing relation"); ownAuthorRelation = r.data; assert(r.data.author_id === authorA.id, "own author relation", "wrong relation"); });
  await test("own author position persists", async () => assert(ownAuthorRelation.position === 1, "own author position", "wrong position"));

  let bAuthorEntry;
  await test("A uses author created by B", async () => { bAuthorEntry = await createEntry(a, args(`B author ${marker}`, `B author edition ${marker}`, { p_author_relations: [{ author_id: authorB.id, position: 1 }] }), "B author"); worksA.push(bAuthorEntry.work_id); editionsA.push(bAuthorEntry.edition_id); });
  await test("B author relation persists", async () => { const r = await a.from("work_authors").select("author_id").eq("work_id", bAuthorEntry.work_id).single(); noError(r.error, "B author relation", "missing relation"); assert(r.data.author_id === authorB.id, "B author relation", "wrong author"); });

  let publisherEntry;
  await test("A uses publisher created by B", async () => { publisherEntry = await createEntry(a, args(`B publisher ${marker}`, `B publisher edition ${marker}`, { p_edition: edition(`B publisher edition ${marker}`, { publisher_id: publisherB.id }) }), "B publisher"); worksA.push(publisherEntry.work_id); editionsA.push(publisherEntry.edition_id); });
  await test("edition references B publisher", async () => { const r = await a.from("editions").select("publisher_id").eq("id", publisherEntry.edition_id).single(); noError(r.error, "publisher relation", "missing edition"); assert(r.data.publisher_id === publisherB.id, "publisher relation", "wrong publisher"); });

  let seriesEntry;
  await test("A uses series created by B", async () => { seriesEntry = await createEntry(a, args(`B series ${marker}`, `B series edition ${marker}`, { p_series_relations: [{ series_id: seriesFixtureB.id, position: 2.125, position_label: "Precuela" }] }), "B series"); worksA.push(seriesEntry.work_id); editionsA.push(seriesEntry.edition_id); });
  let seriesRelation;
  await test("series relation persists", async () => { const r = await a.from("work_series").select("series_id,position,position_label").eq("work_id", seriesEntry.work_id).single(); noError(r.error, "series relation", "missing relation"); seriesRelation = r.data; assert(r.data.series_id === seriesFixtureB.id, "series relation", "wrong series"); });
  await test("series position and label persist", async () => assert(Number(seriesRelation.position) === 2.125 && seriesRelation.position_label === "Precuela", "series metadata", "series metadata changed"));

  const isbn10 = makeIsbn10(marker); const isbn13 = isbn13From10(isbn10); let isbnEntry;
  await test("formatted synthetic ISBN-10 is accepted", async () => { isbnEntry = await createEntry(a, args(`ISBN ${marker}`, `ISBN edition ${marker}`, { p_edition: edition(`ISBN edition ${marker}`, { isbn10: formattedIsbn10(isbn10) }) }), "valid ISBN"); worksA.push(isbnEntry.work_id); editionsA.push(isbnEntry.edition_id); });
  await test("ISBN-10 is normalized", async () => { const r = await a.from("editions").select("isbn10").eq("id", isbnEntry.edition_id).single(); noError(r.error, "ISBN normalization", "read failed"); assert(r.data.isbn10 === isbn10, "ISBN normalization", "ISBN-10 not normalized"); });
  await test("ISBN-13 is derived", async () => { const r = await a.from("editions").select("isbn13").eq("id", isbnEntry.edition_id).single(); noError(r.error, "ISBN derivation", "read failed"); assert(r.data.isbn13 === isbn13, "ISBN derivation", "ISBN-13 not derived"); });

  let dateEntry;
  await test("YEAR date entry succeeds and is stored canonically", async () => { dateEntry = await createEntry(a, args(`Date ${marker}`, `Date edition ${marker}`, { p_edition: edition(`Date edition ${marker}`, { publication_date: "2026-01-01", publication_date_precision: "YEAR" }) }), "YEAR date"); worksA.push(dateEntry.work_id); editionsA.push(dateEntry.edition_id); const r = await a.from("editions").select("publication_date").eq("id", dateEntry.edition_id).single(); noError(r.error, "YEAR date stored", "read failed"); assert(r.data.publication_date === "2026-01-01", "YEAR date stored", "wrong date"); });
  await test("YEAR precision is stored", async () => { const r = await a.from("editions").select("publication_date_precision").eq("id", dateEntry.edition_id).single(); noError(r.error, "YEAR precision", "read failed"); assert(r.data.publication_date_precision === "YEAR", "YEAR precision", "wrong precision"); });

  const genreResult = await a.from("genres").select("id").limit(1);
  noError(genreResult.error, "genre discovery", "genre read failed");
  if (genreResult.data.length) {
    let genreEntry;
    await test("A creates entry with controlled genre", async () => { genreEntry = await createEntry(a, args(`Genre ${marker}`, `Genre edition ${marker}`, { p_genre_relations: [{ genre_id: genreResult.data[0].id, is_primary: true }] }), "genre entry"); worksA.push(genreEntry.work_id); editionsA.push(genreEntry.edition_id); });
    await test("genre relation persists", async () => { const r = await a.from("work_genres").select("genre_id").eq("work_id", genreEntry.work_id).single(); noError(r.error, "genre relation", "missing relation"); assert(r.data.genre_id === genreResult.data[0].id, "genre relation", "wrong genre"); });
    await test("primary genre persists", async () => { const r = await a.from("work_genres").select("is_primary").eq("work_id", genreEntry.work_id).single(); noError(r.error, "primary genre", "missing relation"); assert(r.data.is_primary === true, "primary genre", "primary flag changed"); });
  } else {
    skip("positive genre entry", "pending controlled seed in Stage 3F");
    skip("positive genre relation", "pending controlled seed in Stage 3F");
    skip("positive primary genre", "pending controlled seed in Stage 3F");
  }

  const validationCases = [
    ["invalid work shape", { ...args(`Shape ${marker}`, `Shape edition ${marker}`), p_work: [] }, `Shape ${marker}`, `Shape edition ${marker}`],
    ["unknown work key", { ...args(`Unknown work ${marker}`, `Unknown work edition ${marker}`), p_work: { ...work(`Unknown work ${marker}`), forbidden: true } }, `Unknown work ${marker}`, `Unknown work edition ${marker}`],
    ["work_id in edition", { ...args(`Edition key ${marker}`, `Edition key edition ${marker}`), p_edition: { ...edition(`Edition key edition ${marker}`), work_id: randomUUID() } }, `Edition key ${marker}`, `Edition key edition ${marker}`],
    ["non-object relation", { ...args(`Relation shape ${marker}`, `Relation shape edition ${marker}`), p_author_relations: ["invalid"] }, `Relation shape ${marker}`, `Relation shape edition ${marker}`],
    ["unknown relation key", { ...args(`Relation key ${marker}`, `Relation key edition ${marker}`), p_author_relations: [{ author_id: authorA.id, position: 1, forbidden: true }] }, `Relation key ${marker}`, `Relation key edition ${marker}`],
  ];
  for (const [name, payload, workTitle, editionTitle] of validationCases) await test(`${name} returns 22023 and no rows`, async () => { const r = await rpc(a, payload); codeIs(r, "22023", name); await assertRollback(workTitle, editionTitle, name); });

  async function rollback(name, payload, expectedCode) {
    await test(name, async () => { const r = await rpc(a, payload); if (expectedCode) codeIs(r, expectedCode, name); else { assert(r.error, name, "expected failure"); invalidIsbnCode = safeCode(r.error.code); } await assertRollback(payload.p_work.title, payload.p_edition.edition_title, name); });
  }
  await rollback("missing author rolls back", args(`Missing author ${marker}`, `Missing author edition ${marker}`, { p_author_relations: [{ author_id: randomUUID(), position: 1 }] }), "23503");
  await rollback("duplicate author positions roll back", args(`Duplicate positions ${marker}`, `Duplicate positions edition ${marker}`, { p_author_relations: [{ author_id: authorA.id, position: 1 }, { author_id: authorB.id, position: 1 }] }), "23505");
  await rollback("duplicate author rolls back", args(`Duplicate author ${marker}`, `Duplicate author edition ${marker}`, { p_author_relations: [{ author_id: authorA.id, position: 1 }, { author_id: authorA.id, position: 2 }] }), "23505");
  await rollback("missing genre rolls back prior author relation", args(`Missing genre ${marker}`, `Missing genre edition ${marker}`, { p_author_relations: [{ author_id: authorA.id, position: 1 }], p_genre_relations: [{ genre_id: randomUUID(), is_primary: true }] }), "23503");
  await rollback("missing series rolls back", args(`Missing series ${marker}`, `Missing series edition ${marker}`, { p_series_relations: [{ series_id: randomUUID(), position: 1, position_label: null }] }), "23503");
  await rollback("zero series position rolls back", args(`Zero series ${marker}`, `Zero series edition ${marker}`, { p_series_relations: [{ series_id: seriesFixtureB.id, position: 0, position_label: null }] }), "23514");
  await rollback("missing publisher rolls back prior relations", args(`Missing publisher ${marker}`, `Missing publisher edition ${marker}`, { p_author_relations: [{ author_id: authorA.id, position: 1 }], p_series_relations: [{ series_id: seriesFixtureB.id, position: 1, position_label: null }], p_edition: edition(`Missing publisher edition ${marker}`, { publisher_id: randomUUID() }) }), "23503");
  const invalidIsbn = `${isbn10.slice(0, 9)}${isbn10.at(-1) === "0" ? "1" : "0"}`;
  await rollback("invalid ISBN checksum rolls back", args(`Invalid ISBN ${marker}`, `Invalid ISBN edition ${marker}`, { p_author_relations: [{ author_id: authorA.id, position: 1 }], p_edition: edition(`Invalid ISBN edition ${marker}`, { isbn10: invalidIsbn }) }), null);
  await rollback("duplicate ISBN rolls back second entry", args(`Duplicate ISBN ${marker}`, `Duplicate ISBN edition ${marker}`, { p_edition: edition(`Duplicate ISBN edition ${marker}`, { isbn10 }) }), "23505");
  await test("original ISBN entry remains after duplicate", async () => { const r = await a.from("editions").select("id").eq("id", isbnEntry.edition_id); noError(r.error, "original ISBN remains", "read failed"); assert(r.data.length === 1, "original ISBN remains", "original removed"); });
  await rollback("incoherent MONTH date rolls back", args(`Bad date ${marker}`, `Bad date edition ${marker}`, { p_edition: edition(`Bad date edition ${marker}`, { publication_date: "2026-02-15", publication_date_precision: "MONTH" }) }), "23514");
  await rollback("invalid format rolls back", args(`Bad format ${marker}`, `Bad format edition ${marker}`, { p_edition: edition(`Bad format edition ${marker}`, { format: "INVALID_TEST_FORMAT" }) }), "23514");
} catch (error) {
  const safe = error instanceof SafeTestError ? error : new SafeTestError("setup", "unexpected integration failure", error?.code);
  console.error(`FAIL  ${safe.test}${safe.code ? ` [${safe.code}]` : ""}: ${safe.message}`);
  process.exitCode = 1;
} finally {
  const errors = [];
  async function clean(result, label) { if (result.error) errors.push(`${label}${safeCode(result.error.code) ? ` [${safeCode(result.error.code)}]` : ""}`); }
  if (editionsA.length) await clean(await a.from("editions").delete().in("id", editionsA), "A editions");
  if (worksA.length) await clean(await a.from("works").delete().in("id", worksA), "A works");
  if (authorsA.length) await clean(await a.from("authors").delete().in("id", authorsA), "A authors");
  if (authorsB.length) await clean(await b.from("authors").delete().in("id", authorsB), "B authors");
  if (publishersB.length) await clean(await b.from("publishers").delete().in("id", publishersB), "B publishers");
  if (seriesB.length) await clean(await b.from("series").delete().in("id", seriesB), "B series");

  if (userA) {
    const checks = await Promise.all([
      a.from("works").select("id").ilike("title", `%${marker}%`),
      a.from("editions").select("id").ilike("edition_title", `%${marker}%`),
      a.from("authors").select("id").ilike("name", `%${marker}%`),
      a.from("publishers").select("id").ilike("name", `%${marker}%`),
      a.from("series").select("id").ilike("name", `%${marker}%`),
    ]);
    if (checks.some((result) => result.error || result.data.length)) errors.push("marker fixtures remain");
    const relationChecks = await Promise.all([
      worksA.length ? a.from("work_authors").select("work_id").in("work_id", worksA) : { data: [], error: null },
      worksA.length ? a.from("work_genres").select("work_id").in("work_id", worksA) : { data: [], error: null },
      worksA.length ? a.from("work_series").select("work_id").in("work_id", worksA) : { data: [], error: null },
    ]);
    if (relationChecks.some((result) => result.error || result.data.length)) errors.push("relation fixtures remain");
  }
  cleanupOk = errors.length === 0;
  for (const error of errors) console.error(`FAIL cleanup: ${error}`);
  if (!cleanupOk) process.exitCode = 1;
}

console.log(`RESULT ${passed} PASS / ${tests - passed - skipped} FAIL / ${skipped} SKIP`);
if (invalidIsbnCode) console.log(`Invalid ISBN trigger code: ${invalidIsbnCode}`);
if (cleanupOk) console.log("Cleanup verified: no catalog RPC fixtures remain");
