import type { ReactNode } from "react";
import type { UserRole } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";

interface RoleGuardProps {
  role: UserRole;
  children: ReactNode;
}

/**
 * Renders children only when the logged-in user's role matches.
 * Use this inside pages/components to conditionally show UI elements.
 * Route-level access is handled separately by canAccess() in AppRouter.
 *
 * @example
 * <RoleGuard role="admin">
 *   <Link to="/admin/users">Admin</Link>
 * </RoleGuard>
 */
const RoleGuard = ({ role, children }: RoleGuardProps) => {
  const { user } = useAuth();
  return user?.role === role ? <>{children}</> : null;
};

export default RoleGuard;
