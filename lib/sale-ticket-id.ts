/** Identifiant court affiché sur le ticket (N° ticket), dérivé de l’id MongoDB. */
export function saleTicketDisplayId(saleId: string): string {
  const clean = String(saleId).replace(/\s/g, "");
  return clean.length > 10 ? clean.slice(-10).toUpperCase() : clean.toUpperCase();
}

export function normalizeTicketInput(raw: string): string {
  return String(raw).replace(/[\s\-]/g, "").toUpperCase();
}

/** N° ticket affiché (10 hex) ou ObjectId complet (24 hex). */
export function isValidTicketQuery(raw: string): boolean {
  const ticket = normalizeTicketInput(raw);
  return /^[0-9A-F]{10}$/.test(ticket) || /^[0-9A-F]{24}$/.test(ticket);
}

/** Filtre Mongo pour retrouver un document dont le N° ticket (suffixe) ou l’_id correspond. */
export function ticketMatchFilter(raw: string): Record<string, unknown> | null {
  const ticket = normalizeTicketInput(raw);
  if (/^[0-9A-F]{24}$/.test(ticket)) {
    return { _id: ticket.toLowerCase() };
  }
  if (/^[0-9A-F]{10}$/.test(ticket)) {
    return {
      $expr: {
        $eq: [{ $toUpper: { $substrBytes: [{ $toString: "$_id" }, 14, 10] } }, ticket],
      },
    };
  }
  return null;
}
