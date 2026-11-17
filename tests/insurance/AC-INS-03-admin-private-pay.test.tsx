// AC-INS-03 (openspec/specs/insurance-status): admin1 змінює статус страхування client7 з «Verified» на «Private pay» —
// і admin1, і scheduler2 бачать у картці «Insurance: Private pay».
// Зміна — справжня функція бази public.set_insurance_status на PGlite від імені admin1; результат читаємо з бази під
// RLS кожного й показуємо на сторінці картки src/app/clients/[id]/page.tsx (рядок з PGlite від імені того, хто відкриває).
// Підмінено лише межу: сесію (requireViewer → роль і клієнт Supabase), next/navigation і next/cache.
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../db/supabase-pglite";
import {
  createAdultCard,
  elementByTestId,
  insuranceStatusSeenBy,
  resetCards,
  setInsuranceAs,
  textOf,
  viewerAs,
  type StaffOrTherapist,
} from "./support";

const mocks = vi.hoisted(() => ({
  viewer: null as unknown,
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));

vi.mock("@/lib/supabase/viewer", () => ({ requireViewer: async () => mocks.viewer }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect, notFound: vi.fn() }));

const { default: ClientCardPage } = await import("@/app/clients/[id]/page");

let t: TestDb;
let scheduler1: string;
let scheduler2: string;
let admin1: string;
let client7: string;

async function openCard(email: string, role: StaffOrTherapist, id: string, query: Record<string, string> = {}) {
  mocks.viewer = viewerAs(t, email, role);
  const page = await ClientCardPage({ params: Promise.resolve({ id }), searchParams: Promise.resolve(query) } as never);
  return renderToStaticMarkup(page);
}

beforeAll(async () => {
  t = await createTestDb();
  scheduler1 = t.users["scheduler1@example.test"];
  scheduler2 = t.users["scheduler2@example.test"];
  admin1 = t.users["admin1@example.test"];
}, 60_000);

beforeEach(async () => {
  await resetCards(t);
  client7 = await createAdultCard(t, scheduler1, "Client Seven", "client7@example.test");
});

describe("адміністратор змінює статус страхування", () => {
  it("AC-INS-03: admin1 змінює статус client7 з «verified» на «private_pay» функцією бази — {code: OK}, admin1 і scheduler2 читають «private_pay»", async () => {
    // Дано: картка client7 показує «Insurance: Verified».
    expect(await setInsuranceAs(t, scheduler1, client7, "verified")).toEqual({ code: "OK" });
    expect(await insuranceStatusSeenBy(t, admin1, client7)).toEqual([{ insurance_status: "verified" }]);

    expect(await setInsuranceAs(t, admin1, client7, "private_pay")).toEqual({ code: "OK" });

    expect(await insuranceStatusSeenBy(t, admin1, client7)).toEqual([{ insurance_status: "private_pay" }]);
    expect(await insuranceStatusSeenBy(t, scheduler2, client7)).toEqual([{ insurance_status: "private_pay" }]);
  });

  it("AC-INS-03: після зміни admin1 на «Private pay» і admin1, і scheduler2 бачать у картці client7 «Insurance: Private pay»", async () => {
    expect(await setInsuranceAs(t, scheduler1, client7, "verified")).toEqual({ code: "OK" });
    const given = await openCard("admin1@example.test", "admin", client7);
    expect(textOf(elementByTestId(given, "insurance-status"))).toBe("Insurance: Verified");

    expect(await setInsuranceAs(t, admin1, client7, "private_pay")).toEqual({ code: "OK" });

    const adminCard = await openCard("admin1@example.test", "admin", client7);
    const scheduler2Card = await openCard("scheduler2@example.test", "scheduler", client7);
    expect(adminCard).toContain("Client Seven");
    expect(textOf(elementByTestId(adminCard, "insurance-status"))).toBe("Insurance: Private pay");
    expect(scheduler2Card).toContain("Client Seven");
    expect(textOf(elementByTestId(scheduler2Card, "insurance-status"))).toBe("Insurance: Private pay");
  });
});
