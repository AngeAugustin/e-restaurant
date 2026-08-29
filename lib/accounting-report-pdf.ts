import type { IAccountingSnapshot } from "@/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { DEFAULT_SOLUTION_NAME } from "@/lib/app-settings";

function pdfCurrency(value: number): string {
  return formatCurrency(value).replace(/[\u202F\u00A0]/g, " ");
}

async function loadImageAsDataUrl(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportAccountingReportPdf(snapshot: IAccountingSnapshot): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = (autoTableModule as { default: (doc: unknown, options: unknown) => void }).default;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const primary = [15, 23, 42] as const;
  const secondary = [71, 85, 105] as const;
  const border = [226, 232, 240] as const;
  const softBg = [248, 250, 252] as const;
  const logo = await loadImageAsDataUrl("/Logo.png");

  doc.setFillColor(...softBg);
  doc.rect(0, 0, pageWidth, 24, "F");
  if (logo) doc.addImage(logo, "PNG", pageWidth / 2 - 5, 3, 10, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...primary);
  doc.text(DEFAULT_SOLUTION_NAME, pageWidth / 2, 16, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...secondary);
  doc.text("Comptabilité", pageWidth / 2, 20.5, { align: "center" });

  let y = 34;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...primary);
  doc.text("Situation comptable", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...secondary);
  doc.text(snapshot.label, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.text(`Édité le ${formatDateTime(snapshot.generatedAt)}`, margin, y);
  y += 10;

  const cards = [
    { title: "Solde de départ", value: pdfCurrency(snapshot.startBalance) },
    { title: "Approvisionnements", value: pdfCurrency(snapshot.suppliesTotal) },
    { title: "Dépenses", value: pdfCurrency(snapshot.expensesTotal) },
    { title: "Solde de fin", value: pdfCurrency(snapshot.remaining) },
  ];
  const gap = 4;
  const cardW = (pageWidth - margin * 2 - gap * 3) / 4;
  cards.forEach((card, i) => {
    const x = margin + i * (cardW + gap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...border);
    doc.roundedRect(x, y, cardW, 22, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...secondary);
    doc.text(card.title, x + 3, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...primary);
    doc.text(card.value, x + 3, y + 15);
  });
  y += 30;

  let remaining = snapshot.startBalance;
  const body = [
    [
      formatDateTime(snapshot.from),
      "Départ",
      snapshot.period?.note || "Solde de départ",
      "—",
      pdfCurrency(snapshot.startBalance),
    ],
    ...snapshot.movements.map((row) => {
      remaining -= row.amount;
      return [
        formatDate(row.date),
        row.kind === "SUPPLY" ? "Approvisionnement" : "Dépense",
        row.label,
        pdfCurrency(row.amount),
        pdfCurrency(remaining),
      ];
    }),
  ];

  autoTable(doc, {
    startY: y,
    head: [["Date", "Type", "Libellé", "Sortie", "Reste"]],
    body,
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 36 },
      3: { halign: "right", cellWidth: 28 },
      4: { halign: "right", cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.text(`Comptabilité • ${snapshot.label}`, margin, pageHeight - 8);
    doc.text(`Page ${i}/${pages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  const slug = snapshot.label.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  doc.save(`comptabilite-${slug || "situation"}.pdf`);
}
