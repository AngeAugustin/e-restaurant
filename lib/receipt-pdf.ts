/**
 * Exporte un élément DOM en PDF (image raster), pour reproduire le rendu à l’écran.
 */
export async function exportElementToPdf(element: HTMLElement, fileBaseName: string): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, {
    scale: 3,
    backgroundColor: "#fffcf7",
    logging: false,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png", 1.0);
  const pdfWidthMm = 80;
  const marginMm = 5;
  const innerW = pdfWidthMm - 2 * marginMm;
  const innerH = (canvas.height * innerW) / canvas.width;
  const pdfHeightMm = Math.max(innerH + 2 * marginMm, 40);

  const pdf = new jsPDF({
    unit: "mm",
    format: [pdfWidthMm, pdfHeightMm],
    orientation: "portrait",
  });

  pdf.addImage(imgData, "PNG", marginMm, marginMm, innerW, innerH);
  pdf.save(`${fileBaseName}.pdf`);
}

/** Exporte un élément DOM en PDF A4 (document administratif). */
export async function exportElementToA4Pdf(element: HTMLElement, fileBaseName: string): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    logging: false,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png", 1.0);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const innerW = pageW - 2 * margin;
  const innerH = (canvas.height * innerW) / canvas.width;
  const drawH = Math.min(innerH, pageH - 2 * margin);

  pdf.addImage(imgData, "PNG", margin, margin, innerW, drawH);
  pdf.save(`${fileBaseName}.pdf`);
}
