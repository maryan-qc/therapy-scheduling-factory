// AC-INS-06 (openspec/specs/insurance-status): користувач без входу відкриває картку client6 за прямим посиланням —
// статусу страхування й інших даних client6 не отримує, а scheduler1 після цього бачить «Insurance: Verified».
// Сторінки без входу перенаправляє на /login proxy (src/lib/supabase/proxy.ts, tests/proxy.test.ts) і requireViewer;
// тут — друга лінія, база: PGlite від імені anon (без auth.uid()). Відмова — саме помилка прав (SQLSTATE 42501), а не
// «колонки чи функції не існує».
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../db/supabase-pglite";
import { createAdultCard, insuranceStatusSeenBy, resetCards, setInsuranceAs } from "./support";

let t: TestDb;
let scheduler1: string;
let client6: string;

beforeAll(async () => {
  t = await createTestDb();
  scheduler1 = t.users["scheduler1@example.test"];
}, 60_000);

beforeEach(async () => {
  await resetCards(t);
  client6 = await createAdultCard(t, scheduler1, "Client Six", "client6@example.test");
});

/** Дано: картка client6 показує «Insurance: Verified». */
async function givenVerified() {
  expect(await setInsuranceAs(t, scheduler1, client6, "verified")).toEqual({ code: "OK" });
  expect(await insuranceStatusSeenBy(t, scheduler1, client6)).toEqual([{ insurance_status: "verified" }]);
}

describe("статус страхування без входу", () => {
  it("AC-INS-06: відвідувач без входу не читає статус страхування client6 — відмова прав, scheduler1 бачить «verified»", async () => {
    await givenVerified();

    await expect(
      t.asAnon("select insurance_status from public.clients where id = $1", [client6]),
    ).rejects.toMatchObject({ code: "42501", message: expect.stringMatching(/permission denied for table clients/) });

    expect(await insuranceStatusSeenBy(t, scheduler1, client6)).toEqual([{ insurance_status: "verified" }]);
  });

  it("AC-INS-06: відвідувач без входу викликає set_insurance_status(client6, «not_accepted») — відмова прав, scheduler1 бачить «verified»", async () => {
    await givenVerified();

    await expect(
      t.asAnon("select public.set_insurance_status($1::uuid, $2::text) as result", [client6, "not_accepted"]),
    ).rejects.toMatchObject({
      code: "42501",
      message: expect.stringMatching(/permission denied for function set_insurance_status/),
    });

    expect(await insuranceStatusSeenBy(t, scheduler1, client6)).toEqual([{ insurance_status: "verified" }]);
  });
});
