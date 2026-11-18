// Статус перевірки страхування в картці клієнта (openspec/specs/insurance-status). Змінює його лише функція бази
// public.set_insurance_status (supabase/migrations/20261118100000_insurance_status.sql); «Not set» — початкове значення.
export const INSURANCE_STATUSES = ["verified", "not_accepted", "private_pay"] as const;

const INSURANCE_LABELS = new Map<string, string>([
  ["verified", "Insurance: Verified"],
  ["not_accepted", "Insurance: Not accepted"],
  ["private_pay", "Insurance: Private pay"],
]);

export const INSURANCE_OPTION_LABEL: Record<(typeof INSURANCE_STATUSES)[number], string> = {
  verified: "Verified",
  not_accepted: "Not accepted",
  private_pay: "Private pay",
};

export const INSURANCE_NOT_SET = "Insurance: Not set";
export const INSURANCE_SAVED = "Insurance status saved.";

export function insuranceLabel(status: string | null | undefined): string {
  return (status != null && INSURANCE_LABELS.get(status)) || INSURANCE_NOT_SET;
}
