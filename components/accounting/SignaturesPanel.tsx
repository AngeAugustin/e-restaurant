"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PenLine, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import type { IUser } from "@/types";

type SignatureUser = Pick<
  IUser,
  "_id" | "firstName" | "lastName" | "email" | "role" | "signatureUrl" | "isActive"
>;

const ROLE_LABEL: Record<string, string> = {
  directeur: "Directeur",
  directrice: "Directrice",
};

export function SignaturesPanel() {
  const qc = useQueryClient();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["signatures"],
    queryFn: async () => (await fetch("/api/signatures")).json() as Promise<SignatureUser[]>,
  });

  const saveSignature = async (userId: string, signatureUrl: string | null) => {
    const res = await fetch(`/api/signatures/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signatureUrl }),
    });
    if (!res.ok) {
      toast({ variant: "destructive", title: "Erreur", description: (await res.json()).error });
      return false;
    }
    qc.invalidateQueries({ queryKey: ["signatures"] });
    return true;
  };

  const handleUpload = async (user: SignatureUser, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Erreur", description: "Choisissez une image (JPEG, PNG, WebP…)." });
      return;
    }

    setUploadingId(user._id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/media/upload", { method: "POST", body: fd });
      if (!up.ok) {
        toast({ variant: "destructive", title: "Erreur", description: (await up.json()).error });
        return;
      }
      const { url } = (await up.json()) as { url: string };
      const ok = await saveSignature(user._id, url);
      if (ok) {
        toast({
          variant: "success",
          title: "Signature enregistrée",
          description: `${user.firstName} ${user.lastName}`,
        });
      }
    } finally {
      setUploadingId(null);
      const input = fileRefs.current[user._id];
      if (input) input.value = "";
    }
  };

  const handleRemove = async (user: SignatureUser) => {
    setRemovingId(user._id);
    try {
      const ok = await saveSignature(user._id, null);
      if (ok) {
        toast({
          variant: "success",
          title: "Signature retirée",
          description: `${user.firstName} ${user.lastName}`,
        });
      }
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#6B7280]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des signatures…
      </div>
    );
  }

  if (!users?.length) {
    return (
      <p className="text-sm text-[#6B7280]">
        Aucun utilisateur Directeur ou Directrice trouvé.
      </p>
    );
  }

  return (
    <ul className="max-w-2xl divide-y rounded-xl border bg-white">
      {users.map((user) => {
        const busy = uploadingId === user._id || removingId === user._id;
        const fullName = `${user.firstName} ${user.lastName}`.trim();

        return (
          <li key={user._id} className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-slate-50">
                {user.signatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.signatureUrl}
                    alt={`Signature de ${fullName}`}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <PenLine className="h-6 w-6 text-slate-300" aria-hidden />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{fullName}</p>
                <p className="text-xs text-[#6B7280]">{ROLE_LABEL[user.role] ?? user.role}</p>
                <p className="truncate text-xs text-[#9CA3AF]">{user.email}</p>
                {!user.signatureUrl ? (
                  <p className="mt-1 text-xs text-amber-700">Aucune signature</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                ref={(el) => {
                  fileRefs.current[user._id] = el;
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleUpload(user, e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={busy}
                onClick={() => fileRefs.current[user._id]?.click()}
              >
                {uploadingId === user._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {user.signatureUrl ? "Remplacer" : "Ajouter"}
              </Button>
              {user.signatureUrl ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-rose-600"
                  disabled={busy}
                  onClick={() => handleRemove(user)}
                >
                  {removingId === user._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Retirer
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
