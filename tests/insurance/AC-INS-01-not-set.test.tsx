// AC-INS-01 (openspec/specs/insurance-status): картка, статус страхування якої ще ніхто не позначав, — «Insurance: Not set».
// Початкове значення — справжня база PGlite (колонка public.clients.insurance_status, default з міграції); сторінка
// картки src/app/clients/[id]/page.tsx читає рядок з PGlite від імені scheduler1. Підмінено лише межу: сесію
// (requireViewer → роль і клієнт Supabase), next/navigation і next/cache.
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../db/supabase-pglite";
import {
  createAdultCard,
  elementByTestId,
  insuranceStatusSeenBy,
  resetCards,
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
let client6: string;

async function openCard(email: string, role: StaffOrTherapist, id: string, query: Record<string, string> = {}) {
  mocks.viewer = viewerAs(t, email, role);
  const page = await ClientCardPage({ params: Promise.resolve({ id }), searchParams: Promise.resolve(query) } as never);
  return renderToStaticMarkup(page);
}

beforeAll(async () => {
  t = await createTestDb();
  scheduler1 = t.users["scheduler1@example.test"];
}, 60_000);

beforeEach(async () => {
  await resetCards(t);
  // Дано: картку client6 створено (планувальником, як з анкети), статус страхування ніхто не позначав.
  client6 = await createAdultCard(t, scheduler1, "Client Six", "client6@example.test");
});

describe("початковий статус страхування", () => {
  it("AC-INS-01: у щойно створеній картці client6 статус страхування в базі — «not_set», і scheduler1 його читає", async () => {
    expect(await insuranceStatusSeenBy(t, scheduler1, client6)).toEqual([{ insurance_status: "not_set" }]);
  });

  it("AC-INS-01: scheduler1 відкриває картку client6 — у картці показано «Insurance: Not set»", async () => {
    const page = await openCard("scheduler1@example.test", "scheduler", client6);

    expect(page).toContain("Client Six"); // це саме картка client6, а не повідомлення про відсутню картку
    expect(textOf(elementByTestId(page, "insurance-status"))).toBe("Insurance: Not set");
  });
});
