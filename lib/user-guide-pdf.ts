import type { UserRole } from "@/types";
import {
  COMMON_INTRO,
  GUIDE_LAST_UPDATED,
  GUIDE_VERSION,
  ROLE_GUIDES,
  ROLE_META,
  type GuideScope,
  type GuideSection,
  type GuideSubsection,
  getFullGuideDocument,
} from "@/lib/user-guide-content";

async function loadImageAsDataUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function wrapText(
  doc: import("jspdf").jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  lines.forEach((line, i) => {
    doc.text(line, x, y + i * lineHeight);
  });
  return y + lines.length * lineHeight;
}

function drawSubsection(
  doc: import("jspdf").jsPDF,
  sub: GuideSubsection,
  margin: number,
  contentWidth: number,
  startY: number,
  pageHeight: number,
  ensureSpace: (y: number, h: number) => number
): number {
  const primary = [15, 23, 42] as const;
  const secondary = [71, 85, 105] as const;
  const muted = [100, 116, 139] as const;
  let y = ensureSpace(startY, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...primary);
  y = wrapText(doc, sub.title, margin, y, contentWidth, 5) + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...secondary);
  for (const p of sub.paragraphs ?? []) {
    y = ensureSpace(y, 12);
    y = wrapText(doc, p, margin, y, contentWidth, 4.2) + 3;
  }

  if (sub.steps?.length) {
    y = ensureSpace(y, 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text("Étapes :", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...secondary);
    sub.steps.forEach((step, i) => {
      y = ensureSpace(y, 8);
      y = wrapText(doc, `${i + 1}. ${step}`, margin + 2, y, contentWidth - 2, 4.2) + 2;
    });
  }

  if (sub.tips?.length) {
    y = ensureSpace(y, 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175);
    doc.text("Conseils :", margin, y);
    y += 5;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...secondary);
    for (const tip of sub.tips) {
      y = ensureSpace(y, 8);
      y = wrapText(doc, `• ${tip}`, margin + 2, y, contentWidth - 2, 4.2) + 2;
    }
    doc.setFont("helvetica", "normal");
  }

  return y + 4;
}

function drawSection(
  doc: import("jspdf").jsPDF,
  section: GuideSection,
  margin: number,
  contentWidth: number,
  startY: number,
  pageHeight: number,
  ensureSpace: (y: number, h: number) => number
): number {
  const primary = [15, 23, 42] as const;
  const border = [226, 232, 240] as const;
  let y = ensureSpace(startY, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text(section.title, margin, y);
  doc.setDrawColor(...border);
  doc.line(margin, y + 2.5, margin + contentWidth, y + 2.5);
  y += 10;

  for (const sub of section.subsections) {
    y = drawSubsection(doc, sub, margin, contentWidth, y, pageHeight, ensureSpace);
  }

  return y + 6;
}

export async function exportUserGuidePdf(
  scope: GuideScope,
  solutionName = "e-stock"
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.setFont("helvetica", "normal");

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const primary = [15, 23, 42] as const;
  const secondary = [71, 85, 105] as const;
  const accent = [30, 64, 175] as const;
  const softBg = [248, 250, 252] as const;

  let cursorY = margin;

  const ensureSpace = (y: number, requiredHeight: number): number => {
    if (y + requiredHeight <= pageHeight - 18) return y;
    doc.addPage();
    return margin;
  };

  const footer = (title: string) => {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i += 1) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...accent);
      doc.text(`Guide utilisateur — ${title}`, margin, pageHeight - 7);
      doc.text(`Page ${i}/${pages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
    }
  };

  const logo = await loadImageAsDataUrl("/Logo.png");
  const generatedAt = new Date().toLocaleString("fr-FR");

  // Cover
  doc.setFillColor(...softBg);
  doc.rect(0, 0, pageWidth, 50, "F");
  if (logo) doc.addImage(logo, "PNG", pageWidth / 2 - 8, 8, 16, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...primary);
  doc.text("Guide utilisateur", pageWidth / 2, 32, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(...secondary);
  doc.text(solutionName, pageWidth / 2, 40, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Version ${GUIDE_VERSION} — ${GUIDE_LAST_UPDATED}`, pageWidth / 2, 46, { align: "center" });
  doc.text(`Généré le ${generatedAt}`, pageWidth / 2, 52, { align: "center" });

  cursorY = 62;

  const drawIntro = () => {
    cursorY = drawSection(doc, COMMON_INTRO, margin, contentWidth, cursorY, pageHeight, ensureSpace);
  };

  if (scope === "complet") {
    const full = getFullGuideDocument();
    drawIntro();
    for (const { meta, sections } of full.roles) {
      cursorY = ensureSpace(cursorY, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...primary);
      cursorY = wrapText(doc, `Rôle : ${meta.label}`, margin, cursorY, contentWidth, 6) + 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...secondary);
      cursorY = wrapText(doc, meta.shortDescription, margin, cursorY, contentWidth, 4.5) + 4;
      doc.setFontSize(9);
      meta.accessSummary.forEach((line) => {
        cursorY = ensureSpace(cursorY, 6);
        cursorY = wrapText(doc, `• ${line}`, margin + 2, cursorY, contentWidth - 2, 4) + 1;
      });
      cursorY += 4;
      for (const section of sections) {
        cursorY = drawSection(doc, section, margin, contentWidth, cursorY, pageHeight, ensureSpace);
      }
      cursorY = ensureSpace(cursorY, 8);
    }
    footer("Complet (tous les rôles)");
    doc.save(`guide-utilisateur-complet-${Date.now()}.pdf`);
    return;
  }

  const meta = ROLE_META[scope];
  drawIntro();
  cursorY = ensureSpace(cursorY, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...primary);
  cursorY = wrapText(doc, `Guide — ${meta.label}`, margin, cursorY, contentWidth, 6) + 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...secondary);
  cursorY = wrapText(doc, meta.shortDescription, margin, cursorY, contentWidth, 4.5) + 6;

  for (const section of ROLE_GUIDES[scope]) {
    cursorY = drawSection(doc, section, margin, contentWidth, cursorY, pageHeight, ensureSpace);
  }

  footer(meta.label);
  doc.save(`guide-utilisateur-${scope}-${Date.now()}.pdf`);
}
