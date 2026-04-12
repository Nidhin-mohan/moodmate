/**
 * Returns true if userRole is allowed to access a route.
 *
 * Role hierarchy: admin > user / therapist > public
 *   - "public" routes are always accessible.
 *   - "admin" can access any route a "user" can (they're a superset).
 *   - Explicit role match always passes.
 */
export function canAccess(userRole: string, allowed: string[]): boolean {
  if (allowed.includes("public")) return true;
  if (allowed.includes(userRole)) return true;
  // Admin inherits all user-accessible routes.
  if (userRole === "admin" && allowed.includes("user")) return true;
  return false;
}
