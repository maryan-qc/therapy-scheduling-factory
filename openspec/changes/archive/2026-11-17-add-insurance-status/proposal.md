# Пропозиція: зріз 3 — статус перевірки страхування в картці клієнта (AC-INS-01…06)

## Why

Зараз планувальник перевіряє страхування клієнта поза застосунком, і в картці клієнта не видно, чи прийнято
страхування, чи клієнт платить сам. Після цього зрізу планувальник або адміністратор позначає в картці статус перевірки
страхування, а кожен, хто бачить картку, бачить цей статус.

Джерело — вимога PM HryhoriiHaponiukQuitCode/therapy-scheduling-spec#33, знімок 2026-11-17
(`requirements/33-planuvalnyk-poznachaie-status-strakhuvannia.md`), і матриця прав `requirements/product.md`
(HryhoriiHaponiukQuitCode/therapy-scheduling-spec#1).

Двійник для фабрики (бонус WS9): ця специфікація — той самий переклад AC PM, що в основному репо
`maryan-qc/therapy-scheduling` (`openspec/specs/insurance-status/spec.md`), дослівно. Код, тести й дизайн основної
реалізації сюди не переносимо — зріз реалізує фабрика з тексту AC.

Вимогу HryhoriiHaponiukQuitCode/therapy-scheduling-spec#34 (документи згоди) PM відклав 2026-11-06 — у двійнику не
специфікуємо, як і в основному репо. Вимога HryhoriiHaponiukQuitCode/therapy-scheduling-spec#36 — зріз 4 (WS10),
у двійнику не реалізуємо.

## What Changes

Нова можливість `insurance-status`:

- ADDED «Початковий статус страхування» — картка без позначки показує «Insurance: Not set» (AC-INS-01).
- ADDED «Позначення статусу страхування» — планувальник або адміністратор позначає «Verified», «Not accepted» чи
  «Private pay»: «Insurance status saved.», статус бачать усі, хто бачить картку; повернути «Not set» не можна
  (AC-INS-02, AC-INS-03).
- ADDED «Терапевт лише бачить статус страхування» — у картці свого клієнта без зміни, і напряму теж не змінює
  (AC-INS-04, AC-INS-05).
- ADDED «Статус страхування без входу» — лише сторінка входу, статус не змінено (AC-INS-06).

## Capabilities

### New Capabilities

- `insurance-status`: статус перевірки страхування в картці клієнта і хто може його змінювати.

### Modified Capabilities

— немає.

## Users & roles

- Планувальник (`scheduler`) — позначає й змінює статус перевірки страхування в картці будь-якого клієнта.
- Адміністратор (`admin`) — може все, що й планувальник у цій вимозі.
- Терапевт (`therapist`) — бачить статус у картках лише своїх клієнтів; змінити не може, зокрема напряму.
- Користувач без входу — бачить лише сторінку входу.

## Non-goals

- Перевірка страхування в застосунку (планувальник перевіряє поза застосунком), історія змін статусу.
- Документи згоди (HryhoriiHaponiukQuitCode/therapy-scheduling-spec#34 — PM відклав) і чернетка картки з тексту
  звернення (HryhoriiHaponiukQuitCode/therapy-scheduling-spec#36 — зріз 4).

## Assumptions

- Значення статусу й тексти — дослівно з AC PM: «Not set», «Verified», «Not accepted», «Private pay»,
  «Insurance: <статус>», «Insurance status saved.».
- «Свій клієнт» терапевта — як у `client-cards` (зріз 2).

## Open questions

— немає: усі тексти й ролі дано у вимозі PM.

## Impact

- Матриця `docs/conformance.md`: рядки AC-INS-01…06 зі статусом «відкладено (чекає реалізації: фабрика у двійнику)».
- Код, база й тести — не в цьому PR: червоні тести (гілка `tests-first`, тег `ws9-red`) і реалізація фабрики — окремо.
