"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  FileDown,
  Loader2,
  Shield,
  User,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_SOLUTION_NAME } from "@/lib/app-settings";
import { exportUserGuidePdf } from "@/lib/user-guide-pdf";
import {
  COMMON_INTRO,
  GUIDE_LAST_UPDATED,
  GUIDE_VERSION,
  ROLE_META,
  ROLE_GUIDES,
  getGuideSectionsForRole,
  type GuideScope,
  type GuideSection,
  type GuideSubsection,
} from "@/lib/user-guide-content";
import type { UserRole } from "@/types";

const ROLE_TABS: { role: UserRole | "complet"; label: string; icon: typeof User }[] = [
  { role: "directeur", label: "Directeur", icon: Shield },
  { role: "directrice", label: "Directrice", icon: Users },
  { role: "gerant", label: "Gérant", icon: User },
  { role: "complet", label: "Guide complet", icon: BookOpen },
];

function SubsectionBlock({ sub }: { sub: GuideSubsection }) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
      <h4 className="text-sm font-semibold text-[#0D0D0D]">{sub.title}</h4>
      {sub.paragraphs && sub.paragraphs.length > 0 ? (
        <div className="space-y-2">
          {sub.paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-[#4B5563]">
              {p}
            </p>
          ))}
        </div>
      ) : null}
      {sub.steps && sub.steps.length > 0 ? (
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-[#4B5563]">
          {sub.steps.map((step, i) => (
            <li key={i} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      ) : null}
      {sub.tips && sub.tips.length > 0 ? (
        <ul className="space-y-1 rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2 text-sm text-blue-900">
          {sub.tips.map((tip, i) => (
            <li key={i} className="flex gap-2 leading-relaxed">
              <span className="font-semibold text-blue-700">Conseil</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SectionAccordion({
  section,
  defaultOpen,
}: {
  section: GuideSection;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <Card className="overflow-hidden rounded-2xl border shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30"
        aria-expanded={open}
      >
        <div>
          <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
          <CardDescription className="mt-0.5">
            {section.subsections.length} section{section.subsections.length > 1 ? "s" : ""}
          </CardDescription>
        </div>
        <ChevronDown
          className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-4 border-t px-5 pb-5 pt-2">
              {section.subsections.map((sub, i) => (
                <SubsectionBlock key={i} sub={sub} />
              ))}
            </CardContent>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

export default function GuidePage() {
  const { data: session } = useSession();
  const userRole = (session?.user?.role ?? "gerant") as UserRole;
  const [activeTab, setActiveTab] = useState<UserRole | "complet">(userRole);
  const [exporting, setExporting] = useState(false);

  const { data: branding } = useQuery({
    queryKey: ["app-settings-guide"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) return { solutionName: DEFAULT_SOLUTION_NAME };
      return (await res.json()) as { solutionName?: string };
    },
    staleTime: 60 * 1000,
  });

  const solutionName = branding?.solutionName ?? DEFAULT_SOLUTION_NAME;

  const displaySections = useMemo(() => {
    if (activeTab === "complet") return null;
    return getGuideSectionsForRole(activeTab);
  }, [activeTab]);

  const handleDownload = async () => {
    setExporting(true);
    try {
      await exportUserGuidePdf(activeTab as GuideScope, solutionName);
      toast({
        variant: "success",
        title: "PDF téléchargé",
        description:
          activeTab === "complet"
            ? "Le guide complet (tous les rôles) a été enregistré."
            : `Le guide ${ROLE_META[activeTab as UserRole].label} a été enregistré.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer le PDF. Réessayez.",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="pb-8">
      <PageHeader
        title="Guide utilisateur"
        subtitle={`Documentation complète — ${solutionName} · v${GUIDE_VERSION} (${GUIDE_LAST_UPDATED})`}
        action={
          <Button onClick={handleDownload} disabled={exporting} variant="outline" className="gap-2">
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            Télécharger en PDF
          </Button>
        }
      />

      {/* Role tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {ROLE_TABS.map(({ role, label, icon: Icon }) => {
          const isActive = activeTab === role;
          const isUserRole = role !== "complet" && role === userRole;
          return (
            <button
              key={role}
              type="button"
              onClick={() => setActiveTab(role)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
              {isUserRole ? (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  Votre rôle
                </Badge>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Introduction (always visible) */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-[#0D0D0D]">{COMMON_INTRO.title}</h2>
        <div className="space-y-4">
          {COMMON_INTRO.subsections.map((sub, i) => (
            <SubsectionBlock key={i} sub={sub} />
          ))}
        </div>
      </div>

      {/* Role-specific content */}
      {activeTab === "complet" ? (
        <div className="space-y-10">
          <p className="text-sm text-muted-foreground">
            Le guide complet regroupe la documentation des trois rôles. Utilisez le bouton « Télécharger en PDF »
            pour obtenir un document unique incluant toutes les sections ci-dessous.
          </p>
          {(["directeur", "directrice", "gerant"] as UserRole[]).map((role) => {
            const meta = ROLE_META[role];
            return (
              <section key={role} className="space-y-4">
                <div className="rounded-2xl border bg-gradient-to-br from-muted/40 to-transparent p-5">
                  <h2 className="text-xl font-bold text-[#0D0D0D]">{meta.label}</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">{meta.shortDescription}</p>
                  <ul className="mt-3 space-y-1 text-sm text-[#4B5563]">
                    {meta.accessSummary.map((line, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary">•</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  {ROLE_GUIDES[role].map((section, i) => (
                    <SectionAccordion key={section.id} section={section} defaultOpen={i === 0} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-5">
            <h2 className="text-xl font-bold text-[#0D0D0D]">{ROLE_META[activeTab].label}</h2>
            <p className="mt-1 text-sm text-[#6B7280]">{ROLE_META[activeTab].shortDescription}</p>
            <ul className="mt-3 space-y-1 text-sm text-[#4B5563]">
              {ROLE_META[activeTab].accessSummary.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">•</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            {displaySections?.map((section, i) => (
              <SectionAccordion key={section.id} section={section} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
