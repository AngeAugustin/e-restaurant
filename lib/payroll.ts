import type { PayrollBeneficiaryType } from "@/types";

export const PAYROLL_TYPES: PayrollBeneficiaryType[] = ["WAITRESS", "KITCHEN_WAITRESS", "COOK", "MANAGER"];

export const PAYROLL_TYPE_LABEL: Record<PayrollBeneficiaryType, string> = {
  WAITRESS: "Serveuse",
  KITCHEN_WAITRESS: "Serveuse-cuisinière",
  COOK: "Cuisinière",
  MANAGER: "Gérant(e)",
};

export function isPayrollType(value: unknown): value is PayrollBeneficiaryType {
  return PAYROLL_TYPES.includes(value as PayrollBeneficiaryType);
}

export function payrollBaseSalary(payroll: {
  baseSalary?: number;
  amount: number;
  bonusAmount?: number;
  bonuses?: PayrollBonus[];
  jobTitle?: { salary?: number } | string;
}): number {
  if (typeof payroll.baseSalary === "number") return payroll.baseSalary;
  if (typeof payroll.jobTitle === "object" && payroll.jobTitle?.salary != null) {
    return payroll.jobTitle.salary;
  }
  return payroll.amount - payrollBonusTotal(payrollBonuses(payroll));
}

export type PayrollBonus = { name: string; amount: number };

export function payrollBonuses(payroll: {
  bonuses?: PayrollBonus[];
  bonusName?: string;
  bonusAmount?: number;
  amount?: number;
  baseSalary?: number;
  jobTitle?: { salary?: number } | string;
}): PayrollBonus[] {
  if (Array.isArray(payroll.bonuses) && payroll.bonuses.length > 0) {
    return payroll.bonuses
      .filter((b) => b && typeof b.name === "string" && Number(b.amount) > 0)
      .map((b) => ({ name: b.name.trim(), amount: Number(b.amount) }));
  }
  const legacyAmount = Number(payroll.bonusAmount ?? 0);
  if (payroll.bonusName?.trim() || legacyAmount > 0) {
    return [{ name: payroll.bonusName?.trim() || "Bonus", amount: legacyAmount }];
  }
  if (typeof payroll.amount === "number") {
    let base = 0;
    if (typeof payroll.baseSalary === "number") base = payroll.baseSalary;
    else if (typeof payroll.jobTitle === "object" && payroll.jobTitle?.salary != null) base = payroll.jobTitle.salary;
    else base = payroll.amount;
    const diff = payroll.amount - base;
    if (diff > 0) return [{ name: "Bonus", amount: diff }];
  }
  return [];
}

export function payrollBonusTotal(bonuses: PayrollBonus[]): number {
  return bonuses.reduce((sum, b) => sum + b.amount, 0);
}

export function parsePayrollBonuses(body: {
  hasBonus?: boolean;
  bonuses?: unknown;
  bonusName?: string;
  bonusAmount?: unknown;
}): { bonuses: PayrollBonus[] } {
  if (!body?.hasBonus) return { bonuses: [] };

  if (Array.isArray(body.bonuses) && body.bonuses.length > 0) {
    const bonuses: PayrollBonus[] = [];
    for (const raw of body.bonuses) {
      if (!raw || typeof raw !== "object") continue;
      const name = "name" in raw && typeof raw.name === "string" ? raw.name.trim() : "";
      const amount = Number("amount" in raw ? raw.amount : NaN);
      if (!name && amount <= 0) continue;
      if (!name) throw new Error("Le nom du bonus est requis");
      if (!Number.isFinite(amount) || amount < 0) throw new Error("Montant du bonus invalide");
      bonuses.push({ name, amount });
    }
    if (bonuses.length === 0) throw new Error("Ajoutez au moins un bonus");
    return { bonuses };
  }

  const bonusName = typeof body.bonusName === "string" ? body.bonusName.trim() : "";
  const bonusAmount = Number(body.bonusAmount);
  if (!bonusName) throw new Error("Le nom du bonus est requis");
  if (!Number.isFinite(bonusAmount) || bonusAmount < 0) throw new Error("Montant du bonus invalide");
  return { bonuses: [{ name: bonusName, amount: bonusAmount }] };
}

/** @deprecated Utiliser parsePayrollBonuses */
export function parsePayrollBonus(body: {
  hasBonus?: boolean;
  bonusName?: string;
  bonusAmount?: unknown;
}): { bonusName?: string; bonusAmount: number } {
  const { bonuses } = parsePayrollBonuses(body);
  if (bonuses.length === 0) return { bonusAmount: 0 };
  return { bonusName: bonuses[0].name, bonusAmount: bonuses[0].amount };
}
