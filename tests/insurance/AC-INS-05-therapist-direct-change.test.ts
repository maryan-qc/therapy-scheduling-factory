// AC-INS-05 (openspec/specs/insurance-status): therapist1 напряму, оминаючи сторінки застосунку, пробує змінити статус
// страхування свого клієнта client6 з «Not accepted» на «Verified» — статус не змінився, scheduler1 бачить «Not accepted».
// Правило живе в базі, тож тест — PGlite від імені therapist1 (role authenticated) обома шляхами «напряму», які дає
// Data API: виклик public.set_insurance_status і прямий update колонки public.clients.insurance_status.
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../db/supabase-pglite";
import { createAdultCard, insuranceStatusSeenBy, makeOwnClient, resetCards, setInsuranceAs } from "./support";

let t: TestDb;
let scheduler1: string;
let therapist1: string;
let client6: string;

beforeAll(async () => {
  t = await createTestDb();
  scheduler1 = t.users["scheduler1@example.test"];
  therapist1 = t.users["therapist1@example.test"];
}, 60_000);

beforeEach(async () => {
  await resetCards(t);
  client6 = await createAdultCard(t, scheduler1, "Client Six", "client6@example.test");
});

/** Дано: client6 — свій клієнт therapist1 (він бачить картку), і картка client6 показує «Insurance: Not accepted». */
async function givenOwnClientNotAccepted() {
  expect(await makeOwnClient(t, scheduler1, "therapist1@example.test", client6)).toEqual({ hold: "OK", confirm: "OK" });
  expect(await setInsuranceAs(t, scheduler1, client6, "not_accepted")).toEqual({ code: "OK" });
  expect(await insuranceStatusSeenBy(t, therapist1, client6)).toEqual([{ insurance_status: "not_accepted" }]);
}

describe("терапевт напряму не змінює статус страхування", () => {
  it("AC-INS-05: therapist1 викликає set_insurance_status(client6, «verified») напряму — FORBIDDEN, scheduler1 бачить «not_accepted»", async () => {
    await givenOwnClientNotAccepted();

    expect(await setInsuranceAs(t, therapist1, client6, "verified")).toEqual({ code: "FORBIDDEN" });

    expect(await insuranceStatusSeenBy(t, scheduler1, client6)).toEqual([{ insurance_status: "not_accepted" }]);
  });

  it("AC-INS-05: therapist1 оновлює колонку insurance_status client6 на «verified» прямим update — відмова прав, scheduler1 бачить «not_accepted»", async () => {
    await givenOwnClientNotAccepted();

    await expect(
      t.asUser(therapist1, "update public.clients set insurance_status = 'verified' where id = $1", [client6]),
    ).rejects.toMatchObject({ code: "42501", message: expect.stringMatching(/permission denied for table clients/) });

    expect(await insuranceStatusSeenBy(t, scheduler1, client6)).toEqual([{ insurance_status: "not_accepted" }]);
  });
});
