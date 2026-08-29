"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, UtensilsCrossed } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProductThumb } from "@/components/sales/ProductThumb";
import type { IMenu } from "@/types";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function MenuDialog({ open, onClose, menu }: { open: boolean; onClose: () => void; menu?: IMenu }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(menu?.name ?? "");
    setPrice(menu?.price != null ? String(menu.price) : "");
    setImage(menu?.image ?? "");
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [open, menu]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let imageUrl = image;
    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/media/upload", { method: "POST", body: fd });
      if (!up.ok) {
        setSaving(false);
        const err = await up.json().catch(() => ({}));
        toast({ variant: "destructive", title: "Upload", description: err.error ?? "Échec" });
        return;
      }
      imageUrl = (await up.json()).url;
    }
    if (!imageUrl) {
      setSaving(false);
      toast({ variant: "destructive", title: "Photo obligatoire" });
      return;
    }
    const res = await fetch(menu ? `/api/menus/${menu._id}` : "/api/menus", {
      method: menu ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price: Number(price), image: imageUrl }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json();
      toast({ variant: "destructive", title: "Erreur", description: err.error });
      return;
    }
    toast({ variant: "success", title: menu ? "Menu modifié" : "Menu ajouté" });
    qc.invalidateQueries({ queryKey: ["menus"] });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{menu ? "Modifier le menu" : "Nouveau menu"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Prix (FCFA)</Label>
            <Input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Photo (obligatoire)</Label>
            <Input
              ref={fileRef}
              type="file"
              accept={ACCEPTED.join(",")}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFile(f);
                setPreview(URL.createObjectURL(f));
              }}
            />
            {(preview || image) && (
              <ProductThumb imageUrl={preview || image} name={name || "Menu"} sizeClass="h-20 w-20" />
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : menu ? "Mettre à jour" : "Ajouter"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MenusPage() {
  const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
  const { data: session, status } = useSession();
  const qc = useQueryClient();
  const canManage = ["directeur", "directrice"].includes(session?.user?.role ?? "");
  const isDirector = session?.user?.role === "directeur";
  const { data: menus, isLoading } = useQuery({
    queryKey: ["menus"],
    queryFn: async () => (await fetch("/api/menus")).json() as Promise<IMenu[]>,
    enabled: canManage,
  });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<IMenu | undefined>();
  const [pendingDelete, setPendingDelete] = useState<IMenu | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/menus/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      toast({ variant: "success", title: "Menu supprimé" });
      qc.invalidateQueries({ queryKey: ["menus"] });
      setPendingDelete(null);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Erreur", description: e.message }),
  });

  const toggle = async (m: IMenu) => {
    const res = await fetch(`/api/menus/${m._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: m.isActive ? "deactivate" : "activate" }),
    });
    if (!res.ok) {
      toast({ variant: "destructive", title: "Erreur", description: (await res.json()).error });
      return;
    }
    qc.invalidateQueries({ queryKey: ["menus"] });
  };

  const rows = (menus ?? []).slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil((menus?.length ?? 0) / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  if (status === "loading") return <Skeleton className="h-96" />;
  if (!canManage) return <p className="py-20 text-center text-[#9CA3AF]">Accès réservé à la direction.</p>;

  return (
    <div>
      <PageHeader
        title="Menus"
        subtitle="Référentiel des plats"
        action={<Button onClick={() => { setEdit(undefined); setOpen(true); }}><Plus className="h-4 w-4" />Nouveau menu</Button>}
      />
      <div className="mb-8 max-w-xs">
        {isLoading ? <Skeleton className="h-28 rounded-2xl" /> : <StatsCard title="Menus" value={menus?.length ?? 0} icon={UtensilsCrossed} index={0} />}
      </div>
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-3 flex justify-end">
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])} className={premiumTableSelectClass}>
            {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <PremiumTableShell title="Catalogue menus" isLoading={isLoading} empty={!isLoading && !menus?.length} emptyMessage="Aucun menu" skeletonRows={5} tableMinWidthClass="min-w-[720px]" skeletonColSpan={5}>
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3 text-left">Menu</th>
                <th className="px-4 py-3 text-right">Prix</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Créé</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m._id} className="border-b hover:bg-slate-50/80">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <ProductThumb imageUrl={m.image} name={m.name} sizeClass="h-10 w-10" />
                      <span className="font-semibold">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(m.price)}</td>
                  <td className="px-4 py-3">{m.isActive ? "Actif" : "Désactivé"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(m.createdAt)}</td>
                  <td className="px-6 py-3 text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => toggle(m)}>{m.isActive ? "Désactiver" : "Activer"}</Button>
                    <Button size="icon" variant="outline" onClick={() => { setEdit(m); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    {isDirector && <Button size="icon" variant="outline" className="text-rose-600" onClick={() => setPendingDelete(m)}><Trash2 className="h-4 w-4" /></Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PremiumTableShell>
      </motion.section>
      <PaginationControls className="mt-6" currentPage={page} pageSize={pageSize} totalItems={menus?.length ?? 0} onPageChange={setPage} />
      <MenuDialog open={open} onClose={() => setOpen(false)} menu={edit} />
      <Dialog open={!!pendingDelete} onOpenChange={(v) => !v && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce menu ?</DialogTitle>
            <DialogDescription>Si des commandes y sont liées, désactivez-le plutôt.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => pendingDelete && del.mutate(pendingDelete._id)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
