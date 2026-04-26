/** Identifiant court affiché sur le ticket (N° ticket), dérivé de l’id MongoDB. */
export function saleTicketDisplayId(saleId: string): string {
  const clean = String(saleId).replace(/\s/g, "");
  return clean.length > 10 ? clean.slice(-10).toUpperCase() : clean.toUpperCase();
}
