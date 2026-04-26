"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, UserRound, Eye, Phone, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { PremiumTableShell, premiumTableSelectClass } from "@/components/shared/PremiumTableShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatDate, getInitials } from "@/lib/utils";
import type { IWaitress } from "@/types";

async function fetchWaitresses(): Promise<IWaitress[]> {
  const res = await fetch("/api/waitresses");
  if (!res.ok) throw new Error("fetch");
  return res.json();
}

function WaitressDialog({
  open,
  onClose,
  waitress,
}: {
  open: boolean;
  onClose: () => void;
  waitress?: IWaitress;
}) {
  const qc = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (waitress) {
      setFirstName(waitress.firstName);
      setLastName(waitress.lastName);
      setPhone(waitress.phone ?? "");
    } else {
      setFirstName("");
      setLastName("");
      setPhone("");
    }
  }, [waitress, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const url = waitress ? `/api/waitresses/${waitress._id}` : "/api/waitresses";
    const method = waitress ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, phone: phone.trim() || undefined }),
    });
    setIsSubmitting(false);
    if (!res.ok) {
      const err = await res.json();
      toast({ variant: "destructive", title: "Erreur", description: err.error });
      return;
    }
    toast({
      variant: "success",
      title: waitress ? "Serveuse modifiée" : "Serveuse ajoutée",
    });
    qc.invalidateQueries({ queryKey: ["waitresses"] });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{waitress ? "Modifier la serveuse" : "Nouvelle serveuse"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prénom</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Numéro de téléphone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex. 07 01 23 45 67"
              type="tel"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement…" : waitress ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function WaitressesPage() {
  const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
  const { data: session, status } = useSession();
  const qc = useQueryClient();

  const { data: waitresses, isLoading } = useQuery({
    queryKey: ["waitresses"],
    queryFn: fetchWaitresses,
    enabled: session?.user?.role === "directeur",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [edit, setEdit] = useState<IWaitress | undefined>();
  const [waitressPendingDelete, setWaitressPendingDelete] = useState<IWaitress | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/waitresses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      toast({ variant: "success", title: "Serveuse supprimée" });
      qc.invalidateQueries({ queryKey: ["waitresses"] });
      setWaitressPendingDelete(null);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const openCreate = () => {
    setEdit(undefined);
    setDialogOpen(true);
  };
  const openEdit = (w: IWaitress) => {
    setEdit(w);
    setDialogOpen(true);
  };

  const count = waitresses?.length ?? 0;
  const paginatedWaitresses = (waitresses ?? []).slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.max(1, Math.ceil((waitresses?.length ?? 0) / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  if (status === "loading") return <Skeleton className="h-96" />;
  if (session?.user?.role !== "directeur") {
    return <p className="py-20 text-center text-[#9CA3AF]">Accès réservé au directeur.</p>;
  }

  return (
    <div>
      <PageHeader
        title="Serveuses"
        subtitle="Gérer l’équipe de salle"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Ajouter une serveuse
          </Button>
        }
      />

      <div className="mb-10 max-w-xs">
        {isLoading ? (
          <Skeleton className="h-28 rounded-2xl" />
        ) : (
          <StatsCard title="Serveuses enregistrées" value={count} icon={UserRound} index={0} />
        )}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-3 flex justify-end">
          <label className="inline-flex items-center gap-2 text-xs text-slate-500">
            Lignes par page
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
              className={premiumTableSelectClass}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        <PremiumTableShell
          title="Équipe de salle"
          isLoading={isLoading}
          empty={!isLoading && (waitresses?.length === 0)}
          emptyMessage="Aucune serveuse enregistrée"
          emptyAction={
            <Button variant="link" className="h-auto p-0 text-slate-900 underline-offset-4 hover:underline" onClick={openCreate}>
              Ajouter la première
            </Button>
          }
          skeletonRows={6}
          tableMinWidthClass="min-w-[720px]"
          skeletonColSpan={4}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-950/[0.025] text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th className="whitespace-nowrap px-6 py-3.5 font-semibold">Serveuse</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold">Téléphone</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold">Inscription</th>
                  <th className="whitespace-nowrap px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {paginatedWaitresses.map((w) => (
                  <tr
                    key={w._id}
                    className="group transition-colors duration-200 hover:bg-gradient-to-r hover:from-violet-500/[0.04] hover:via-transparent hover:to-cyan-500/[0.03]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-600/80 shadow-inner ring-1 ring-white/25">
                          <span className="text-xs font-bold tracking-tight text-white">
                            {getInitials(w.firstName, w.lastName)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {w.firstName} {w.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {w.phone ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/50 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-900/90">
                          <Phone className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                          {w.phone}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/55 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-950/80">
                        <CalendarClock className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                        {formatDate(w.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1 opacity-90 transition group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-xl border-slate-200/80 bg-white/80 text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-violet-200 hover:bg-violet-500/8 hover:text-violet-900"
                          asChild
                        >
                          <Link href={`/waitresses/${w._id}`} aria-label={`Voir ${w.firstName} ${w.lastName}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-xl border-slate-200/80 bg-white/80 text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-violet-200 hover:bg-violet-500/8 hover:text-violet-900"
                          onClick={() => openEdit(w)}
                          aria-label={`Modifier ${w.firstName} ${w.lastName}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-xl border-rose-200/60 bg-rose-500/[0.06] text-rose-600 shadow-sm backdrop-blur-sm transition hover:border-rose-300 hover:bg-rose-500/12 hover:text-rose-700"
                          onClick={() => setWaitressPendingDelete(w)}
                          aria-label={`Supprimer ${w.firstName} ${w.lastName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PremiumTableShell>
      </motion.section>

      <PaginationControls
        className="mt-6"
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={waitresses?.length ?? 0}
        onPageChange={setCurrentPage}
      />

      <WaitressDialog open={dialogOpen} onClose={() => setDialogOpen(false)} waitress={edit} />

      <Dialog
        open={!!waitressPendingDelete}
        onOpenChange={(open) => !open && !deleteMutation.isPending && setWaitressPendingDelete(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la serveuse ?</DialogTitle>
            <DialogDescription>
              {waitressPendingDelete && (
                <>
                  Vous allez supprimer définitivement{" "}
                  <span className="font-medium text-[#0D0D0D]">
                    {waitressPendingDelete.firstName} {waitressPendingDelete.lastName}
                  </span>
                  . Cette action est irréversible. Si des ventes sont liées à cette serveuse, la suppression sera
                  refusée.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setWaitressPendingDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (waitressPendingDelete) deleteMutation.mutate(waitressPendingDelete._id);
              }}
            >
              {deleteMutation.isPending ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
