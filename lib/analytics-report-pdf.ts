export interface AnalyticsReportPayload {
  period: {
    filter: "week" | "month" | "semester" | "year" | "custom";
    startDate: string;
    endDate: string;
    label: string;
  };
  summary: {
    suppliesCount: number;
    suppliesUnits: number;
    suppliesTotalCost: number;
    salesCount: number;
    salesRevenue: number;
  };
  supplies: Array<{
    date: string;
    productName: string;
    totalUnits: number;
    totalCost: number;
  }>;
  sales: Array<{
    date: string;
    totalAmount: number;
  }>;
  productProfits: Array<{
    name: string;
    units: number;
    revenue: number;
    profit: number;
  }>;
  topSellingProduct: {
    name: string;
    units: number;
    revenue: number;
    profit: number;
  } | null;
  generatedAt: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  })
    .format(value)
    .replace(/[\u202F\u00A0]/g, " ");
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/[\u202F\u00A0]/g, " ");
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function safePercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

function buildInsights(report: AnalyticsReportPayload): string[] {
  const totalProfit = report.productProfits.reduce((sum, row) => sum + row.profit, 0);
  const marginRate = safePercent(totalProfit, report.summary.salesRevenue);
  const averageSale = report.summary.salesCount > 0 ? report.summary.salesRevenue / report.summary.salesCount : 0;
  const supplyToRevenueRate = safePercent(report.summary.suppliesTotalCost, report.summary.salesRevenue);
  const topProductRevenueShare = report.topSellingProduct
    ? safePercent(report.topSellingProduct.revenue, report.summary.salesRevenue)
    : 0;
  const top3Profit = report.productProfits
    .slice()
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 3)
    .reduce((sum, row) => sum + row.profit, 0);
  const top3ProfitShare = safePercent(top3Profit, totalProfit);

  const insights: string[] = [];
  insights.push(
    `La période clôture à ${formatCurrency(report.summary.salesRevenue)} de chiffre d'affaires pour ${formatInteger(report.summary.salesCount)} ventes.`
  );
  insights.push(
    `La rentabilité brute s'établit à ${formatCurrency(totalProfit)}, soit ${formatPercent(marginRate)} de marge sur le chiffre d'affaires.`
  );
  insights.push(
    `Le ticket moyen ressort à ${formatCurrency(averageSale)} par vente, avec ${formatInteger(report.summary.suppliesCount)} opérations d'approvisionnement.`
  );
  insights.push(
    `Le coût des approvisionnements représente ${formatPercent(supplyToRevenueRate)} du chiffre d'affaires, indicateur clé de maîtrise des charges.`
  );
  if (report.topSellingProduct) {
    insights.push(
      `Le produit leader est "${report.topSellingProduct.name}" avec ${formatInteger(report.topSellingProduct.units)} unités vendues, soit ${formatCurrency(report.topSellingProduct.revenue)} (${formatPercent(topProductRevenueShare)} du CA).`
    );
  } else {
    insights.push("Aucun produit leader identifié, car aucune vente n'a été enregistrée sur la période.");
  }
  insights.push(
    `Les 3 produits les plus rentables concentrent ${formatPercent(top3ProfitShare)} du bénéfice total, ce qui traduit ${top3ProfitShare >= 60 ? "une dépendance élevée à un noyau restreint de références" : "une rentabilité globalement diversifiée entre les références"}.`
  );

  return insights;
}

function buildExecutiveSummary(report: AnalyticsReportPayload, totalProfit: number, marginRate: number): string[] {
  const averageSale = report.summary.salesCount > 0 ? report.summary.salesRevenue / report.summary.salesCount : 0;
  const supplyToRevenueRate = safePercent(report.summary.suppliesTotalCost, report.summary.salesRevenue);
  const topProductName = report.topSellingProduct?.name ?? "Aucun produit dominant";

  return [
    `Performance globale: ${formatCurrency(report.summary.salesRevenue)} de CA sur ${formatInteger(report.summary.salesCount)} ventes.`,
    `Rentabilité: ${formatCurrency(totalProfit)} de bénéfice brut, soit ${formatPercent(marginRate)} de marge.`,
    `Structure des coûts: approvisionnements à ${formatPercent(supplyToRevenueRate)} du CA, ticket moyen à ${formatCurrency(averageSale)}.`,
    `Produit clé à surveiller: ${topProductName}.`,
  ];
}

export async function exportAnalyticsReportPdf(report: AnalyticsReportPayload): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = (autoTableModule as { default: (doc: unknown, options: unknown) => void }).default;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.setFont("helvetica", "normal");
  doc.setCharSpace(0);
  doc.setLineHeightFactor(1.15);

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const primary = [15, 23, 42] as const;
  const secondary = [71, 85, 105] as const;
  const border = [226, 232, 240] as const;
  const softBg = [248, 250, 252] as const;
  const accent = [30, 64, 175] as const;

  const totalProfit = report.productProfits.reduce((sum, row) => sum + row.profit, 0);
  const marginRate = safePercent(totalProfit, report.summary.salesRevenue);
  const executiveSummary = buildExecutiveSummary(report, totalProfit, marginRate);
  const insights = buildInsights(report);

  const footer = () => {
    const pages = doc.getNumberOfPages();
    for (let pageIndex = 1; pageIndex <= pages; pageIndex += 1) {
      doc.setPage(pageIndex);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...accent);
      doc.text(`Rapport Analytiques • ${report.period.label}`, margin, pageHeight - 7);
      doc.text(`Page ${pageIndex}/${pages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
    }
  };

  // Cover/header
  doc.setFillColor(...softBg);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setDrawColor(...border);
  doc.line(0, 40, pageWidth, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...primary);
  doc.text("Rapport Analytiques - Performance commerciale", margin, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...secondary);
  doc.text(`Période: ${report.period.label}`, margin, 24);
  doc.text(`Du ${report.period.startDate} au ${report.period.endDate}`, margin, 29);
  doc.text(`Généré le ${new Date(report.generatedAt).toLocaleString("fr-FR")}`, margin, 34);

  // 1) Synthèse KPI
  let y = 48;
  const gap = 4;
  const cardW = (contentWidth - gap) / 2;
  const cardH = 19;
  const drawKpiCard = (x: number, cardY: number, title: string, value: string, subtitle: string) => {
    doc.setFillColor(...softBg);
    doc.setDrawColor(...border);
    doc.roundedRect(x, cardY, cardW, cardH, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...secondary);
    doc.text(title, x + 3, cardY + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...primary);
    doc.text(value, x + 3, cardY + 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.text(subtitle, x + 3, cardY + 16);
  };

  drawKpiCard(margin, y, "Chiffre d'affaires", formatCurrency(report.summary.salesRevenue), "Ventes réalisées");
  drawKpiCard(margin + cardW + gap, y, "Bénéfice brut", formatCurrency(totalProfit), "Bénéfice cumulé produits");
  y += cardH + gap;
  drawKpiCard(margin, y, "Taux de marge", formatPercent(marginRate), "Bénéfice / CA");
  drawKpiCard(
    margin + cardW + gap,
    y,
    "Ventes clôturées",
    formatInteger(report.summary.salesCount),
    "Nombre de ventes sur la période"
  );
  y += cardH + 8;

  // 2) Résumé exécutif
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text("Résumé exécutif", margin, y);
  y += 6;
  doc.setDrawColor(...border);
  doc.line(margin, y, margin + contentWidth, y);
  y += 4;
  const summaryLineHeight = 4.3;
  const summaryLines = executiveSummary.map((line) => doc.splitTextToSize(`- ${line}`, contentWidth - 8));
  const summaryTextHeight = summaryLines.reduce(
    (height, lines) => height + (Array.isArray(lines) ? lines.length : 1) * summaryLineHeight,
    0
  );
  const summaryHeight = Math.max(22, summaryTextHeight + 6);
  if (y + summaryHeight + 6 > pageHeight - 20) {
    doc.addPage();
    y = margin;
  }
  doc.setFillColor(...softBg);
  doc.setDrawColor(...border);
  doc.roundedRect(margin, y, contentWidth, summaryHeight, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...secondary);
  let summaryCursorY = y + 4.5;
  summaryLines.forEach((lines) => {
    const safeLines = Array.isArray(lines) ? lines : [lines];
    doc.text(safeLines, margin + 4, summaryCursorY);
    summaryCursorY += safeLines.length * summaryLineHeight;
  });
  y += summaryHeight + 7;

  // 3) Insights section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text("Commentaires et analyses factuelles", margin, y);
  y += 6;
  doc.setDrawColor(...border);
  doc.line(margin, y, margin + contentWidth, y);
  y += 4;

  insights.forEach((text, index) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${text}`, contentWidth - 2);
    if (y + lines.length * 5 > pageHeight - 20) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...secondary);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 1.5;
  });
  y += 4;

  // 4) Top product card
  if (y + 34 > pageHeight - 20) {
    doc.addPage();
    y = margin;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text("Produit le plus vendu", margin, y);
  y += 6;
  doc.setDrawColor(...border);
  doc.line(margin, y, margin + contentWidth, y);
  y += 4;
  doc.setFillColor(...softBg);
  doc.setDrawColor(...border);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...secondary);
  if (report.topSellingProduct) {
    doc.text(`Produit: ${report.topSellingProduct.name}`, margin + 4, y + 7);
    doc.text(`Unités vendues: ${formatInteger(report.topSellingProduct.units)}`, margin + 4, y + 13);
    doc.text(`Revenus: ${formatCurrency(report.topSellingProduct.revenue)}`, margin + 100, y + 7);
    doc.text(`Bénéfice: ${formatCurrency(report.topSellingProduct.profit)}`, margin + 100, y + 13);
  } else {
    doc.text("Aucune vente sur la période.", margin + 4, y + 11);
  }
  y += 30;

  const tableCommon = {
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: primary,
      lineColor: border,
      lineWidth: 0.1,
      cellPadding: 2,
      overflow: "linebreak",
      cellWidth: "wrap",
      valign: "middle",
    },
    headStyles: {
      fillColor: softBg,
      textColor: primary,
      fontStyle: "bold",
      overflow: "linebreak",
    },
    alternateRowStyles: {
      fillColor: [252, 253, 255],
    },
  } as const;

  const addSectionHeader = (title: string) => {
    if (y + 12 > pageHeight - 20) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...primary);
    doc.text(title, margin, y);
    y += 6;
    doc.setDrawColor(...border);
    doc.line(margin, y, margin + contentWidth, y);
    y += 3;
  };

  // 5) Données détaillées
  addSectionHeader("Données détaillées");
  addSectionHeader(`Approvisionnements (${formatInteger(report.supplies.length)})`);
  autoTable(doc, {
    ...tableCommon,
    startY: y,
    head: [["Date", "Produit", "Quantité", "Coût"]],
    body:
      report.supplies.length > 0
        ? report.supplies.map((row) => [
            row.date,
            row.productName,
            formatInteger(row.totalUnits),
            formatCurrency(row.totalCost),
          ])
        : [["-", "Aucun approvisionnement sur la période", "-", "-"]],
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 88 },
      2: { cellWidth: 26, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;

  addSectionHeader(`Ventes réalisées (${formatInteger(report.sales.length)})`);
  autoTable(doc, {
    ...tableCommon,
    startY: y,
    head: [["Date", "Montant de la vente"]],
    body:
      report.sales.length > 0
        ? report.sales.map((row) => [row.date, formatCurrency(row.totalAmount)])
        : [["-", "Aucune vente réalisée sur la période"]],
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 136, halign: "right" },
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;

  addSectionHeader(`Bénéfice par produit (${formatInteger(report.productProfits.length)})`);
  autoTable(doc, {
    ...tableCommon,
    startY: y,
    head: [["Produit", "Unités", "Revenus", "Bénéfice"]],
    body:
      report.productProfits.length > 0
        ? report.productProfits
            .slice()
            .sort((a, b) => b.profit - a.profit)
            .map((row) => [
              row.name,
              formatInteger(row.units),
              formatCurrency(row.revenue),
              formatCurrency(row.profit),
            ])
        : [["Aucun produit", "-", "-", "-"]],
    columnStyles: {
      0: { cellWidth: 76 },
      1: { cellWidth: 22, halign: "right" },
      2: { cellWidth: 34, halign: "right" },
      3: { cellWidth: 34, halign: "right" },
    },
  });

  footer();
  doc.save(`rapport-analytiques-${report.period.startDate}-${report.period.endDate}.pdf`);
}
