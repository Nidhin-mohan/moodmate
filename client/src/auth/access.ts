export function canAccess(userRole: string, allowed: string[]) {
  if (allowed.includes("public")) return true;
  return allowed.includes(userRole);
}
