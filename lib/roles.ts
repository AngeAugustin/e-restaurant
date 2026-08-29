export const DIRECTION_ROLES = ["directeur", "directrice"] as const;
export const OPERATIONS_ROLES = ["directeur", "directrice", "gerant"] as const;

export type DirectionRole = (typeof DIRECTION_ROLES)[number];
export type OperationsRole = (typeof OPERATIONS_ROLES)[number];

export function isDirectionRole(role: string | undefined | null): boolean {
  return DIRECTION_ROLES.includes((role ?? "") as DirectionRole);
}

export function isOperationsRole(role: string | undefined | null): boolean {
  return OPERATIONS_ROLES.includes((role ?? "") as OperationsRole);
}
