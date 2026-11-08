/**
 * Returns true if userRole is allowed to access a route.
 *
 * Role hierarchy: admin > user / therapist > public
 *   - "public" routes are always accessible.
 *   - "admin" and "therapist" can access any route a "user" can.
 *   - Explicit role match always passes.
 */
export function canAccess(userRole: string, allowed: string[]): boolean {
  if (allowed.includes("public")) return true;
  if (allowed.includes(userRole)) return true;
  // Admins and therapists also use the regular user pages (dashboard, mood tracking…).
  if ((userRole === "admin" || userRole === "therapist") && allowed.includes("user")) return true;
  return false;
}

export type RouteDecision = "allow" | "login" | "unauthorized";

/**
 * What the router should do for a route:
 *   - logged out on a protected route → "login" (not the 401 page)
 *   - logged in without the right role → "unauthorized"
 *
 * A logged-in session with no stored role (pre-dates the field) counts as "user".
 */
export function routeDecision(
  isLoggedIn: boolean,
  role: string | undefined,
  allowed: string[]
): RouteDecision {
  if (allowed.includes("public")) return "allow";
  if (!isLoggedIn) return "login";
  return canAccess(role ?? "user", allowed) ? "allow" : "unauthorized";
}
