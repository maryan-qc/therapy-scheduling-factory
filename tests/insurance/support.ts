// Спільне для тестів статусу перевірки страхування (openspec/specs/insurance-status, AC-INS-01…06).
// Інтерфейс — з контракту зрізу 3 (функція бази public.set_insurance_status, колонка public.clients.insurance_status,
// data-testid сторінки картки), а не з реалізації.
// Дані — у справжній базі PGlite (tests/db/supabase-pglite.ts) з усіма міграціями й RLS. Сторінка й дія отримують
// клієнт Supabase, який виконує ті самі запити в PGlite від імені користувача, тож те, що людина бачить у картці,
// прочитано з бази під її правами, а збереження йде через права бази, а не через копію правила в тесті.
import type { TestDb } from "../db/supabase-pglite";

export type StaffOrTherapist = "admin" | "scheduler" | "therapist";
type Row = Record<string, unknown>;
type DbError = { code?: string; message: string };

const IDENT = /^[a-z_][a-z0-9_]*$/;

function ident(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Непідтримуваний ідентифікатор у тестовому клієнті Supabase: ${name}`);
  return name;
}

async function runAs(t: TestDb, userId: string, sql: string, params: unknown[]): Promise<{ rows: Row[]; error: DbError | null }> {
  try {
    return { rows: await t.asUser<Row>(userId, sql, params), error: null };
  } catch (cause) {
    const { code, message } = cause as { code?: string; message?: string };
    return { rows: [], error: { code, message: message ?? String(cause) } };
  }
}

/**
 * Клієнт Supabase (підмножина supabase-js: from().select().eq().order().limit().maybeSingle()/single()/await і rpc()),
 * що виконує запит у PGlite від імені користувача (role authenticated, RLS і GRANT бази). Рядки — як у PostgREST:
 * через to_jsonb, тож дати й час приходять рядками.
 */
export function supabaseAs(t: TestDb, userId: string) {
  return {
    from(table: string) {
      let columns = "*";
      const filters: { column: string; value: unknown }[] = [];
      const orderBy: string[] = [];
      let limit: number | null = null;
      const query = async () => {
        const where = filters.map((f, i) => `${ident(f.column)} = $${i + 1}`);
        const sql = [
          `select to_jsonb(x) as row from (select ${columns} from public.${ident(table)}`,
          where.length > 0 ? ` where ${where.join(" and ")}` : "",
          orderBy.length > 0 ? ` order by ${orderBy.join(", ")}` : "",
          limit === null ? "" : ` limit ${limit}`,
          ") as x",
        ].join("");
        const { rows, error } = await runAs(t, userId, sql, filters.map((f) => f.value));
        return { rows: rows.map((r) => r.row as Row), error };
      };
      const builder = {
        select(selected = "*") {
          columns = selected;
          return builder;
        },
        eq(column: string, value: unknown) {
          filters.push({ column, value });
          return builder;
        },
        order(column: string, options: { ascending?: boolean } = {}) {
          orderBy.push(`${ident(column)} ${options.ascending === false ? "desc" : "asc"}`);
          return builder;
        },
        limit(count: number) {
          limit = Math.trunc(count);
          return builder;
        },
        async maybeSingle() {
          const { rows, error } = await query();
          if (error) return { data: null, error };
          if (rows.length > 1) return { data: null, error: { code: "PGRST116", message: "multiple rows" } };
          return { data: rows[0] ?? null, error: null };
        },
        async single() {
          const { rows, error } = await query();
          if (error) return { data: null, error };
          if (rows.length !== 1) return { data: null, error: { code: "PGRST116", message: `${rows.length} rows` } };
          return { data: rows[0], error: null };
        },
        then<R>(resolve: (value: { data: Row[] | null; error: DbError | null }) => R, reject?: (reason: unknown) => R) {
          return query()
            .then(({ rows, error }) => ({ data: error ? null : rows, error }))
            .then(resolve, reject);
        },
      };
      return builder;
    },
    async rpc(fn: string, args: Record<string, unknown> = {}) {
      const names = Object.keys(args);
      const call = names.map((name, i) => `${ident(name)} => $${i + 1}`).join(", ");
      const { rows, error } = await runAs(
        t,
        userId,
        `select public.${ident(fn)}(${call}) as result`,
        names.map((name) => args[name]),
      );
      return error ? { data: null, error } : { data: rows[0]?.result ?? null, error: null };
    },
  };
}

/** Те, що повертає requireViewer() (src/lib/supabase/viewer.ts) для користувача з supabase/demo-users.json. */
export function viewerAs(t: TestDb, email: string, role: StaffOrTherapist) {
  const id = t.users[email];
  return { supabase: supabaseAs(t, id), id, email, fullName: null, role };
}

/** Картка дорослого так, як її створює планувальник (insert від його імені; статус страхування не передається). */
export async function createAdultCard(t: TestDb, userId: string, name: string, email: string): Promise<string> {
  const [row] = await t.asUser<{ id: string }>(
    userId,
    `insert into public.clients (client_type, name, date_of_birth, session_language, email)
     values ('adult', $1, '1990-05-14', 'English', $2) returning id`,
    [name, email],
  );
  return row.id;
}

/** Прибирає утримання й картки попереднього тесту (слоти лишаються). */
export async function resetCards(t: TestDb): Promise<void> {
  await t.asService("delete from public.holds");
  await t.asService("delete from public.clients");
}

/**
 * «Свій клієнт» терапевта: scheduler утримує слот терапевта через 48 годин (public.hold_slot) і підтверджує утримання
 * (public.confirm_hold) — сеанс «Confirmed» робить клієнта своїм без обмеження в часі. Повертає коди обох функцій.
 */
export async function makeOwnClient(t: TestDb, schedulerId: string, therapistEmail: string, clientId: string) {
  const [slot] = await t.asService<{ id: string }>(
    `insert into public.slots (therapist_id, starts_at, ends_at)
     select th.id, date_trunc('hour', now()) + interval '48 hours', date_trunc('hour', now()) + interval '49 hours'
     from public.therapists as th where th.email = $1
     on conflict (therapist_id, starts_at) do update set ends_at = excluded.ends_at
     returning id`,
    [therapistEmail],
  );
  const [{ held }] = await t.asUser<{ held: { code: string; hold_id?: string } }>(
    schedulerId,
    "select public.hold_slot($1::uuid, $2::uuid) as held",
    [slot.id, clientId],
  );
  const [{ confirmed }] = await t.asUser<{ confirmed: { code: string } }>(
    schedulerId,
    "select public.confirm_hold($1::uuid) as confirmed",
    [held.hold_id ?? null],
  );
  return { hold: held.code, confirm: confirmed.code };
}

/** Виклик public.set_insurance_status від імені користувача — відповідь функції ({"code": …}). */
export async function setInsuranceAs(t: TestDb, userId: string, clientId: string, status: string) {
  const [{ result }] = await t.asUser<{ result: { code: string } }>(
    userId,
    "select public.set_insurance_status($1::uuid, $2::text) as result",
    [clientId, status],
  );
  return result;
}

/** Статус страхування картки так, як його читає користувач під своїм RLS (порожньо — картки він не бачить). */
export function insuranceStatusSeenBy(t: TestDb, userId: string, clientId: string) {
  return t.asUser<{ insurance_status: string }>(
    userId,
    "select insurance_status from public.clients where id = $1",
    [clientId],
  );
}

// ── Розбір HTML сторінки (renderToStaticMarkup) ─────────────────────────────

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#x27": "'", "#39": "'" };
const decode = (text: string) => text.replace(/&(amp|lt|gt|quot|#x27|#39);/g, (_m, name: string) => ENTITIES[name]);

/** HTML елемента з data-testid разом із вкладеними елементами, або null, якщо такого елемента немає. */
export function elementByTestId(html: string, testId: string): string | null {
  const open = new RegExp(`<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*\\sdata-testid="${testId}"[^>]*>`).exec(html);
  if (!open) return null;
  if (open[0].endsWith("/>")) return open[0];
  const tag = new RegExp(`<(/?)${open[1]}\\b[^>]*>`, "g");
  tag.lastIndex = open.index + open[0].length;
  let depth = 1;
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    if (m[1]) depth -= 1;
    else if (!m[0].endsWith("/>")) depth += 1;
    if (depth === 0) return html.slice(open.index, m.index + m[0].length);
  }
  return null;
}

/** Видимий текст фрагмента HTML: без тегів, з розкодованими сутностями й одним пробілом між словами. */
export function textOf(html: string | null): string | null {
  return html === null ? null : decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Атрибути всіх тегів `tag` у фрагменті (значення розкодовано); немає фрагмента — порожньо. */
export function tagAttributes(html: string | null, tag: string): Record<string, string>[] {
  return [...(html ?? "").matchAll(new RegExp(`<${tag}\\b([^>]*)>`, "g"))].map((m) =>
    Object.fromEntries(
      [...m[1].matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:="([^"]*)")?/g)].map((a) => [a[1], decode(a[2] ?? "")]),
    ),
  );
}

/** Варіанти <option> фрагмента: значення й видимий текст; немає фрагмента — порожньо. */
export function optionsOf(html: string | null): { value: string; label: string }[] {
  return [...(html ?? "").matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)].map((m) => ({
    value: decode(/\svalue="([^"]*)"/.exec(m[1])?.[1] ?? ""),
    label: textOf(m[2]) ?? "",
  }));
}
