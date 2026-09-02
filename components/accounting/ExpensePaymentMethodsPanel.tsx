"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { isDirectionRole } from "@/lib/roles";
import type { IExpensePaymentMethod } from "@/types";

export function ExpensePaymentMethodsPanel() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const isDirector = session?.user?.role === "directeur";
  const canManage = isDirectionRole(session?.user?.role);
  const [name, setName] = useState("");
  const [edit, setEdit] = useState<IExpensePaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: methods } = useQuery({
    queryKey: ["expense-payment-methods"],
    queryFn: async () => (await fetch("/api/expense-payment-methods")).json() as Promise<IExpensePaymentMethod[]>,
  });

  const resetForm = () => {
    setName("");
    setEdit(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(edit ? `/api/expense-payment-methods/${edit._id}` : "/api/expense-payment-methods", {
      method: edit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Erreur", description: (await res.json()).error });
      return;
    }
    toast({ variant: "success", title: edit ? "Mode modifié" : "Mode ajouté" });
    qc.invalidateQueries({ queryKey: ["expense-payment-methods"] });
    resetForm();
  };

  const startEdit = (method: IExpensePaymentMethod) => {
    setEdit(method);
    setName(method.name);
  };

  return (
    <div className="max-w-lg space-y-3">
      {canManage && (
        <form className="flex gap-2" onSubmit={save}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={edit ? "Nom du mode de paiement" : "Nouveau mode"}
            required
          />
          <Button type="submit" disabled={saving}>{edit ? "Mettre à jour" : "Ajouter"}</Button>
          {edit ? (
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Annuler</Button>
          ) : null}
        </form>
      )}
      <ul className="divide-y rounded-xl border">
        {(methods ?? []).map((m) => (
          <li key={m._id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
            <span className="min-w-0 truncate">{m.name}</span>
            {canManage && (
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="outline" onClick={() => startEdit(m)}>Modifier</Button>
                {isDirector && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-600"
                    onClick={async () => {
                      const res = await fetch(`/api/expense-payment-methods/${m._id}`, { method: "DELETE" });
                      if (!res.ok) toast({ variant: "destructive", title: "Erreur", description: (await res.json()).error });
                      else {
                        if (edit?._id === m._id) resetForm();
                        qc.invalidateQueries({ queryKey: ["expense-payment-methods"] });
                      }
                    }}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
