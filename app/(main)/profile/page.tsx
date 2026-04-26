"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Eye, EyeOff, KeyRound, User } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import type { UserRole } from "@/types";

const profileFormSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis").max(100),
  lastName: z.string().trim().min(1, "Le nom est requis").max(100),
  phone: z.string().trim().max(40),
});

type ProfileForm = z.infer<typeof profileFormSchema>;

type ProfileResponse = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
};

async function fetchProfile(): Promise<ProfileResponse> {
  const res = await fetch("/api/profile");
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Impossible de charger le profil");
  }
  return res.json();
}

const roleLabel: Record<UserRole, string> = {
  directeur: "Directeur",
  gerant: "Gérant",
};

export default function ProfilePage() {
  const qc = useQueryClient();
  const { update } = useSession();

  const [passwordStep, setPasswordStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile-me"],
    queryFn: fetchProfile,
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { firstName: "", lastName: "", phone: "" },
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone ?? "",
    });
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (values: ProfileForm) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Enregistrement impossible");
      }
      return res.json() as Promise<ProfileResponse>;
    },
    onSuccess: async (payload) => {
      qc.setQueryData(["profile-me"], payload);
      const displayName = `${payload.firstName} ${payload.lastName}`.trim();
      await update({ name: displayName });
      toast({ variant: "success", title: "Profil mis à jour" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const onSubmit = form.handleSubmit((values) => saveMutation.mutate(values));

  const verifyCurrentPasswordMutation = useMutation({
    mutationFn: async (pwd: string) => {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwd }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Vérification impossible");
      }
    },
    onSuccess: () => {
      setPasswordStep(2);
      toast({ variant: "success", title: "Étape 1 validée", description: "Saisissez votre nouveau mot de passe." });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Mot de passe incorrect", description: err.message });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Mise à jour impossible");
      }
    },
    onSuccess: () => {
      setPasswordStep(1);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPwd(false);
      setShowNewPwd(false);
      setShowConfirmPwd(false);
      toast({ variant: "success", title: "Mot de passe mis à jour" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const resetPasswordFlow = () => {
    setPasswordStep(1);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPwd(false);
    setShowNewPwd(false);
    setShowConfirmPwd(false);
    verifyCurrentPasswordMutation.reset();
    changePasswordMutation.reset();
  };

  const handleVerifyCurrentPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      toast({ variant: "destructive", title: "Champ requis", description: "Saisissez votre mot de passe actuel." });
      return;
    }
    verifyCurrentPasswordMutation.mutate(currentPassword);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Mot de passe trop court",
        description: "Au moins 6 caractères sont requis.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Confirmation différente",
        description: "Les deux saisies du nouveau mot de passe doivent être identiques.",
      });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  if (error) {
    return (
      <div>
        <PageHeader title="Mon profil" subtitle="Vos informations personnelles" />
        <p className="py-12 text-center text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Mon profil" subtitle="Consultez et modifiez vos informations" />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Informations du compte</CardTitle>
            </div>
            <CardDescription>
              Prénom, nom et numéro peuvent être modifiés. L&apos;email et le rôle sont gérés par un directeur.
            </CardDescription>
          </CardHeader>
          <CardContent>
          {isLoading || !profile ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" autoComplete="given-name" {...form.register("firstName")} />
                  {form.formState.errors.firstName && (
                    <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" autoComplete="family-name" {...form.register("lastName")} />
                  {form.formState.errors.lastName && (
                    <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input id="phone" type="tel" autoComplete="tel" placeholder="+33 …" {...form.register("phone")} />
                {form.formState.errors.phone && (
                  <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile.email} disabled className="bg-muted/50" readOnly />
              </div>

              <div className="space-y-2">
                <Label>Rôle</Label>
                <Input value={roleLabel[profile.role]} disabled className="bg-muted/50 capitalize" readOnly />
              </div>

              <Button type="submit" disabled={saveMutation.isPending || !form.formState.isDirty}>
                {saveMutation.isPending ? "Enregistrement…" : "Enregistrer les modifications"}
              </Button>
            </form>
          )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Mot de passe</CardTitle>
            </div>
            <CardDescription>
              {passwordStep === 1
                ? "Étape 1 sur 2 : confirmez votre mot de passe actuel."
                : "Étape 2 sur 2 : choisissez un nouveau mot de passe et confirmez-le."}
            </CardDescription>
          </CardHeader>
          <CardContent>
          {passwordStep === 1 ? (
            <form onSubmit={handleVerifyCurrentPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPwd ? "text" : "password"}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                    onClick={() => setShowCurrentPwd((v) => !v)}
                    aria-label={showCurrentPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={verifyCurrentPasswordMutation.isPending}>
                {verifyCurrentPasswordMutation.isPending ? "Vérification…" : "Continuer"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPwd ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                    onClick={() => setShowNewPwd((v) => !v)}
                    aria-label={showNewPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Au moins 6 caractères.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPwd ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                    onClick={() => setShowConfirmPwd((v) => !v)}
                    aria-label={showConfirmPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={resetPasswordFlow}>
                  Retour
                </Button>
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? "Enregistrement…" : "Valider le nouveau mot de passe"}
                </Button>
              </div>
            </form>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
