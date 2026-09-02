"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { PAYROLL_TYPE_LABEL } from "@/lib/payroll";
import type { IJobTitle, PayrollBeneficiaryType } from "@/types";

export function AccountingJobTitlesPanel() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const isDirector = session?.user?.role === "directeur";
  const [jobType, setJobType] = useState<PayrollBeneficiaryType>("WAITRESS");
  const [jobSalary, setJobSalary] = useState("");
  const [editJob, setEditJob] = useState<IJobTitle | undefined>();
  const [pendingDeleteJob, setPendingDeleteJob] = useState<IJobTitle | null>(null);
  const [pendingJobSave, setPendingJobSave] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: titles } = useQuery({
    queryKey: ["job-titles"],
    queryFn: async () => (await fetch("/api/job-titles")).json() as Promise<IJobTitle[]>,
  });

  const commitJob = async () => {
    setSaving(true);
    const res = await fetch(editJob ? `/api/job-titles/${editJob._id}` : "/api/job-titles", {
      method: editJob ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryType: jobType, salary: Number(jobSalary) }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Erreur", description: (await res.json()).error });
      return;
    }
    toast({ variant: "success", title: editJob ? "Fonction mise à jour" : "Fonction ajoutée" });
    qc.invalidateQueries({ queryKey: ["job-titles"] });
    setPendingJobSave(false);
    setJobSalary("");
    setEditJob(undefined);
    setJobType("WAITRESS");
  };

  const saveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editJob) {
      setPendingJobSave(true);
      return;
    }
    await commitJob();
  };

  const deleteJob = async (id: string) => {
    setSaving(true);
    const res = await fetch(`/api/job-titles/${id}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Erreur", description: (await res.json()).error });
      return;
    }
    toast({ variant: "success", title: "Fonction supprimée" });
    qc.invalidateQueries({ queryKey: ["job-titles"] });
    setPendingDeleteJob(null);
    if (editJob?._id === id) {
      setEditJob(undefined);
      setJobSalary("");
      setJobType("WAITRESS");
    }
  };

  return (
    <>
      <div className="max-w-xl space-y-4">
        <form onSubmit={saveJob} className="flex flex-wrap items-end gap-2">
          <div className="min-w-[160px] flex-1 space-y-1.5">
            <Label>Fonction</Label>
            <select
              className="flex h-10 w-full rounded-md border px-3 text-sm"
              value={jobType}
              onChange={(e) => setJobType(e.target.value as PayrollBeneficiaryType)}
              required
            >
              {Object.entries(PAYROLL_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px] flex-1 space-y-1.5">
            <Label>Salaire</Label>
            <Input type="number" min={0} placeholder="Salaire" value={jobSalary} onChange={(e) => setJobSalary(e.target.value)} required />
          </div>
          <Button type="submit" disabled={saving}>{editJob ? "Mettre à jour" : "Ajouter"}</Button>
          {editJob ? (
            <Button type="button" variant="outline" onClick={() => { setEditJob(undefined); setJobSalary(""); setJobType("WAITRESS"); }}>
              Annuler
            </Button>
          ) : null}
        </form>
        <ul className="divide-y rounded-xl border">
          {(titles ?? []).map((t) => (
            <li key={t._id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{PAYROLL_TYPE_LABEL[t.beneficiaryType] ?? t.name} — {formatCurrency(t.salary)}</span>
              <div className="space-x-1">
                <Button size="sm" variant="outline" onClick={() => { setEditJob(t); setJobType(t.beneficiaryType); setJobSalary(String(t.salary)); }}>Modifier</Button>
                {isDirector && <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setPendingDeleteJob(t)}>Supprimer</Button>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={pendingJobSave} onOpenChange={(v) => !v && !saving && setPendingJobSave(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la modification</DialogTitle>
            <DialogDescription>
              Enregistrer le salaire de {PAYROLL_TYPE_LABEL[jobType]} à {jobSalary ? formatCurrency(Number(jobSalary)) : "—"} ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingJobSave(false)} disabled={saving}>Annuler</Button>
            <Button type="button" onClick={() => commitJob()} disabled={saving}>{saving ? "Enregistrement…" : "Confirmer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDeleteJob} onOpenChange={(v) => !v && !saving && setPendingDeleteJob(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer cette fonction ?</DialogTitle>
            <DialogDescription>
              Cette action est définitive. Le salaire défini pour « {pendingDeleteJob ? PAYROLL_TYPE_LABEL[pendingDeleteJob.beneficiaryType] : "cette fonction"} » sera retiré.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingDeleteJob(null)} disabled={saving}>Annuler</Button>
            <Button type="button" variant="destructive" onClick={() => pendingDeleteJob && deleteJob(pendingDeleteJob._id)} disabled={saving || !pendingDeleteJob}>
              {saving ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
