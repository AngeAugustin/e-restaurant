/** Tailles de casier autorisées pour un approvisionnement (l’option 3 n’est plus proposée) */
export const SUPPLY_LOT_SIZES = [6, 12, 24] as const;

export function isStandardSupplyLotSize(n: number): boolean {
  return (SUPPLY_LOT_SIZES as readonly number[]).includes(n);
}

/** Valeurs affichées dans le sélecteur : tailles standard + valeur actuelle si hors liste (données anciennes). */
export function lotSizeSelectOptions(currentLotSizeStr: string): number[] {
  const n = Number.parseInt(currentLotSizeStr, 10);
  const set = new Set<number>(SUPPLY_LOT_SIZES);
  if (Number.isFinite(n) && n >= 1 && !set.has(n)) {
    set.add(n);
  }
  return Array.from(set).sort((a, b) => a - b);
}

export function isValidLotSizeChoice(lotSizeStr: string): boolean {
  const n = Number.parseInt(lotSizeStr, 10);
  if (!Number.isFinite(n) || n < 1) return false;
  return lotSizeSelectOptions(lotSizeStr).includes(n);
}
