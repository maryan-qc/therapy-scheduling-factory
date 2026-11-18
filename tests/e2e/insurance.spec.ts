// UAT шести AC зрізу 3 (WS9, фабрика): статус перевірки страхування в картці клієнта, AC-INS-01…06.
// Текст AC — requirements/33-planuvalnyk-poznachaie-status-strakhuvannia.md (openspec/specs/insurance-status).
//
// «Дано» — свіжі дані на кожен тест, повторювано між прогонами. База проду зберігає дані між прогонами, а картку з
// застосунку видалити не можна, тож кожен тест створює СВОЮ нову картку дорослого клієнта формою /clients/new у сесії
// scheduler1: ім'я «Client Six|Seven INS-0X <UAT_RUN>» і email client6|7-ins-0x-<UAT_RUN>@example.test (лише синтетика).
// Нова картка — це і є «статус ще ніхто не позначав» (AC-INS-01, 02). Потрібний початковий статус (Verified чи Not
// accepted) ставить сам застосунок — форма страхування в картці в сесії scheduler1, як це зробила б людина; секретний
// ключ (support/admin.ts) не потрібен, і жоден запис не оминає правил застосунку. Кожне «Дано» закінчується перевіркою,
// що картка справді показує потрібний статус.
// «Свій клієнт» therapist1 (AC-INS-04, 05): scheduler1 утримує на /slots перший вільний слот Therapist One, починаючи
// із завтра в поясі практики (слот ще не почався, утримання «Held» триває 1440 хв — підтверджувати не треба, і слот
// звільниться сам), а therapist1 бачить клієнта у своєму списку «My clients». Слот шукаємо щоразу заново.
// AC-INS-05 «напряму»: процес тесту входить як therapist1 через @supabase/supabase-js з публічним ключем застосунку
// (NEXT_PUBLIC_SUPABASE_URL і NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — із .env.local або змінних CI) і пробує і функцію
// бази set_insurance_status, і пряме UPDATE таблиці clients. Відповіді — у кроці «Тоді» і в direct-attempts.json; токенів
// і паролів не друкуємо.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { attachRuntimeErrors, given, thenStep, when } from "./support/uat";

/** Стан входу з tests/e2e/auth.setup.ts (playwright/.auth/<роль>.json). */
type Role = "scheduler" | "scheduler2" | "admin" | "therapist";
type Client = { name: string; email: string };
type InsuranceLabel = "Not set" | "Verified" | "Not accepted" | "Private pay";

/** Синтетичний клієнт тесту: ім'я й email унікальні на прогін (UAT_RUN) і AC — повторний прогін не впирається в дублікат. */
function newClient(who: "client6" | "client7", ac: string): Client {
  const run = process.env.UAT_RUN ?? "manual";
  const tag = ac.replace(/^AC-/, ""); // INS-01
  return {
    name: `Client ${who === "client6" ? "Six" : "Seven"} ${tag} ${run}`,
    email: `${who}-${tag.toLowerCase()}-${run}@example.test`,
  };
}

/** Окрема сесія іншої ролі (як у client-cards.spec.ts) — для «Дано» і для другого глядача в «Тоді». */
async function asRole<T>(browser: Browser, role: Role, body: (page: Page) => Promise<T>): Promise<T> {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    storageState: `playwright/.auth/${role}.json`,
  });
  try {
    return await body(await context.newPage());
  } finally {
    await context.close();
  }
}

/** Усі адреси @example.test, які видно на сторінці. */
async function visibleEmails(page: Page): Promise<string[]> {
  const text = await page.locator("body").innerText();
  return [...new Set(text.match(/[\w.+-]+@example\.test/gi) ?? [])];
}

/** День у поясі практики America/Los_Angeles (РРРР-ММ-ДД) зі зсувом від сьогодні. */
function practiceDay(offset: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
  const day = new Date(`${today}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + offset);
  return day.toISOString().slice(0, 10);
}

const insurance = (page: Page) => page.getByTestId("insurance-status");
const okMessage = (page: Page) => page.getByRole("main").getByRole("status");
const clientId = (href: string) => href.split("/").pop()!;

/** Нова картка дорослого клієнта формою /clients/new (сесія персоналу) → адреса /clients/<uuid>. */
async function createCard(page: Page, client: Client): Promise<string> {
  await page.goto("/clients/new");
  await page.getByLabel("Client type").selectOption("adult");
  await page.getByLabel("Name", { exact: true }).fill(client.name);
  await page.getByLabel("Date of birth").fill("1990-04-12");
  await page.getByLabel("Session language").selectOption("English");
  await page.getByLabel("Email", { exact: true }).fill(client.email);
  await page.getByRole("button", { name: "Create client card" }).click();
  await expect(okMessage(page)).toHaveText("Client created.", { timeout: 15_000 });
  const href = new URL(page.url()).pathname;
  expect(href, "після створення картки адреса — /clients/<uuid>").toMatch(/^\/clients\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText(client.name);
  return href;
}

/** Вибрати статус у формі страхування картки й зберегти; чекаємо відповіді сервера на POST форми, не тексту з «Тоді». */
async function saveInsurance(page: Page, label: InsuranceLabel) {
  const form = page.getByTestId("insurance-form");
  await form.getByRole("combobox").selectOption({ label });
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname.startsWith("/clients/")),
    form.getByRole("button", { name: "Save insurance status" }).click(),
  ]);
}

/** «Дано»: початковий статус ставить сам застосунок — форма картки в сесії персоналу. */
async function markInsurance(page: Page, href: string, label: InsuranceLabel) {
  await page.goto(href);
  await saveInsurance(page, label);
  await expect(okMessage(page)).toHaveText("Insurance status saved.", { timeout: 15_000 });
  await expect(insurance(page)).toHaveText(`Insurance: ${label}`);
}

/** Картка показує статус — так, як її бачить той, хто відкрив її щойно. */
async function expectCardShows(page: Page, href: string, label: InsuranceLabel) {
  await page.goto(href);
  await expect(insurance(page)).toHaveText(`Insurance: ${label}`);
}

const SLOT_SEARCH_DAYS = 30;

/**
 * scheduler1 утримує для клієнта перший вільний слот Therapist One, починаючи із завтра (пояс практики): так слот точно
 * ще не почався. Пошук на /slots звужено email клієнта, тож у списку «Client…» лише він. → «РРРР-ММ-ДД ГГ:ХХ–ГГ:ХХ».
 */
async function holdSlotOfTherapistOne(page: Page, client: Client): Promise<string> {
  await page.goto("/slots");
  const option = page.getByLabel("Therapist", { exact: true }).locator("option", { hasText: /^Therapist One$/ });
  await expect(option, "у списку терапевтів /slots немає «Therapist One»").toHaveAttribute("value", /.+/);
  const therapistId = (await option.getAttribute("value"))!;
  for (let offset = 1; offset <= SLOT_SEARCH_DAYS; offset++) {
    const date = practiceDay(offset);
    await page.goto(`/slots?${new URLSearchParams({ therapist: therapistId, date, client: client.email })}`);
    await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveText(`Therapist One · ${date}`);
    const free = page.getByRole("row").filter({ has: page.getByRole("button", { name: "Hold", exact: true }) });
    if ((await free.count()) === 0) continue;
    const row = free.first();
    const time = (await row.getByRole("cell").first().innerText()).trim();
    await row.getByLabel("Client", { exact: true }).selectOption({ label: `${client.name} (${client.email})` });
    await row.getByRole("button", { name: "Hold", exact: true }).click();
    await expect(okMessage(page)).toHaveText("Slot held.", { timeout: 15_000 });
    // Рядок за клітинкою «Client» (у вільних рядках ім'я є лише серед варіантів списку «Client…»).
    const held = page
      .getByRole("row")
      .filter({ has: page.getByRole("cell", { name: `${client.name} (${client.email})`, exact: true }) });
    await expect(held.getByTestId("slot-status")).toContainText("Held");
    return `${date} ${time}`;
  }
  throw new Error(
    `Немає вільного слота Therapist One на ${SLOT_SEARCH_DAYS} днів наперед (з ${practiceDay(1)}): «Дано» «свій клієнт therapist1» створити неможливо`,
  );
}

/** therapist1 бачить клієнта у своєму списку «My clients» — отже, це його «свій клієнт». */
async function expectOwnClientOfTherapist1(page: Page, client: Client) {
  await page.goto("/clients");
  await expect(page.getByRole("heading", { level: 1, name: "My clients" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: client.name, exact: true })).toBeVisible();
}

/** «Дано» AC-INS-04/05: нова картка, утримання слота Therapist One, статус «Not accepted» — усе в сесії scheduler1. */
async function ownClientNotAccepted(scheduler: Page, client: Client): Promise<{ href: string; slot: string }> {
  const href = await createCard(scheduler, client);
  const slot = await holdSlotOfTherapistOne(scheduler, client);
  await markInsurance(scheduler, href, "Not accepted");
  await expectCardShows(scheduler, href, "Not accepted");
  return { href, slot };
}

/** Дані «Дано» — у звіт (назва картки, адреса, слот). */
async function attachGiven(data: Record<string, unknown>) {
  await test.info().attach("given.json", { body: JSON.stringify(data, null, 2), contentType: "application/json" });
}

// ── Прямі звернення до бази, оминаючи сторінки застосунку (публічний ключ, як у браузера) ─────────────────────────

function publicSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Для прямих звернень потрібні NEXT_PUBLIC_SUPABASE_URL і NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (.env.local або CI)");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

type Reply = { status: number; error: { code?: string; message: string } | null; data: unknown };
/** Що відповіла база на пряме звернення: HTTP-статус, код і текст помилки або дані (без токенів). */
type Attempt = { rejected: boolean; status: number; code: string | null; message: string | null; data: unknown };

const attempt = (reply: Reply): Attempt => ({
  rejected: reply.error !== null,
  status: reply.status,
  code: reply.error?.code ?? null,
  message: reply.error?.message ?? null,
  data: reply.data,
});
const describeAttempt = (a: Attempt) =>
  a.rejected
    ? `відмова: HTTP ${a.status}, код ${a.code}, «${a.message}»`
    : `HTTP ${a.status}, відповідь ${JSON.stringify(a.data)}`;

type DirectTry = { before: unknown; rpc: Attempt; update: Attempt; after: unknown };

/** therapist1 входить напряму в Supabase і пробує змінити статус client6 на «Verified» обома шляхами. */
async function therapist1TriesDirectly(id: string, client: Client): Promise<DirectTry> {
  const supabase = publicSupabase();
  const password = process.env.UAT_PASSWORD_THERAPIST ?? process.env.DEMO_USER_PASSWORD;
  expect(password, "немає пароля therapist1: DEMO_USER_PASSWORD або UAT_PASSWORD_THERAPIST").toBeTruthy();
  const { data: auth, error } = await supabase.auth.signInWithPassword({ email: "therapist1@example.test", password: password! });
  expect(error?.message ?? null, "вхід therapist1 напряму в Supabase").toBeNull();
  expect(auth.user?.email).toBe("therapist1@example.test");
  const row = () => supabase.from("clients").select("name, insurance_status").eq("id", id).maybeSingle();
  try {
    const before = await row();
    // Та сама база, що й у застосунку, і це справді свій клієнт therapist1: рядок картки, створеної на проді, видно напряму.
    expect(before.error, "therapist1 напряму читає картку client6").toBeNull();
    expect(before.data?.name, "напряму видно саме картку client6 цього тесту").toBe(client.name);
    const rpc = await supabase.rpc("set_insurance_status", { p_client_id: id, p_status: "verified" });
    const update = await supabase
      .from("clients")
      .update({ insurance_status: "verified" })
      .eq("id", id)
      .select("id, insurance_status");
    const after = await row();
    return { before: before.data, rpc: attempt(rpc), update: attempt(update), after: after.data };
  } finally {
    await supabase.auth.signOut();
  }
}

/** Користувач без входу напряму: читання картки client6 і спроба змінити її статус. */
async function anonymousTries(id: string) {
  const supabase = publicSupabase();
  const read = await supabase.from("clients").select("id, name, email, insurance_status").eq("id", id);
  const rpc = await supabase.rpc("set_insurance_status", { p_client_id: id, p_status: "not_accepted" });
  return { read: attempt(read), rows: read.data?.length ?? 0, rpc: attempt(rpc) };
}

test.afterEach(async ({ page }) => attachRuntimeErrors(page));

test.describe("scheduler1", () => {
  test.use({ storageState: "playwright/.auth/scheduler.json" });

  test(
    "AC-INS-01: scheduler1 відкриває щойно створену картку client6 — «Insurance: Not set»",
    { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-INS-01" } },
    async ({ page }) => {
      const client = newClient("client6", "AC-INS-01");
      let href = "";

      await given("картку client6 створено, і статус перевірки страхування ще ніхто не позначав", async () => {
        // Нова картка цього тесту формою /clients/new — статус у неї ніхто не позначав.
        href = await createCard(page, client);
        await attachGiven({ client, href });
      });

      await when("scheduler1 відкриває картку client6", async () => {
        await page.goto(href);
      });

      await thenStep(
        page,
        {
          clause: "в картці показано «Insurance: Not set».",
          visible: [`рядок «Insurance: Not set» у картці клієнта «${client.name}»`],
          hidden: [`це картка client6 цього тесту: адреса ${href}, у картці email ${client.email}`],
        },
        async () => {
          await expect(page).toHaveURL((url) => url.pathname === href);
          await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText(client.name);
          await expect(page.getByTestId("client-card")).toContainText(client.email);
          await expect(insurance(page)).toBeVisible();
          await expect(insurance(page)).toHaveText("Insurance: Not set");
        },
      );
    },
  );

  test(
    "AC-INS-02: scheduler1 позначає «Verified» — «Insurance status saved.» і «Insurance: Verified», зокрема після повторного відкриття",
    { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-INS-02" } },
    async ({ page }) => {
      const client = newClient("client6", "AC-INS-02");
      const CLAUSE =
        "scheduler1 бачить повідомлення «Insurance status saved.», а картка client6 показує «Insurance: Verified» і після того, як scheduler1 відкриє її знову.";
      let href = "";

      await given("картка client6 показує «Insurance: Not set»", async () => {
        href = await createCard(page, client);
        await expectCardShows(page, href, "Not set");
        await attachGiven({ client, href });
      });

      await when("scheduler1 позначає статус перевірки страхування «Verified»", async () => {
        await saveInsurance(page, "Verified");
      });

      await thenStep(
        page,
        {
          clause: CLAUSE,
          visible: ["повідомлення «Insurance status saved.»", "рядок «Insurance: Verified» у картці client6"],
          hidden: [`це картка client6 цього тесту (${href})`],
        },
        async () => {
          await expect(okMessage(page)).toHaveText("Insurance status saved.", { timeout: 15_000 });
          await expect(page).toHaveURL((url) => url.pathname === href);
          await expect(insurance(page)).toHaveText("Insurance: Verified");
        },
      );

      await thenStep(
        page,
        {
          clause: CLAUSE,
          visible: [`рядок «Insurance: Verified» у картці «${client.name}», відкритій знову`],
          hidden: [`scheduler1 відкрив картку знову за адресою ${href} (нове завантаження сторінки, без параметрів у адресі)`],
        },
        async () => {
          await page.goto(href);
          await expect(page).toHaveURL((url) => url.pathname === href && url.search === "");
          await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText(client.name);
          await expect(insurance(page)).toHaveText("Insurance: Verified");
        },
      );
    },
  );
});

test.describe("admin1 і scheduler2", () => {
  test.use({ storageState: "playwright/.auth/admin.json" });

  test(
    "AC-INS-03: admin1 змінює статус client7 з «Verified» на «Private pay» — і admin1, і scheduler2 бачать «Insurance: Private pay»",
    { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-INS-03" } },
    async ({ page, browser }) => {
      const client = newClient("client7", "AC-INS-03");
      const CLAUSE = "і admin1, і scheduler2 бачать у картці «Insurance: Private pay».";
      let href = "";

      await given("картка client7 показує «Insurance: Verified»", async () => {
        // Картку створює й позначає «Verified» scheduler1; admin1 бачить той самий статус.
        href = await asRole(browser, "scheduler", async (p) => {
          const link = await createCard(p, client);
          await markInsurance(p, link, "Verified");
          return link;
        });
        await expectCardShows(page, href, "Verified");
        await attachGiven({ client, href });
      });

      await asRole(browser, "scheduler2", async (scheduler2) => {
        await when(
          "admin1 змінює статус перевірки страхування на «Private pay», а потім scheduler2 відкриває картку client7",
          async () => {
            await saveInsurance(page, "Private pay");
            await scheduler2.goto(href);
          },
        );

        await thenStep(
          page,
          {
            clause: CLAUSE,
            visible: [`admin1: рядок «Insurance: Private pay» у картці «${client.name}»`],
            hidden: [`кадр — сесія admin1 (admin1@example.test), картка ${href}`],
          },
          async () => {
            await expect(page.getByTestId("viewer")).toContainText("admin1@example.test");
            await expect(page).toHaveURL((url) => url.pathname === href);
            await expect(insurance(page)).toHaveText("Insurance: Private pay", { timeout: 15_000 });
          },
        );

        await thenStep(
          scheduler2,
          {
            clause: CLAUSE,
            visible: [
              `scheduler2: рядок «Insurance: Private pay» у картці «${client.name}»`,
              "у шапці — scheduler2@example.test",
            ],
            hidden: [`scheduler2 відкрив картку ${href} після того, як admin1 зберіг статус`],
          },
          async () => {
            await expect(scheduler2.getByTestId("viewer")).toContainText("scheduler2@example.test");
            await expect(scheduler2).toHaveURL((url) => url.pathname === href);
            await expect(scheduler2.getByRole("main").getByRole("heading", { level: 1 })).toHaveText(client.name);
            await expect(insurance(scheduler2)).toHaveText("Insurance: Private pay");
          },
        );
      });
    },
  );
});

test.describe("therapist1", () => {
  test.use({ storageState: "playwright/.auth/therapist.json" });

  test(
    "AC-INS-04: therapist1 відкриває картку свого клієнта client6 — «Insurance: Not accepted», змінити статус не запропоновано",
    { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-INS-04" } },
    async ({ page, browser }) => {
      // «Дано» довге: картка, пошук вільного слота Therapist One, утримання, статус — тож більше часу на тест.
      test.setTimeout(120_000);
      const client = newClient("client6", "AC-INS-04");
      let href = "";

      await given("client6 — свій клієнт therapist1, і картка client6 показує «Insurance: Not accepted»", async () => {
        const data = await asRole(browser, "scheduler", (p) => ownClientNotAccepted(p, client));
        href = data.href;
        await attachGiven({ client, ...data });
        await expectOwnClientOfTherapist1(page, client);
      });

      await when("therapist1 відкриває картку client6", async () => {
        await page.goto(href);
      });

      await thenStep(
        page,
        {
          clause:
            "він бачить «Insurance: Not accepted», а змінити статус перевірки страхування в картці йому не запропоновано.",
          visible: [`рядок «Insurance: Not accepted» у картці «${client.name}»`, "у шапці — therapist1@example.test"],
          hidden: [
            "змінити не запропоновано: на сторінці немає форми страхування (insurance-form), поля insurance_status, кнопки «Save insurance status»",
            "в основній частині сторінки немає жодного поля вибору чи перемикача й жодної кнопки, пов'язаної зі статусом (insurance, save, verified, accepted, private)",
          ],
        },
        async () => {
          await expect(page.getByTestId("viewer")).toContainText("therapist1@example.test");
          await expect(page).toHaveURL((url) => url.pathname === href);
          await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText(client.name);
          await expect(insurance(page)).toHaveText("Insurance: Not accepted");
          await expect(page.getByTestId("insurance-form")).toHaveCount(0);
          await expect(page.locator('[name="insurance_status"]')).toHaveCount(0);
          await expect(page.getByRole("button", { name: "Save insurance status" })).toHaveCount(0);
          const main = page.getByRole("main");
          await expect(main.getByRole("combobox")).toHaveCount(0);
          await expect(main.getByRole("listbox")).toHaveCount(0);
          await expect(main.getByRole("radio")).toHaveCount(0);
          await expect(main.getByRole("button", { name: /insurance|save|verified|accepted|private/i })).toHaveCount(0);
        },
      );
    },
  );
});

test.describe("scheduler1 після прямої спроби therapist1", () => {
  test.use({ storageState: "playwright/.auth/scheduler.json" });

  test(
    "AC-INS-05: therapist1 напряму, оминаючи застосунок, пробує поставити client6 «Verified» — scheduler1 бачить «Insurance: Not accepted»",
    { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-INS-05" } },
    async ({ page, browser }) => {
      // «Дано» довге: картка, пошук вільного слота Therapist One, утримання, статус — тож більше часу на тест.
      test.setTimeout(120_000);
      const client = newClient("client6", "AC-INS-05");
      let href = "";
      let tried: DirectTry | undefined;

      await given("client6 — свій клієнт therapist1, і картка client6 показує «Insurance: Not accepted»", async () => {
        const data = await ownClientNotAccepted(page, client);
        href = data.href;
        await attachGiven({ client, ...data });
        await asRole(browser, "therapist", (p) => expectOwnClientOfTherapist1(p, client));
      });

      await when(
        "therapist1 напряму, оминаючи сторінки застосунку, пробує змінити статус перевірки страхування client6 на «Verified»",
        async () => {
          // Вхід therapist1 у Supabase з процесу тесту, далі — функція бази й пряме UPDATE таблиці clients.
          tried = await therapist1TriesDirectly(clientId(href), client);
          await test.info().attach("direct-attempts.json", {
            body: JSON.stringify(tried, null, 2),
            contentType: "application/json",
          });
        },
      );

      await thenStep(
        page,
        {
          clause: "статус не змінився: scheduler1 у картці client6 бачить «Insurance: Not accepted».",
          visible: [`рядок «Insurance: Not accepted» у картці «${client.name}» (сесія scheduler1)`],
          hidden: [
            `спроба 1 — rpc set_insurance_status(client6, "verified") від імені therapist1: ${describeAttempt(tried!.rpc)}`,
            `спроба 2 — UPDATE clients set insurance_status = 'verified' від імені therapist1: ${describeAttempt(tried!.update)}`,
            `рядок client6, який therapist1 читає напряму, до й після спроб однаковий: ${JSON.stringify(tried!.before)} → ${JSON.stringify(tried!.after)}`,
          ],
        },
        async () => {
          expect(tried!.after, "статус у базі після прямих спроб therapist1").toEqual(tried!.before);
          await page.goto(href);
          await expect(page.getByTestId("viewer")).toContainText("scheduler1@example.test");
          await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText(client.name);
          await expect(insurance(page)).toHaveText("Insurance: Not accepted");
        },
      );
    },
  );
});

test.describe("користувач без входу", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test(
    "AC-INS-06: користувач без входу відкриває картку client6 за прямим посиланням — лише сторінка входу; scheduler1 далі бачить «Insurance: Verified»",
    { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-INS-06" } },
    async ({ page, browser }) => {
      const client = newClient("client6", "AC-INS-06");
      const CLAUSE =
        "він бачить лише сторінку входу, статусу страхування й інших даних client6 не показано, а scheduler1 після цього бачить у картці client6 «Insurance: Verified».";
      let href = "";

      await given("користувач не увійшов у застосунок, а картка client6 показує «Insurance: Verified»", async () => {
        href = await asRole(browser, "scheduler", async (p) => {
          const link = await createCard(p, client);
          await markInsurance(p, link, "Verified");
          await expectCardShows(p, link, "Verified");
          return link;
        });
        await attachGiven({ client, href });
        // Браузер цього тесту — без жодної cookie, тобто без сесії.
        expect(await page.context().cookies()).toEqual([]);
      });

      await when("він відкриває картку client6 за прямим посиланням", async () => {
        await page.goto(href);
      });

      await thenStep(
        page,
        {
          clause: CLAUSE,
          visible: ["сторінка входу: заголовок «Sign in», поля «Email» і «Password», кнопка «Sign in»"],
          hidden: [
            `застосунок перевів з ${href} на /login`,
            `статусу й даних client6 немає ні в тексті, ні в HTML сторінки: ні «Insurance», ні «${client.name}», ні ${client.email}, жодної адреси @example.test; шапки користувача й блоку картки немає`,
            "і напряму без входу (публічний ключ) база не віддає рядка client6 і відхиляє set_insurance_status (anonymous-attempts.json)",
          ],
        },
        async () => {
          await expect(page).toHaveURL((url) => url.pathname === "/login");
          await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
          await expect(page.getByLabel("Email")).toBeVisible();
          await expect(page.getByLabel("Password")).toBeVisible();
          await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
          await expect(page.getByTestId("viewer")).toHaveCount(0);
          await expect(page.getByTestId("client-card")).toHaveCount(0);
          await expect(insurance(page)).toHaveCount(0);
          await expect(page.locator("body")).not.toContainText("Insurance");
          await expect(page.locator("body")).not.toContainText(client.name);
          expect(await visibleEmails(page)).toEqual([]);
          const html = await page.content();
          expect(html).not.toContain("Insurance");
          expect(html).not.toContain(client.name);
          expect(html).not.toContain(client.email);

          const anonymous = await anonymousTries(clientId(href));
          await test.info().attach("anonymous-attempts.json", {
            body: JSON.stringify(anonymous, null, 2),
            contentType: "application/json",
          });
          expect(anonymous.rows, `без входу база віддала рядок client6: ${describeAttempt(anonymous.read)}`).toBe(0);
          expect(anonymous.rpc.rejected, `без входу set_insurance_status не відхилено: ${describeAttempt(anonymous.rpc)}`).toBe(true);
        },
      );

      await asRole(browser, "scheduler", (scheduler) =>
        thenStep(
          scheduler,
          {
            clause: CLAUSE,
            visible: [`scheduler1: рядок «Insurance: Verified» у картці «${client.name}»`, "у шапці — scheduler1@example.test"],
            hidden: ["scheduler1 відкрив картку після спроб користувача без входу (сторінка й напряму)"],
          },
          async () => {
            await scheduler.goto(href);
            await expect(scheduler.getByTestId("viewer")).toContainText("scheduler1@example.test");
            await expect(scheduler.getByRole("main").getByRole("heading", { level: 1 })).toHaveText(client.name);
            await expect(insurance(scheduler)).toHaveText("Insurance: Verified");
          },
        ),
      );
    },
  );
});
