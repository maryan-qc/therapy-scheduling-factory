// AC-INS-04 (openspec/specs/insurance-status): client6 — свій клієнт therapist1, статус «Not accepted»; therapist1
// відкриває картку — бачить «Insurance: Not accepted», а змінити статус йому не запропоновано (форми insurance-form немає).
// «Свій клієнт» — справжнє утримання й підтвердження (public.hold_slot / public.confirm_hold від scheduler1) на PGlite;
// картку сторінка src/app/clients/[id]/page.tsx читає з PGlite від імені therapist1 (RLS clients_select).
// Підмінено лише межу: сесію (requireViewer → роль і клієнт Supabase), next/navigation і next/cache.
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../db/supabase-pglite";
import {
  createAdultCard,
  elementByTestId,
  insuranceStatusSeenBy,
  makeOwnClient,
  resetCards,
  setInsuranceAs,
  tagAttributes,
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
let therapist1: string;
let client6: string;

async function openCard(email: string, role: StaffOrTherapist, id: string, query: Record<string, string> = {}) {
  mocks.viewer = viewerAs(t, email, role);
  const page = await ClientCardPage({ params: Promise.resolve({ id }), searchParams: Promise.resolve(query) } as never);
  return renderToStaticMarkup(page);
}

beforeAll(async () => {
  t = await createTestDb();
  scheduler1 = t.users["scheduler1@example.test"];
  therapist1 = t.users["therapist1@example.test"];
}, 60_000);

beforeEach(async () => {
  await resetCards(t);
  client6 = await createAdultCard(t, scheduler1, "Client Six", "client6@example.test");
});

/** Дано: client6 — свій клієнт therapist1, і картка client6 показує «Insurance: Not accepted». */
async function givenOwnClientNotAccepted() {
  expect(await makeOwnClient(t, scheduler1, "therapist1@example.test", client6)).toEqual({ hold: "OK", confirm: "OK" });
  expect(await setInsuranceAs(t, scheduler1, client6, "not_accepted")).toEqual({ code: "OK" });
}

describe("терапевт лише бачить статус страхування", () => {
  it("AC-INS-04: therapist1 читає картку свого клієнта client6 з бази — статус «not_accepted»", async () => {
    await givenOwnClientNotAccepted();

    expect(await insuranceStatusSeenBy(t, therapist1, client6)).toEqual([{ insurance_status: "not_accepted" }]);
  });

  it("AC-INS-04: therapist1 відкриває картку client6 — бачить «Insurance: Not accepted», форми зміни статусу немає", async () => {
    await givenOwnClientNotAccepted();
    // Контроль: та сама картка для scheduler1 пропонує змінити статус — тож відсутність форми нижче залежить від ролі.
    const schedulerCard = await openCard("scheduler1@example.test", "scheduler", client6);
    expect(elementByTestId(schedulerCard, "insurance-form")).not.toBeNull();

    const page = await openCard("therapist1@example.test", "therapist", client6);

    expect(page).toContain("Client Six"); // картку свого клієнта відкрито, а не «You don't have access to this client.»
    expect(textOf(elementByTestId(page, "insurance-status"))).toBe("Insurance: Not accepted");
    expect(elementByTestId(page, "insurance-form")).toBeNull();
    expect(tagAttributes(page, "select")).not.toContainEqual(expect.objectContaining({ name: "insurance_status" }));
    expect(page).not.toContain("Save insurance status");
  });
});
