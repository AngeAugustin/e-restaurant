export interface AnalyticsReportPayload {
  period: {
    filter: "today" | "yesterday" | "week" | "month" | "semester" | "year" | "custom";
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
    amountPaid: number;
    change: number;
    waitressName: string;
    itemsCount: number;
    saleItems: Array<{
      productName: string;
      quantity: number;
    }>;
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
  const topProductName = report.topSellingProduct?.name ?? "Aucun produit dominant";

  return [
    `Performance globale: ${formatCurrency(report.summary.salesRevenue)} de CA sur ${formatInteger(report.summary.salesCount)} ventes.`,
    `Rentabilité: ${formatCurrency(totalProfit)} de bénéfice brut, soit ${formatPercent(marginRate)} de marge.`,
    `Produit clé à surveiller: ${topProductName}.`,
  ];
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

export async function exportAnalyticsReportPdf(report: AnalyticsReportPayload): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = (autoTableModule as { default: (doc: unknown, options: unknown) => void }).default;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.setFont("helvetica", "normal");
  doc.setCharSpace(0);
  doc.setLineHeightFactor(1.25);

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const primary = [15, 23, 42] as const;
  const secondary = [71, 85, 105] as const;
  const border = [226, 232, 240] as const;
  const softBg = [248, 250, 252] as const;
  const accent = [30, 64, 175] as const;
  const mutedText = [100, 116, 139] as const;
  const cardTitle = [51, 65, 85] as const;
  const sectionGap = 12;

  const totalProfit = report.productProfits.reduce((sum, row) => sum + row.profit, 0);
  const marginRate = safePercent(totalProfit, report.summary.salesRevenue);
  const executiveSummary = buildExecutiveSummary(report, totalProfit, marginRate);
  const insights = buildInsights(report);
  const companyLogo = await loadImageAsDataUrl("/Logo.png");
  const companyName = "ILOSIWAJU";
  const companySubtitle = "BAR Restaurant";
  const generatedAt = new Date(report.generatedAt).toLocaleString("fr-FR");
  const dateRangeLabel = `Du ${report.period.startDate} au ${report.period.endDate}`;

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
  doc.rect(0, 0, pageWidth, 24, "F");
  doc.setDrawColor(...border);
  doc.line(0, 24, pageWidth, 24);
  if (companyLogo) {
    doc.addImage(companyLogo, "PNG", pageWidth / 2 - 5, 3, 10, 10);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...primary);
  doc.text(companyName, pageWidth / 2, 16, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...secondary);
  doc.text(companySubtitle, pageWidth / 2, 20.5, { align: "center" });

  const drawSectionTitle = (title: string, startY: number): number => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(...primary);
    doc.text(title, margin, startY);
    doc.setDrawColor(...border);
    doc.line(margin, startY + 2.8, margin + contentWidth, startY + 2.8);
    return startY + 10;
  };

  const drawSubSectionTitle = (title: string, startY: number): number => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...cardTitle);
    doc.text(title, margin, startY);
    return startY + 6;
  };

  const ensureSpace = (cursorY: number, requiredHeight: number): number => {
    if (cursorY + requiredHeight <= pageHeight - 20) return cursorY;
    doc.addPage();
    return margin;
  };

  const drawInfoLabelValue = (label: string, value: string, x: number, yPos: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.text(label, x, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...primary);
    doc.text(value, x, yPos + 4.6);
  };

  const drawKpiCard = (params: { x: number; yPos: number; width: number; title: string; value: string; subtitle: string }) => {
    const { x, yPos, width, title, value, subtitle } = params;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...border);
    doc.roundedRect(x, yPos, width, 26, 2, 2, "FD");
    doc.setFillColor(...accent);
    doc.rect(x, yPos, width, 1.2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...cardTitle);
    doc.text(title, x + 3, yPos + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...primary);
    doc.text(value, x + 3, yPos + 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    const subtitleLines = doc.splitTextToSize(subtitle, width - 6);
    doc.text(subtitleLines, x + 3, yPos + 19);
  };

  // 1) Informations de rapport
  let y = 34;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...primary);
  doc.text("Rapport Analytiques", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...secondary);
  doc.text("Synthèse opérationnelle et financière", pageWidth / 2, y, { align: "center" });
  y += 7;
  doc.setFillColor(...softBg);
  doc.setDrawColor(...border);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "FD");
  drawInfoLabelValue("PERIODE", report.period.label, margin + 4, y + 6);
  drawInfoLabelValue("INTERVALLE", dateRangeLabel, margin + 70, y + 6);
  drawInfoLabelValue("GENERE LE", generatedAt, margin + 140, y + 6);
  y += 34;

  // 2) Résumé exécutif
  y = drawSectionTitle("Résumé exécutif", y);
  const summaryLineHeight = 5;
  const summaryLines = executiveSummary.map((line) => doc.splitTextToSize(`- ${line}`, contentWidth - 8));
  const summaryTextHeight = summaryLines.reduce(
    (height, lines) => height + (Array.isArray(lines) ? lines.length : 1) * summaryLineHeight,
    0
  );
  const summaryHeight = Math.max(26, summaryTextHeight + 8);
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
  let summaryCursorY = y + 6;
  summaryLines.forEach((lines) => {
    const safeLines = Array.isArray(lines) ? lines : [lines];
    doc.text(safeLines, margin + 4, summaryCursorY);
    summaryCursorY += safeLines.length * summaryLineHeight;
  });
  y += summaryHeight + sectionGap;

  // 3) KPI + produit phare
  y = ensureSpace(y, 68);
  y = drawSectionTitle("Indicateurs clés", y);
  const gap = 4;
  const cardWidth = (contentWidth - gap * 2) / 3;
  drawKpiCard({
    x: margin,
    yPos: y,
    width: cardWidth,
    title: "Chiffre d'affaires",
    value: formatCurrency(report.summary.salesRevenue),
    subtitle: `${formatInteger(report.summary.salesCount)} vente(s)`,
  });
  drawKpiCard({
    x: margin + cardWidth + gap,
    yPos: y,
    width: cardWidth,
    title: "Bénéfice brut",
    value: formatCurrency(totalProfit),
    subtitle: `${formatPercent(marginRate)} de marge`,
  });
  drawKpiCard({
    x: margin + cardWidth * 2 + gap * 2,
    yPos: y,
    width: cardWidth,
    title: "Approvisionnements",
    value: formatCurrency(report.summary.suppliesTotalCost),
    subtitle: `${formatInteger(report.summary.suppliesCount)} opération(s)`,
  });
  y += 36;

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
      cellPadding: 2.8,
      overflow: "linebreak",
      cellWidth: "wrap",
      valign: "middle",
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: primary,
      fontStyle: "bold",
      overflow: "linebreak",
    },
    alternateRowStyles: {
      fillColor: [252, 253, 255],
    },
  } as const;

  const addSectionHeader = (title: string) => {
    y += 3;
    y = ensureSpace(y, 14);
    y = drawSectionTitle(title, y);
  };

  // 4) Données détaillées
  addSectionHeader("Détails des opérations");
  y = drawSubSectionTitle(`Approvisionnements (${formatInteger(report.supplies.length)})`, y);
  autoTable(doc, {
    ...tableCommon,
    startY: y,
    head: [["Date", "Produit", "Quantité", "Coût"]],
    body:
      report.supplies.length > 0
        ? [
            ...report.supplies.map((row) => [
              row.date,
              row.productName,
              formatInteger(row.totalUnits),
              formatCurrency(row.totalCost),
            ]),
            [
              { content: "Total", colSpan: 2, styles: { fontStyle: "bold" } },
              { content: formatInteger(report.summary.suppliesUnits), styles: { halign: "right", fontStyle: "bold" } },
              {
                content: formatCurrency(report.summary.suppliesTotalCost),
                styles: { halign: "right", fontStyle: "bold" },
              },
            ],
            [
              {
                content: `Commentaire: ${formatInteger(report.supplies.length)} approvisionnement(s) enregistré(s) sur cette période.`,
                colSpan: 4,
                styles: { fontStyle: "italic", textColor: mutedText },
              },
            ],
          ]
        : [
            ["-", "Aucun approvisionnement sur la période", "-", "-"],
            [
              {
                content: "Commentaire: aucune entrée d'approvisionnement n'a été enregistrée sur cette période.",
                colSpan: 4,
                styles: { fontStyle: "italic", textColor: mutedText },
              },
            ],
          ],
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 88 },
      2: { cellWidth: 26, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 12;

  y = drawSubSectionTitle(`Ventes réalisées (${formatInteger(report.sales.length)})`, y);
  autoTable(doc, {
    ...tableCommon,
    startY: y,
    head: [["Date", "Serveuse", "Produits (Qté)", "Articles", "Montant vente", "Montant remis", "Monnaie"]],
    body:
      report.sales.length > 0
        ? [
            ...report.sales.map((row) => [
              row.date,
              row.waitressName,
              row.saleItems.length > 0
                ? row.saleItems.map((item) => `${item.productName} x${formatInteger(item.quantity)}`).join(", ")
                : "-",
              formatInteger(row.itemsCount),
              formatCurrency(row.totalAmount),
              formatCurrency(row.amountPaid),
              formatCurrency(row.change),
            ]),
            [
              { content: "Total", colSpan: 3, styles: { fontStyle: "bold" } },
              {
                content: formatInteger(report.sales.reduce((sum, row) => sum + row.itemsCount, 0)),
                styles: { halign: "right", fontStyle: "bold" },
              },
              { content: formatCurrency(report.summary.salesRevenue), styles: { halign: "right", fontStyle: "bold" } },
              {
                content: formatCurrency(report.sales.reduce((sum, row) => sum + row.amountPaid, 0)),
                styles: { halign: "right", fontStyle: "bold" },
              },
              {
                content: formatCurrency(report.sales.reduce((sum, row) => sum + row.change, 0)),
                styles: { halign: "right", fontStyle: "bold" },
              },
            ],
            [
              {
                content: `Commentaire: ${formatInteger(report.sales.length)} vente(s) clôturée(s), pour un total de ${formatCurrency(report.summary.salesRevenue)}.`,
                colSpan: 7,
                styles: { fontStyle: "italic", textColor: mutedText },
              },
            ],
          ]
        : [
            ["-", "-", "-", "-", "Aucune vente réalisée", "-", "-"],
            [
              {
                content: "Commentaire: aucune vente clôturée n'a été enregistrée sur la période.",
                colSpan: 7,
                styles: { fontStyle: "italic", textColor: mutedText },
              },
            ],
          ],
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 24 },
      2: { cellWidth: 40 },
      3: { cellWidth: 12, halign: "right" },
      4: { cellWidth: 24, halign: "right" },
      5: { cellWidth: 28, halign: "right" },
      6: { cellWidth: 30, halign: "right" },
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 12;

  y = drawSubSectionTitle(`Bénéfice par produit (${formatInteger(report.productProfits.length)})`, y);
  autoTable(doc, {
    ...tableCommon,
    startY: y,
    head: [["Produit", "Unités", "Revenus", "Bénéfice"]],
    body:
      report.productProfits.length > 0
        ? [
            ...report.productProfits
              .slice()
              .sort((a, b) => b.profit - a.profit)
              .map((row) => [
                row.name,
                formatInteger(row.units),
                formatCurrency(row.revenue),
                formatCurrency(row.profit),
              ]),
            [
              { content: "Total", styles: { fontStyle: "bold" } },
              {
                content: formatInteger(report.productProfits.reduce((sum, row) => sum + row.units, 0)),
                styles: { halign: "right", fontStyle: "bold" },
              },
              {
                content: formatCurrency(report.productProfits.reduce((sum, row) => sum + row.revenue, 0)),
                styles: { halign: "right", fontStyle: "bold" },
              },
              {
                content: formatCurrency(report.productProfits.reduce((sum, row) => sum + row.profit, 0)),
                styles: { halign: "right", fontStyle: "bold" },
              },
            ],
            [
              {
                content: report.topSellingProduct
                  ? `Commentaire: le produit dominant est "${report.topSellingProduct.name}" avec ${formatInteger(report.topSellingProduct.units)} unités vendues.`
                  : "Commentaire: aucun produit dominant n'a pu être identifié sur cette période.",
                colSpan: 4,
                styles: { fontStyle: "italic", textColor: mutedText },
              },
            ],
          ]
        : [
            ["Aucun produit", "-", "-", "-"],
            [
              {
                content: "Commentaire: aucun produit dominant n'a pu être identifié sur cette période.",
                colSpan: 4,
                styles: { fontStyle: "italic", textColor: mutedText },
              },
            ],
          ],
    columnStyles: {
      0: { cellWidth: 76 },
      1: { cellWidth: 22, halign: "right" },
      2: { cellWidth: 34, halign: "right" },
      3: { cellWidth: 34, halign: "right" },
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 12;

  // 5) Analyse / insights
  y = ensureSpace(y, 68);
  y = drawSectionTitle("Analyse et insights", y);
  const alertMessages: string[] = [];
  if (marginRate < 12 && report.summary.salesRevenue > 0) {
    alertMessages.push("Marge brute faible sur la période, à surveiller.");
  }
  if (report.summary.salesCount === 0) {
    alertMessages.push("Aucune vente enregistrée sur la période.");
  }
  const allInsights = [...insights.slice(0, 4), ...alertMessages.map((item) => `Point de vigilance: ${item}`)];
  const insightLines = allInsights.map((line) => doc.splitTextToSize(line, contentWidth - 14));
  const insightHeight =
    insightLines.reduce((sum, lines) => sum + (Array.isArray(lines) ? lines.length : 1) * 4.6, 0) + allInsights.length * 2 + 8;
  y = ensureSpace(y, insightHeight + 6);
  doc.setFillColor(...softBg);
  doc.setDrawColor(...border);
  doc.roundedRect(margin, y, contentWidth, insightHeight, 2, 2, "FD");
  let insightY = y + 6;
  insightLines.forEach((lines) => {
    const safeLines = Array.isArray(lines) ? lines : [lines];
    doc.setFillColor(...accent);
    doc.circle(margin + 3.2, insightY - 1.4, 0.7, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);
    doc.setTextColor(...secondary);
    doc.text(safeLines, margin + 6, insightY);
    insightY += safeLines.length * 4.6 + 2;
  });

  footer();
  doc.save(`rapport-analytiques-${report.period.startDate}-${report.period.endDate}.pdf`);
}
