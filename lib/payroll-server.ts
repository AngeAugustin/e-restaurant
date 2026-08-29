import JobTitle from "@/models/JobTitle";
import type { PayrollBeneficiaryType } from "@/types";

export async function resolvePayrollBaseSalary(
  beneficiaryType: PayrollBeneficiaryType,
  jobTitleId?: string
): Promise<number> {
  if (jobTitleId) {
    const byId = await JobTitle.findById(jobTitleId).lean();
    if (byId && Number.isFinite(byId.salary)) return byId.salary;
  }
  const byType = await JobTitle.findOne({ beneficiaryType }).lean();
  if (!byType || !Number.isFinite(byType.salary)) {
    throw new Error("Salaire introuvable pour cette fonction");
  }
  return byType.salary;
}
