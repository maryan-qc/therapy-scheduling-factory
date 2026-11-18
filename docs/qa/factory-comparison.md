# Звіт порівняння зрізу 3: звичайно проти фабрики

- Зріз 3: планувальник або адміністратор позначає в картці клієнта статус перевірки страхування («Verified», «Not
  accepted», «Private pay»), а кожен, хто бачить картку, бачить «Insurance: <статус>»; терапевт статус лише бачить.
- AC зрізу 3: AC-INS-01, AC-INS-02, AC-INS-03, AC-INS-04, AC-INS-05, AC-INS-06 — вимога PM
  HryhoriiHaponiukQuitCode/therapy-scheduling-spec#33. Знімок у двійнику
  ([`requirements/33-…md`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/e70414fbe7419859d08e3e4ac49c9d08be88d3b4/requirements/33-planuvalnyk-poznachaie-status-strakhuvannia.md))
  дослівно збігається зі знімком основного репо
  ([`requirements/33-…md`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/requirements/33-planuvalnyk-poznachaie-status-strakhuvannia.md)),
  специфікація `openspec/specs/insurance-status/spec.md` — теж (twin PR
  [#3](https://github.com/maryan-qc/therapy-scheduling-factory/pull/3)). Вимогу #34 (AC-DOC-01…11) PM переніс на
  пізніший зріз, тому в порівнянні її немає.
- Звичайно: https://github.com/maryan-qc/therapy-scheduling, main `79b490b` (злиття
  [#48](https://github.com/maryan-qc/therapy-scheduling/pull/48), останнього PR зрізу 3), прод
  https://therapy-scheduling-sigma.vercel.app (UAT зрізу 3 пройшов на `60b0bc0`; відтоді прод пішов на пізніші зрізи).
- Фабрика: https://github.com/maryan-qc/therapy-scheduling-factory, main `28dcbbb` (код зрізу — `db7c95d`, PR
  [#4](https://github.com/maryan-qc/therapy-scheduling-factory/pull/4); UAT — `ca6cbb3`, PR
  [#5](https://github.com/maryan-qc/therapy-scheduling-factory/pull/5)), прод
  https://therapy-scheduling-twin-mq-factory.vercel.app
  ([`/api/health`](https://therapy-scheduling-twin-mq-factory.vercel.app/api/health) 18.11.2026 → sha `28dcbbb`, db ok).
- Фабрика й імпортер: курс-редакція `koldovsky/2026-quitcode-09-factory` на коміті
  [`1280bc6`](https://github.com/koldovsky/2026-quitcode-09-factory/commit/1280bc62cb001ded1fa31f15f45057d8b51f45f3)
  (factory 0.1.0, node v24.15.0, darwin). Адаптер —
  [`74b0864`](https://github.com/maryan-qc/2026-quitcode-09-factory/commit/74b0864fa6c4d70fb1559229a692ec846076fcda)
  (гілка `team/therapy-scheduling` форку). Він змінює лише `tools/ac-to-task.mjs`: імпортер не читає коментарі HTML у
  матриці `docs/conformance.md`, інакше приклад шаблону став би pass-to-pass. До нього — 2 тести на вимозі PM #33.
- Моделі фабрики: планувальник, виконавець і рецензент — `claude-sonnet-5-5`, конфіг фабрики `f780a4a53376`
  ([«Cost and provenance»](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L47)).
  Записи UAT розбирав `claude-haiku-5-5`, суперечки йшли до `claude-sonnet-5-5`
  ([звіт UAT двійника](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/report.md)).

## Прогони фабрики

| Run id | Задача і AC | Стан | Спроби | Вартість | Wall-час | Дайджест пакета доказів | PR |
|---|---|---|---|---|---|---|---|
| `run-20261118095441-806406` | `ins`: AC-INS-01…06 (large) | needs-human: «the planner did not produce a plan» ([L4](../factory/run-20261118095441-806406.events.jsonl#L4)); агент відповів «Not logged in» | 0/3 (зупинився на плануванні) | $0 ([L3](../factory/run-20261118095441-806406.events.jsonl#L3)) | 16.7 с ([L1](../factory/run-20261118095441-806406.events.jsonl#L1) → [L4](../factory/run-20261118095441-806406.events.jsonl#L4)) | — (пакета немає) | — |
| `run-20261118101125-a92daa` | `ins`: AC-INS-01…06 (large, тому зупинка на схвалення плану) | released ([L15](../factory/run-20261118101125-a92daa.events.jsonl#L15)), PR злито, UAT PASS ([L18](../factory/run-20261118101125-a92daa.events.jsonl#L18)) | 2/3 ([L8](../factory/run-20261118101125-a92daa.events.jsonl#L8), [L11](../factory/run-20261118101125-a92daa.events.jsonl#L11)) | $0.651792 ([L3](../factory/run-20261118101125-a92daa.events.jsonl#L3), [L6](../factory/run-20261118101125-a92daa.events.jsonl#L6), [L10](../factory/run-20261118101125-a92daa.events.jsonl#L10), [L13](../factory/run-20261118101125-a92daa.events.jsonl#L13)) | 6029.8 с від `created` до `released` ([L1](../factory/run-20261118101125-a92daa.events.jsonl#L1) → [L15](../factory/run-20261118101125-a92daa.events.jsonl#L15)). З них 5714.6 с — очікування `approve plan` ([L4](../factory/run-20261118101125-a92daa.events.jsonl#L4) → [L5](../factory/run-20261118101125-a92daa.events.jsonl#L5)). Машина працювала 315.2 с: 50.3 с планування і 264.9 с будування з воротами | `e2df8417cbd673ccdd850334e897a27f0ac01c35978c273178b399d3eb8fe8e9` ([L14](../factory/run-20261118101125-a92daa.events.jsonl#L14); це sha256 [пакета](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md)) | [#4](https://github.com/maryan-qc/therapy-scheduling-factory/pull/4) |

- **Чому один прогін на всі 6 AC.** Задача `ins` містить усі шість AC (size `large`, отже план схвалює людина), хоча
  курс радить 1–3 критерії на задачу
  ([tasks/README](https://github.com/koldovsky/2026-quitcode-09-factory/blob/1280bc62cb001ded1fa31f15f45057d8b51f45f3/examples/next-supabase/control/tasks/README.md#L13)).
  Причина — рішення розробника. Допуск фабрики відмовляє тестам, які вже проходять на старому коді
  ([P4.5](https://github.com/koldovsky/2026-quitcode-09-factory/blob/1280bc62cb001ded1fa31f15f45057d8b51f45f3/tests/boundaries.test.mjs#L69)),
  а AC-INS-05/06 перевіряють відмови, тож в окремій задачі вони могли б «уже проходити». Окремим прогоном це не
  перевіряли.
- **Чому прогонів два.** На macOS `scrubEnv` фабрики лишає агенту лише змінні зі списку
  [`ENV_KEEP`](https://github.com/koldovsky/2026-quitcode-09-factory/blob/1280bc62cb001ded1fa31f15f45057d8b51f45f3/src/util.mjs#L132),
  а `USER` у ньому немає. Без `USER` Claude Code не знаходить свого входу, тому перший прогін за 17 с перейшов у
  needs-human і коштував $0. Код фабрики не змінювали: `agent.executable` тепер вказує на обгортку
  `~/pf/bin/claude-mac.sh`, яка відновлює `USER`. Для цього знадобилось нове `approve config`
  ([журнал](factory-journal.md), рядки 20–21). `answer` у першому прогоні не було: замість нього запустили другий.
- **Поставка.** Двійник отримав зміну командою `factory deliver`, а не вручну: push гілки, PR з пакетом доказів в описі,
  автозлиття squash ([L16](../factory/run-20261118101125-a92daa.events.jsonl#L16),
  [L17](../factory/run-20261118101125-a92daa.events.jsonl#L17)). PR #4 відкрито 15:47:02Z, злито 15:49:27Z
  (`db7c95d`). Перед `deliver` розробник сам прочитав diff і ще раз перевірив гілку тими самими перевірками, що в CI
  ([журнал](factory-journal.md), рядок 24), тож між `released` (11:51:55Z) і push (15:47:00Z) минуло 3 год 55 хв.
  CI на `main` ([run 44340064185](https://github.com/maryan-qc/therapy-scheduling-factory/actions/runs/44340064185)):
  job [`db-deploy`](https://github.com/maryan-qc/therapy-scheduling-factory/actions/runs/44340064185/job/134928728858)
  застосував лише `20261118100000_insurance_status.sql`. Після цього `factory uat` записав
  [додаток UAT](../factory/run-20261118101125-a92daa.uat.md) і коментар у PR #4.
- **Політика.** `autoMerge: auto-tier`, усі класи змін (`docs`, `code`, `migration`) мають рівень `auto`. Конфіг
  схвалив розробник (`f780a4a53376`, [пакет, рядок 47](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L47)).
  Пакет підписує прогін як «class docs is auto» ([рядок 4](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L4)),
  хоча зміна торкається всіх трьох класів.
- **Вада показу у фабриці.** Рядок статусу (`state=released (gate maintainability: FAIL)`,
  [`src/cli.mjs#L44`](https://github.com/koldovsky/2026-quitcode-09-factory/blob/1280bc62cb001ded1fa31f15f45057d8b51f45f3/src/cli.mjs#L44))
  і причина автозлиття («tier auto: gate maintainability: FAIL»,
  [L17](../factory/run-20261118101125-a92daa.events.jsonl#L17)) досі показують FAIL зі спроби 1. Насправді спроба 2
  пройшла всі ворота ([пакет, «Gates»](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L16)).

## За AC

Посилання «звичайно» вказують на `79b490b` основного репо. Видимі тести фабрики — коміт tests-first
[`b61f3d2`](https://github.com/maryan-qc/therapy-scheduling-factory/commit/b61f3d295dc0d05dd813b4e31d48dbede3f91181)
(тег `ws9-red`), код фабрики — `db7c95d`, UAT двійника — `ca6cbb3`. У рядках пакета фабрики для кожного AC стоїть
«AC-INS-0N ✓, holdout ins 27/27»
([пакет, рядки 9–14](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L9-L14)).
Розподіл 27 прихованих сценаріїв за AC узято з ідентифікаторів випадків у `store/runs/run-20261118101125-a92daa/run.json`
(локально, не в git). Набір `ins` запечатано AES-256-GCM
([`src/holdouts.mjs#L18`](https://github.com/koldovsky/2026-quitcode-09-factory/blob/1280bc62cb001ded1fa31f15f45057d8b51f45f3/src/holdouts.mjs#L18)),
дайджест `6a00a85b9d13…`. Він лежить лише в теці контролю, не в git, і цей звіт його не відкривав.

| AC | Звичайно: тест і доказ | Звичайно: UAT | Фабрика: `verifiedBy` і доказ у пакеті | Фабрика: UAT на проді двійника | Різниця в поведінці |
|---|---|---|---|---|---|
| AC-INS-01 | база [`insurance-status.test.ts#L66`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/db/insurance-status.test.ts#L66); unit [`insurance.test.tsx#L13`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/clients/insurance.test.tsx#L13); негативний контроль NC-3 → FAIL (R1) ([пакет](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/proof-pack.md)) | PASS (R6), [кадр](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/uat/2026-11-09/frames/AC-INS-01-then-1.png) | `visible:AC-INS-01` ✓ ([`#L53`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/b61f3d295dc0d05dd813b4e31d48dbede3f91181/tests/insurance/AC-INS-01-not-set.test.tsx#L53), [`#L57`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/b61f3d295dc0d05dd813b4e31d48dbede3f91181/tests/insurance/AC-INS-01-not-set.test.tsx#L57)); `holdout:ins` — 4/4 на цей AC | PASS (R6), [кадр](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/frames/AC-INS-01-then-1.png), [специфікація](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/tests/e2e/insurance.spec.ts#L232) | Рядок однаковий. Форма різна. У звичайній реалізації список стоїть на вимкненому варіанті «Select…» з `required` ([`insurance-section.tsx#L31-L35`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/src/app/clients/%5Bid%5D/insurance-section.tsx#L31-L35)), тож без вибору статус не зберегти. У фабриці порожнього варіанта немає ([`page.tsx#L73-L79`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/src/app/clients/%5Bid%5D/page.tsx#L73-L79)), список одразу стоїть на «Verified», і один клік «Save insurance status» позначає клієнта перевіреним. AC це не порушує: такий список («три варіанти… без `not_set`») записано в [затвердженому плані](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L82) і в контракті людини (тека контролю, не в git) |
| AC-INS-02 | база [`#L76`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/db/insurance-status.test.ts#L76); дія [`insurance-action.test.ts#L37`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/clients/insurance-action.test.ts#L37); unit [`#L18`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/clients/insurance.test.tsx#L18) | PASS (R6), [кадр 1](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/uat/2026-11-09/frames/AC-INS-02-then-1.png), [кадр 2](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/uat/2026-11-09/frames/AC-INS-02-then-2.png) | `visible:AC-INS-02` ✓ ([`#L66`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/b61f3d295dc0d05dd813b4e31d48dbede3f91181/tests/insurance/AC-INS-02-scheduler-marks-verified.test.tsx#L66), [`#L77`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/b61f3d295dc0d05dd813b4e31d48dbede3f91181/tests/insurance/AC-INS-02-scheduler-marks-verified.test.tsx#L77)); `holdout:ins` — 6/6 на цей AC | PASS (R6), [кадр 1](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/frames/AC-INS-02-then-1.png), [кадр 2](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/frames/AC-INS-02-then-2.png), [специфікація](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/tests/e2e/insurance.spec.ts#L267) | Повідомлення й результат однакові. Різниця лише в підписі: у фабриці список без нього, у звичайній є `Label` «Insurance status» ([`#L31`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/src/app/clients/%5Bid%5D/insurance-section.tsx#L31)) |
| AC-INS-03 | база [`#L81`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/db/insurance-status.test.ts#L81); unit [`#L25`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/clients/insurance.test.tsx#L25) | PASS (R6), [кадр 1](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/uat/2026-11-09/frames/AC-INS-03-then-1.png), [кадр 2](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/uat/2026-11-09/frames/AC-INS-03-then-2.png) | `visible:AC-INS-03` ✓ ([`#L58`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/b61f3d295dc0d05dd813b4e31d48dbede3f91181/tests/insurance/AC-INS-03-admin-private-pay.test.tsx#L58), [`#L69`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/b61f3d295dc0d05dd813b4e31d48dbede3f91181/tests/insurance/AC-INS-03-admin-private-pay.test.tsx#L69)); `holdout:ins` — 4/4 на цей AC | PASS (R6), [кадр 1](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/frames/AC-INS-03-then-1.png), [кадр 2](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/frames/AC-INS-03-then-2.png), [специфікація](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/tests/e2e/insurance.spec.ts#L321) | Результат однаковий. Звичайна реалізація ставить у список поточний статус (`defaultValue={current}`, [`#L21`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/src/app/clients/%5Bid%5D/insurance-section.tsx#L21), [`#L32`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/src/app/clients/%5Bid%5D/insurance-section.tsx#L32)). У фабриці список завжди починається з «Verified»: якщо в картці «Private pay» і людина натисне «Save» без вибору, статус стане «Verified» |
| AC-INS-04 | база (RLS: свій і чужий клієнт) [`#L88`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/db/insurance-status.test.ts#L88); unit (форми немає) [`#L29`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/clients/insurance.test.tsx#L29) | PASS (R6), [кадр](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/uat/2026-11-09/frames/AC-INS-04-then-1.png) | `visible:AC-INS-04` ✓ ([`#L64`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/b61f3d295dc0d05dd813b4e31d48dbede3f91181/tests/insurance/AC-INS-04-therapist-read-only.test.tsx#L64), [`#L70`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/b61f3d295dc0d05dd813b4e31d48dbede3f91181/tests/insurance/AC-INS-04-therapist-read-only.test.tsx#L70)); `holdout:ins` — 4/4 на цей AC | PASS (R6), [кадр](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/frames/AC-INS-04-then-1.png), [специфікація](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/tests/e2e/insurance.spec.ts#L388) | немає: в обох рядок статусу є, а форми немає |
| AC-INS-05 | база [`#L95`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/db/insurance-status.test.ts#L95), [`#L110`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/db/insurance-status.test.ts#L110), [`#L117`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/db/insurance-status.test.ts#L117); дія [`#L45`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/clients/insurance-action.test.ts#L45); SQL-мутанти C10, C11, C12 — KILLED ([`mutants.mjs#L90`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/scripts/mutants.mjs#L90)) | PASS (R6), [кадр](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/uat/2026-11-09/frames/AC-INS-05-then-1.png) | `visible:AC-INS-05` ✓ ([`#L33`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/b61f3d295dc0d05dd813b4e31d48dbede3f91181/tests/insurance/AC-INS-05-therapist-direct-change.test.ts#L33), [`#L41`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/b61f3d295dc0d05dd813b4e31d48dbede3f91181/tests/insurance/AC-INS-05-therapist-direct-change.test.ts#L41)); `holdout:ins` — 5/5 на цей AC | PASS (R6), [кадр](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/frames/AC-INS-05-then-1.png), [специфікація](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/tests/e2e/insurance.spec.ts#L441) | Порядок перевірок у базі однаковий: роль → значення → клієнт. Звичайна реалізація ставить `public`-обгортку `security invoker` над функцією в `private` і повертає код `INSURANCE_FORBIDDEN` ([міграція](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/supabase/migrations/20261106170000_insurance_status.sql)). Фабрика має одну `public`-функцію `security definer` з кодом `FORBIDDEN` ([міграція](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/supabase/migrations/20261118100000_insurance_status.sql)). Після відмови звичайна сторінка показує текст «Only schedulers and admins can change the insurance status.» ([`insurance.ts#L27-L32`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/src/lib/clients/insurance.ts#L27-L32)); цей текст написав розробник, PM його не давав. Сторінка фабрики нічого не пише ([`page.tsx#L57-L59`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/src/app/clients/%5Bid%5D/page.tsx#L57-L59); нотатка рецензента low, [пакет, рядок 42](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L42)). На «Тоді» цього AC різниця не впливає |
| AC-INS-06 | база (`anon`) [`#L123`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/db/insurance-status.test.ts#L123); дія (`requireViewer` → `/login`) [`#L61`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/tests/clients/insurance-action.test.ts#L61); SQL-мутант C13 — KILLED ([`mutants.mjs#L111`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/scripts/mutants.mjs#L111)) | PASS (R6), [кадр 1](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/uat/2026-11-09/frames/AC-INS-06-then-1.png), [кадр 2](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/uat/2026-11-09/frames/AC-INS-06-then-2.png) | `visible:AC-INS-06` ✓, лише база ([`#L31`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/b61f3d295dc0d05dd813b4e31d48dbede3f91181/tests/insurance/AC-INS-06-anon-login-only.test.ts#L31), [`#L41`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/b61f3d295dc0d05dd813b4e31d48dbede3f91181/tests/insurance/AC-INS-06-anon-login-only.test.ts#L41)); `holdout:ins` — 4/4 на цей AC. Частину «лише сторінка входу» ворота не перевіряли: за [планом](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L105) її дає наявний `src/proxy.ts`, а він не змінювався | PASS (R6), [кадр 1](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/frames/AC-INS-06-then-1.png), [кадр 2](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/frames/AC-INS-06-then-2.png), [специфікація](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/tests/e2e/insurance.spec.ts#L496) | Поведінка однакова: сторінку входу в обох показує той самий [`src/proxy.ts`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/src/proxy.ts). Відрізняється доказ: у фабриці частину «лише сторінка входу» доводить тільки UAT |

## Метрики

| Метрика | Звичайно | Фабрика | Джерело |
|---|---|---|---|
| Час (календарний) | 65 год 53 хв 48 с: від відкриття #43 «Специфікація» (2026-11-06T15:26:11Z) до злиття #48 (2026-11-09T09:19:59Z) | 22 год 40 хв 35 с: від коміту tests-first `b61f3d2` (2026-11-17T17:08:52Z) до злиття #4 (2026-11-18T15:49:27Z). До злиття UAT-PR #5 (16:06:40Z) — 22 год 57 хв 48 с. Wall-час прогонів — 16.7 с і 6029.8 с (див. «Прогони фабрики») | [#43](https://github.com/maryan-qc/therapy-scheduling/pull/43), [#48](https://github.com/maryan-qc/therapy-scheduling/pull/48); [`b61f3d2`](https://github.com/maryan-qc/therapy-scheduling-factory/commit/b61f3d295dc0d05dd813b4e31d48dbede3f91181), [#4](https://github.com/maryan-qc/therapy-scheduling-factory/pull/4), [#5](https://github.com/maryan-qc/therapy-scheduling-factory/pull/5); [events](../factory/run-20261118101125-a92daa.events.jsonl) |
| Хвилини людини | не виміряно | ≈52 хв. Це оцінка за часом повідомлень у чаті, а не вимір: двійник (крок 2) ≈40, ключ печатки сценаріїв ≈5, схвалення ≈6 (2 + 1 + 3), «так» перед поставкою ≈1. Налаштування двійника 09.11 — не виміряно | [журнал хвилин](factory-journal.md), рядки 8–29 |
| Вартість | не виміряно: вартість сесій агента, що писали специфікацію, код і тести, не записано. Відомо лише: рецензент UAT $0.0128 і негативні контролі $0.0377 | $0.651792 (≈$0.65) за обидва прогони. run-…a92daa — $0.651792: планувальник $0.146406, виконавець $0.313790 + $0.067027 за 2 спроби, рецензент $0.124569. run-…806406 — $0. Окремо рецензент UAT — $0.0139. Окремі сесії агента (червоні тести, приховані сценарії, специфікації UAT, перевірка задачі F11) — не виміряно | звичайно: [пакет доказів, розділ C](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/proof-pack.md); фабрика: [«Cost and provenance»](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L46), events [L3](../factory/run-20261118101125-a92daa.events.jsonl#L3), [L6](../factory/run-20261118101125-a92daa.events.jsonl#L6), [L10](../factory/run-20261118101125-a92daa.events.jsonl#L10), [L13](../factory/run-20261118101125-a92daa.events.jsonl#L13), [L3 першого прогону](../factory/run-20261118095441-806406.events.jsonl#L3), [звіт UAT двійника](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/report.md) |
| Токени | не виміряно | run-…a92daa — 732 844 разом: вхідні 64, вихідні 19 168, читання з кешу 613 965, запис у кеш 99 647. За агентами (вхідні / вихідні / читання / запис): планувальник 10 / 4 794 / 61 704 / 23 069; виконавець, спроба 1 — 30 / 10 079 / 406 921 / 43 062; виконавець, спроба 2 — 12 / 2 127 / 70 926 / 9 660; рецензент 12 / 2 168 / 74 414 / 23 856. run-…806406 — 0. Окремий агент специфікацій UAT — 172 411 (зі сповіщення про завершення субагента). Інші окремі сесії — не виміряно | поле `usage` у `store/runs/<run-id>/agent-<роль>-<спроба>-summary.json` (локально, не в git); агент UAT — [журнал](factory-journal.md), рядок 26 |
| Спроби | 0 червоних прогонів CI до злиття. На гілках 6 PR зрізу 3 було 42 прогони (CI, quality, architecture): 0 failure, 2 cancelled (на #43 їх перервав новіший push). Локальні ітерації агента — не виміряно | 2 прогони. run-…806406 — 0/3: зупинився до будування. run-…a92daa — 2/3: спроба 1 — maintainability FAIL, спроба 2 — усі ворота PASS. CI на PR #4 — 3 прогони, 0 червоних | звичайно: Actions гілок [#42](https://github.com/maryan-qc/therapy-scheduling/actions?query=branch%3Async%2F2026-11-06), [#43](https://github.com/maryan-qc/therapy-scheduling/actions?query=branch%3Aspec%2Fadd-insurance-consent), [#44](https://github.com/maryan-qc/therapy-scheduling/actions?query=branch%3Aspec%2Fimpl-insurance-consent), [#45](https://github.com/maryan-qc/therapy-scheduling/actions?query=branch%3Atask%2Finsurance-status), [#47](https://github.com/maryan-qc/therapy-scheduling/actions?query=branch%3Async%2F2026-11-08), [#48](https://github.com/maryan-qc/therapy-scheduling/actions?query=branch%3Atask%2Fuat-slice-3); фабрика: [L8](../factory/run-20261118101125-a92daa.events.jsonl#L8), [L11](../factory/run-20261118101125-a92daa.events.jsonl#L11), [перевірки #4](https://github.com/maryan-qc/therapy-scheduling-factory/pull/4/checks) |
| Що зловили ворота | CodeRabbit — 9 знахідок. #43 — 3, виправлено за текстом PM. #45 — 4: 3 виправлено (тести дії, тест без ролі, тест без залежності від дати сиду), на 1 відповіли аргументом у треді. #48 — 2, виправлено в `fb9b7e2`. CI — 0 червоних. fallow на #45 попередив, але не заблокував (див. «Якість коду») | maintainability FAIL у спробі 1: `database.types.ts:108-116` дублює рядки `121-129` (9 рядків при порозі 8). Хук політики відхилив 4 виклики виконавця: у спробі 1 — 3 з 39, у спробі 2 — 1 з 8. Це були ланцюжки з `;` і `\|`, `ls`, `sed -i` і `python3` з heredoc. Відмов допуску й NOT-EARNED — 0. Рецензент залишив 2 low-нотатки, вони не блокують | звичайно: [#43](https://github.com/maryan-qc/therapy-scheduling/pull/43), [#45](https://github.com/maryan-qc/therapy-scheduling/pull/45), [#48](https://github.com/maryan-qc/therapy-scheduling/pull/48), [пакет, розділ B](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/proof-pack.md); фабрика: [L8](../factory/run-20261118101125-a92daa.events.jsonl#L8), відмови хука — [L6](../factory/run-20261118101125-a92daa.events.jsonl#L6), [L10](../factory/run-20261118101125-a92daa.events.jsonl#L10), [пакет, «Gates»](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L16-L27); тексти команд — `agent-builder-<спроба>-summary.json` (локально) |
| Втручання людини | — | 11. Схвалень 4: `approve config` ×2, `approve intent` ×1, `approve plan` ×1; `approve release` — 0, бо рівень auto. `answer` / `resume` — 0. «Так» перед `factory deliver` — 1. Ручних комітів у двійнику 6. За часом: 7 до прогону, 1 під час, 3 після випуску | розділ «Втручання людини у фабриці» нижче |
| Вади від UAT | 0: з 6 AC FAIL 0, NEEDS-HUMAN 0 | 0: з 6 AC FAIL 0, NEEDS-HUMAN 0. Перший прогін специфікацій дав 4/6 через помилку локатора в тесті, не в застосунку. Окремо є спостереження UX, яке не порушує AC: «Not set» → список одразу на «Verified» | [звіт 2026-11-09](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/uat/2026-11-09/report.md); [звіт 2026-11-18](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/report.md), [журнал](factory-journal.md), рядок 26 |
| Вади від PM | Issues «Відхилення від вимог» — 0. PM прийняв AC-INS-01…06 ✅ і залишив одне зауваження поза «Тоді»: після UAT не прибрали синтетичні картки `uat-*` | Issues «Відхилення від вимог» у двійнику — 0. Приймання PM на проді двійника — не виміряно: PM прод двійника не оцінював | [пошук issues](https://github.com/maryan-qc/therapy-scheduling/issues?q=is:issue%20%22%D0%92%D1%96%D0%B4%D1%85%D0%B8%D0%BB%D0%B5%D0%BD%D0%BD%D1%8F%20%D0%B2%D1%96%D0%B4%20%D0%B2%D0%B8%D0%BC%D0%BE%D0%B3%22), [приймання PM у #48](https://github.com/maryan-qc/therapy-scheduling/pull/48#issuecomment-6746383385); [пошук issues двійника](https://github.com/maryan-qc/therapy-scheduling-factory/issues?q=is:issue%20%22%D0%92%D1%96%D0%B4%D1%85%D0%B8%D0%BB%D0%B5%D0%BD%D0%BD%D1%8F%20%D0%B2%D1%96%D0%B4%20%D0%B2%D0%B8%D0%BC%D0%BE%D0%B3%22) |
| Мутації | SQL-мутанти C10–C13 на `20261106170000_insurance_status.sql` — 4/4 KILLED (`npm run mutation:sql` запускали вручну). Негативний контроль UAT NC-3 → FAIL (R1), як і має бути. Stryker на коді зрізу 3 — не виміряно. Тестів AC: 15 (база 8, дія 3, unit 4) + 6 UAT | Ворота `mutation`: 4/4 мутантів убито, score 1.00 при мінімумі 0.6; які саме мутанти, пакет не каже. SQL-мутантів для insurance у двійнику немає ([`scripts/mutants.mjs`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/scripts/mutants.mjs) має лише C1–C9), тож тут — не виміряно. Тестів AC: 12 видимих у 6 файлах + 27 прихованих сценаріїв + 6 UAT | [пакет, розділ B](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/proof-pack.md), [`mutants.mjs#L90`](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/scripts/mutants.mjs#L90); [пакет фабрики, рядок 25](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L25) |
| Розмір diff | `git diff --shortstat d4dc4e7 79b490b` (`d4dc4e7` = `ws9-base`): 47 файлів, +2488 −230. Це враховує й специфікацію AC-DOC у #43 і переписаний пакет доказів. Лише `src/` і `supabase/`: 7 файлів, +181 −2. PR #45: 12 файлів, +430 −11 | Рядок `diff` воріт: 7 файлів, 156 рядків. `git diff --shortstat ws9-base db7c95d`: 28 файлів, +1527 −40, разом із PR #1–#3 і червоними тестами. Лише `src/` і `supabase/`: 6 файлів, +117 −27. PR #4: 17 файлів, +988 −34 — разом із комітом tests-first і копією пакета | [compare звичайно](https://github.com/maryan-qc/therapy-scheduling/compare/d4dc4e7...79b490b), [#45](https://github.com/maryan-qc/therapy-scheduling/pull/45/files); [compare фабрика](https://github.com/maryan-qc/therapy-scheduling-factory/compare/ws9-base...db7c95d), [пакет, рядок 21](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L21), [#4](https://github.com/maryan-qc/therapy-scheduling-factory/pull/4/files) |
| Якість коду | fallow на #45 — «passed with warnings». Нової складності 0. Нове дублювання 1: 13 рядків × 3 у `database.types.ts:92`. Стиль: 1 `css-token-drift`. Покриття `insurance.ts`: рядки 100 %, гілки 85.7 %. CodeRabbit — див. «Що зловили ворота» | Ворота maintainability (max-file-lines, dependency, duplication): спроба 1 FAIL, спроба 2 PASS. fallow на PR #4 — «passed with warnings». Нова складність: `ClientCardPage` (цикломатична 10, когнітивна 15) і `mark` у `scripts/factory-tap.mjs` (з коміту tests-first). Нове дублювання 1: 11 рядків × 2 у `database.types.ts:15` — fallow бачить його й після виправлення в спробі 2. Стиль: 1 `css-token-drift`. Покриття `insurance.ts` — 100 % за всіма показниками. Рецензент залишив 2 low-нотатки. Рев'ю CodeRabbit на PR #4 немає | звичайно: [fallow #45](https://github.com/maryan-qc/therapy-scheduling/actions/runs/42519789914/job/128850547296), [пакет, розділ B](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/proof-pack.md); фабрика: [fallow #4](https://github.com/maryan-qc/therapy-scheduling-factory/actions/runs/44339659288/job/134925818374), [покриття #4](https://github.com/maryan-qc/therapy-scheduling-factory/actions/runs/44339659288/job/134925819199), [пакет, «Review notes»](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L41-L43) |

Примітки до метрик:

- **Календарний час не порівнюється напряму.** Звичайний зріз 3 ще містив документи згоди (AC-DOC, PR
  [#46](https://github.com/maryan-qc/therapy-scheduling/pull/46) закрито без злиття) і чекав у черзі CodeRabbit
  ([пакет, ретро](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/proof-pack.md)).
  Фабрика отримала готові вимоги й специфікацію: twin PR #2 і #3 повторюють основне репо. В обох вимірах є ночі.
- **Часи PR звичайного зрізу 3.** #42: 2026-11-06T15:13:21Z → 15:25:52Z. #43: 2026-11-06T15:26:11Z → 2026-11-08T11:42:33Z.
  #44: 2026-11-06T15:42:13Z → 2026-11-08T20:21:34Z. #45: 2026-11-06T15:42:40Z → 2026-11-08T21:56:29Z
  (`db-deploy` — [run 42527688004](https://github.com/maryan-qc/therapy-scheduling/actions/runs/42527688004)). #47:
  2026-11-08T11:45:07Z → 20:21:22Z. #48: 2026-11-09T09:04:26Z → 09:19:59Z.
- **Часи PR двійника.** #1: 2026-11-17T08:50:35Z → 08:52:35Z. #2: 15:05:05Z → 16:28:32Z. #3: 16:29:28Z → 16:46:54Z.
  `b61f3d2`: 17:08:52Z. #4: 2026-11-18T15:47:02Z → 15:49:27Z. #5: 16:03:42Z → 16:06:40Z. #6: 16:04:02Z → 16:07:26Z.

## Втручання людини у фабриці

Лічильник за F15: `answer` / `resume`, схвалення й ручні коміти. Схвалення записано в журналі схвалень складу
`store/approvals.jsonl`; він локальний і не лежить у git, тому нижче поруч із кожним стоїть доказ у git.

До прогону:

- Ручний коміт: twin PR [#1](https://github.com/maryan-qc/therapy-scheduling-factory/pull/1) (`96dc9c5`). README
  двійника більше не веде на основний прод, щоденний smoke вимкнено до власного проду.
- Ручний коміт: twin PR [#2](https://github.com/maryan-qc/therapy-scheduling-factory/pull/2) (`9baceb7`) —
  `/requirements-sync`, знімок вимог.
- Ручний коміт: twin PR [#3](https://github.com/maryan-qc/therapy-scheduling-factory/pull/3) (`e70414f`) —
  специфікація `insurance-status`, така сама, як в основному репо.
- Ручний коміт:
  [`b61f3d2`](https://github.com/maryan-qc/therapy-scheduling-factory/commit/b61f3d295dc0d05dd813b4e31d48dbede3f91181)
  (тег `ws9-red`). Окрема сесія агента (F18) написала червоні тести з тексту AC і контракту людини, не читаючи
  основне репо: 12 тестів у 6 файлах і `scripts/factory-tap.mjs`. У `main` коміт потрапив разом із PR #4 (squash).
- `approve config`, 1-й раз: `appr-20261118095435-353c93`, 2026-11-18T09:54:35Z, дайджест `bfbd023f…`
  ([журнал](factory-journal.md), рядок 19).
- `approve intent ins`: `appr-20261118095435-b5aa41`, 09:54:35Z, дайджест `43014ccd…`. Це той самий дайджест задачі,
  що стоїть у пакеті: «task `ins` (digest 43014ccdc97f)»
  ([рядок 3](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L3);
  [журнал](factory-journal.md), рядок 19).
- `approve config`, 2-й раз, з обгорткою macOS для `USER`: `appr-20261118101121-49ab78`, 10:11:21Z, дайджест
  `f780a4a5…`. Він збігається з «factory config f780a4a53376» у пакеті
  ([рядок 47](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L47)).
  Схвалення знадобилось після needs-human першого прогону
  ([L4](../factory/run-20261118095441-806406.events.jsonl#L4); [журнал](factory-journal.md), рядки 20–21).

Під час прогону:

- `approve plan run-20261118101125-a92daa`: `appr-20261118114730-ec2d19`, 11:47:30Z, дайджест `fd3a2529…` = `planDigest`
  ([L4](../factory/run-20261118101125-a92daa.events.jsonl#L4) →
  [L5 `planApprovedBy: maryan-qc`](../factory/run-20261118101125-a92daa.events.jsonl#L5);
  [журнал](factory-journal.md), рядок 22).

Після випуску:

- «Так» перед `factory deliver` ([журнал](factory-journal.md), рядок 25). Далі push і PR з автозлиттям
  ([L16](../factory/run-20261118101125-a92daa.events.jsonl#L16), [L17](../factory/run-20261118101125-a92daa.events.jsonl#L17)).
- Ручний коміт: twin PR [#5](https://github.com/maryan-qc/therapy-scheduling-factory/pull/5) (`ca6cbb3`) — специфікації
  UAT і звіт `factory uat`. Специфікації писала окрема сесія агента з тексту AC вже після деплою. Перший прогін дав
  4/6 через помилку локатора в тесті; після виправлення було 6/6 без рецензента, потім `F uat` 6/6 з рецензентом
  Haiku ([журнал](factory-journal.md), рядки 26–27).
- Ручний коміт: twin PR [#6](https://github.com/maryan-qc/therapy-scheduling-factory/pull/6) (`28dcbbb`) — щоденний
  smoke повернуто, README веде на прод двійника.

Не було:

- `answer` і `resume` — 0: таких подій немає ні в [першому](../factory/run-20261118095441-806406.events.jsonl), ні в
  [другому](../factory/run-20261118101125-a92daa.events.jsonl) прогоні.
- `approve release` — 0: рівень `auto` ([L14](../factory/run-20261118101125-a92daa.events.jsonl#L14)).

Інша ручна робота, яку лічильник F15 не рахує, але без якої прогону не було б:

- контракт людини й `nonFunctionals` задачі (тека контролю, не в git; дайджест задачі `43014ccd…`);
- 27 прихованих сценаріїв окремою сесією і печатка ключем людини ([журнал](factory-journal.md), рядок 18);
- два запуски `factory run`, `factory deliver` і `factory uat`.

## Що не перевірено

- **Ізоляція у фабриці лише на рівні політики, в одному обліковому записі ОС** (пакет фабрики, [«Not verified»](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L29-L30)).
  Код, який агент написав і запустив (тести, оцінювач прихованих сценаріїв), технічно міг читати й писати інші файли.
  Ворота integrity (297 захищених файлів не змінено) і boundary це обмежують, але не доводять ізоляцію.
- **Звичайно: тести писала та сама сесія, що й код** (пакет звичайної реалізації,
  [«Не перевірено»](https://github.com/maryan-qc/therapy-scheduling/blob/79b490bbcfbb7bb6a91c6444046627277be464af/docs/qa/proof-pack.md)).
  Тести бази й unit з'явились у тій самій сесії агента, що й код, уже після міграції. Силу тестів відмов підтверджують
  SQL-мутанти C10–C13 і NC-3, а основних сценаріїв — лише UAT.
- **AC-INS-06, частина «лише сторінка входу», у фабриці.** Ворота її не перевіряли: видимі тести й приховані
  сценарії стосуються бази. Доказ — UAT і незмінений `src/proxy.ts`. Ризик з'явиться, якщо хтось змінить `proxy.ts`
  без UAT.
- **Приховані сценарії і дата сиду.** Сид двійника генерує слоти лише до 2026-12-31
  ([`slot_holds.sql#L200`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/supabase/migrations/20261021150100_slot_holds.sql#L200),
  [`pm_therapist_seed.sql#L14`](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/supabase/migrations/20261023105252_pm_therapist_seed.sql#L14)).
  Те, що набір `ins` залежить від цих слотів, з файлів не перевірено: набір запечатано. Після цієї дати повторний
  прогін може впасти не через код.
- **Нотатки рецензента фабрики (2 × low)** ([пакет, рядки 42–43](https://github.com/maryan-qc/therapy-scheduling-factory/blob/db7c95d98ecb29517fc6806bb7b3f3ec8bf5aa51/docs/factory/run-20261118101125-a92daa.md?plain=1#L42-L43)):
  - на `?error=<код>` картка не показує жодного тексту;
  - типи `Insert` і `Update` дозволяють писати `insurance_status`, хоча прав на такий запис у базі немає.

  Обидві нотатки не змінено.
- **UX форми у фабриці** (див. AC-INS-01 і AC-INS-03): список одразу стоїть на «Verified», не показує поточного
  статусу й не має підпису. Можна випадково позначити клієнта. AC це не порушує, PM не оцінював.
- **Приймання PM у двійнику — не було.** Галочки «Рішення PM» у
  [звіті UAT двійника](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/report.md)
  порожні.
- **Вартість фабрики неповна.** Сесії агента поза фабрикою (червоні тести F18, приховані сценарії F10, перевірка задачі
  F11, специфікації UAT) не записали вартості. Тому $0.65 — це лише прогони фабрики, а не весь зріз.
- **Власний набір тестів фабрики на macOS падає в одному тесті.**
  [`[P5.2] the workspace sees the target's installed dependencies…`](https://github.com/koldovsky/2026-quitcode-09-factory/blob/1280bc62cb001ded1fa31f15f45057d8b51f45f3/tests/ws9.test.mjs#L31)
  очікує порожній `git status`, а бачить `?? node_modules` (посилання на `node_modules` у робочій копії). Тест прийшов
  з курс-редакції (коміт `27df4c4`), адаптер `74b0864` його не чіпає. Падіння відтворено запуском
  `node --test tests/ws9.test.mjs` на `74b0864` під час складання звіту; файла з результатом у git немає. На наш прогін
  це не вплинуло: diff і integrity бачили 7 змінених файлів.
- **У звичайній реалізації після UAT не прибрали синтетичні дані.** Це зауваження PM поза «Тоді». У двійнику
  прибирання видалило 0 і лишило 0
  ([звіт, рядок «Прибирання»](https://github.com/maryan-qc/therapy-scheduling-factory/blob/ca6cbb3f8e7f1ca520840b29ad432636f200ddc4/docs/qa/uat/2026-11-18/report.md?plain=1#L6)).

## Частковий прогін

—

## Висновок

1. Де фабрика краща: «пише один — перевіряє інший» тримає сама лінія: червоні тести й 27 прихованих сценаріїв з'явились в окремих сесіях до коду, а дублювання вона зловила й виправила сама (спроба 2); машинний цикл — 315 с і $0.65 з дайджестом пакета, поставку й UAT зробили команди фабрики.
2. Де фабрика гірша: до прогону треба багато ручної роботи (контракт, тести, сценарії, ключ, 4 схвалення, обгортка для macOS); UI вона робить лише в межах контракту (список одразу на «Verified», без поточного значення, підпису й тексту відмови); «лише сторінка входу» з AC-INS-06 лишилась поза воротами; статус показує застарілий FAIL; приймання PM і CodeRabbit у двійнику не було.
3. Що візьмемо у звичайний процес: червоні тести AC окремою сесією й окремим комітом до реалізації, ворота дублювання на diff і облік вартості й токенів кожного прогону агента в proof pack; у контракті UI явно писатимемо порожній варіант, поточне значення й тексти відмов.
