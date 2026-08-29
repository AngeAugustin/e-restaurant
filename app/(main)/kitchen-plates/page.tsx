"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { PremiumTableShell } from "@/components/shared/PremiumTableShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { IKitchenPlate } from "@/types";

export default function KitchenPlatesPage() {
  const { data: session, status } = useSession();
  const qc = useQueryClient();
  const canManage = ["directeur", "directrice"].includes(session?.user?.role ?? "");
  const isDirector = session?.user?.role === "directeur";
  const { data: plates, isLoading } = useQuery({
    queryKey: ["kitchen-plates"],
    queryFn: async () => (await fetch("/api/kitchen-plates")).json() as Promise<IKitchenPlate[]>,
    enabled: canManage,
  });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<IKitchenPlate | undefined>();
  const [number, setNumber] = useState("");
  const [pending, setPending] = useState<IKitchenPlate | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!open) return;
    setNumber(edit?.number ?? "");
  }, [open, edit]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(edit ? `/api/kitchen-plates/${edit._id}` : "/api/kitchen-plates", {
      method: edit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number }),
    });
    if (!res.ok) {
      toast({ variant: "destructive", title: "Erreur", description: (await res.json()).error });
      return;
    }
    toast({ variant: "success", title: edit ? "Plaquette modifiée" : "Plaquette ajoutée" });
    qc.invalidateQueries({ queryKey: ["kitchen-plates"] });
    setOpen(false);
  };

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/kitchen-plates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => { toast({ variant: "success", title: "Supprimée" }); qc.invalidateQueries({ queryKey: ["kitchen-plates"] }); setPending(null); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Erreur", description: e.message }),
  });

  if (status === "loading") return <Skeleton className="h-96" />;
  if (!canManage) return <p className="py-20 text-center text-[#9CA3AF]">Accès réservé à la direction.</p>;
  const rows = (plates ?? []).slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <PageHeader title="Plaquettes" subtitle="Supports de commande cuisine" action={<Button onClick={() => { setEdit(undefined); setOpen(true); }}><Plus className="h-4 w-4" />Ajouter</Button>} />
      <div className="mb-8 max-w-xs">{isLoading ? <Skeleton className="h-28" /> : <StatsCard title="Plaquettes" value={plates?.length ?? 0} icon={CreditCard} index={0} />}</div>
      <PremiumTableShell title="Liste" isLoading={isLoading} empty={!isLoading && !plates?.length} emptyMessage="Aucune plaquette" skeletonRows={5} tableMinWidthClass="min-w-[640px]" skeletonColSpan={4}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-[11px] uppercase text-slate-500">
              <th className="px-6 py-3 text-left">Numéro</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Créée</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p._id} className="border-b">
                <td className="px-6 py-3 font-semibold">{p.number}</td>
                <td className="px-4 py-3">{p.occupiedByPendingOrderId ? "Occupée" : "Libre"}</td>
                <td className="px-4 py-3 text-xs">{formatDate(p.createdAt)}</td>
                <td className="px-6 py-3 text-right space-x-1">
                  <Button size="icon" variant="outline" onClick={() => { setEdit(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  {isDirector && <Button size="icon" variant="outline" className="text-rose-600" onClick={() => setPending(p)}><Trash2 className="h-4 w-4" /></Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PremiumTableShell>
      <PaginationControls className="mt-6" currentPage={page} pageSize={pageSize} totalItems={plates?.length ?? 0} onPageChange={setPage} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Modifier" : "Nouvelle plaquette"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5"><Label>Numéro</Label><Input value={number} onChange={(e) => setNumber(e.target.value)} required /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!pending} onOpenChange={(v) => !v && setPending(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer ?</DialogTitle><DialogDescription>Impossible si des commandes y sont liées.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => pending && del.mutate(pending._id)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
