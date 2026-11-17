// AC-INS-02 (openspec/specs/insurance-status): scheduler1 позначає статус страхування client6 «Verified» — бачить
// «Insurance status saved.», картка показує «Insurance: Verified» і після повторного відкриття.
// Збереження — справжня функція бази public.set_insurance_status на PGlite від імені scheduler1. Шлях користувача:
// сторінка картки src/app/clients/[id]/page.tsx (форма insurance-form) → дія setInsuranceStatus
// (src/app/clients/actions.ts) → та сама функція бази клієнтом scheduler1 → редирект → сторінка знову читає картку з
// PGlite. Підмінено лише межу: сесію (requireViewer → роль і клієнт Supabase), next/navigation і next/cache;
// redirect, як і в Next, перериває дію винятком.
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../db/supabase-pglite";
import {
  createAdultCard,
  elementByTestId,
  insuranceStatusSeenBy,
  optionsOf,
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
const { setInsuranceStatus } = await import("@/app/clients/actions");

let t: TestDb;
let scheduler1: string;
let client6: string;

async function openCard(email: string, role: StaffOrTherapist, id: string, query: Record<string, string> = {}) {
  mocks.viewer = viewerAs(t, email, role);
  const page = await ClientCardPage({ params: Promise.resolve({ id }), searchParams: Promise.resolve(query) } as never);
  return renderToStaticMarkup(page);
}

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

beforeAll(async () => {
  t = await createTestDb();
  scheduler1 = t.users["scheduler1@example.test"];
}, 60_000);

beforeEach(async () => {
  mocks.redirect.mockClear();
  await resetCards(t);
  client6 = await createAdultCard(t, scheduler1, "Client Six", "client6@example.test");
});

describe("планувальник позначає статус страхування", () => {
  it("AC-INS-02: scheduler1 позначає client6 «Verified» функцією бази — {code: OK}, статус «verified» зберігся й читається знову", async () => {
    expect(await insuranceStatusSeenBy(t, scheduler1, client6)).toEqual([{ insurance_status: "not_set" }]);

    expect(await setInsuranceAs(t, scheduler1, client6, "verified")).toEqual({ code: "OK" });

    expect(await insuranceStatusSeenBy(t, scheduler1, client6)).toEqual([{ insurance_status: "verified" }]);
    expect(await t.asService("select insurance_status from public.clients where id = $1", [client6])).toEqual([
      { insurance_status: "verified" },
    ]);
  });

  it("AC-INS-02: scheduler1 позначає «Verified» у формі картки client6 — «Insurance status saved.», «Insurance: Verified» і після повторного відкриття", async () => {
    // Дано: картка client6 показує «Insurance: Not set», і scheduler1 має форму статусу страхування.
    const before = await openCard("scheduler1@example.test", "scheduler", client6);
    expect(textOf(elementByTestId(before, "insurance-status"))).toBe("Insurance: Not set");
    const form = elementByTestId(before, "insurance-form");
    expect(tagAttributes(form, "select")).toContainEqual(expect.objectContaining({ name: "insurance_status" }));
    expect(optionsOf(form)).toEqual(
      expect.arrayContaining([
        { value: "verified", label: "Verified" },
        { value: "not_accepted", label: "Not accepted" },
        { value: "private_pay", label: "Private pay" },
      ]),
    );
    expect(optionsOf(form).map((option) => option.value)).not.toContain("not_set");
    expect(tagAttributes(form, "input")).toContainEqual(
      expect.objectContaining({ type: "hidden", name: "client_id", value: client6 }),
    );
    expect(textOf(form)).toContain("Save insurance status");

    // Коли: scheduler1 надсилає форму з «Verified».
    mocks.viewer = viewerAs(t, "scheduler1@example.test", "scheduler");
    await expect(
      setInsuranceStatus(formData({ client_id: client6, insurance_status: "verified" })),
    ).rejects.toThrow(`NEXT_REDIRECT /clients/${client6}?ok=insurance`);
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(`/clients/${client6}?ok=insurance`);

    // Тоді: після редиректу — повідомлення й новий статус; повторне відкриття — той самий статус із бази.
    const saved = await openCard("scheduler1@example.test", "scheduler", client6, { ok: "insurance" });
    expect(saved).toContain("Insurance status saved.");
    expect(textOf(elementByTestId(saved, "insurance-status"))).toBe("Insurance: Verified");

    const reopened = await openCard("scheduler1@example.test", "scheduler", client6);
    expect(textOf(elementByTestId(reopened, "insurance-status"))).toBe("Insurance: Verified");
    expect(await insuranceStatusSeenBy(t, scheduler1, client6)).toEqual([{ insurance_status: "verified" }]);
  });
});
