import { Navigate, RouteObject, useRoutes } from "react-router-dom";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import routeConfig from "./routes.json";
import { componentMap } from "./componentMap";
import { canAccess } from "../auth/access";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import type { RouteConfig } from "./routeTypes";

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="animate-spin text-primary" size={32} />
  </div>
);

export function AppRouter() {
  const { isLoggedIn, user } = useAuth();
  // Use the actual stored role so admin/therapist routes resolve correctly.
  // Falls back to "user" for logged-in sessions that predate the role field.
  const userRole = isLoggedIn ? (user?.role ?? "user") : "public";

  const buildRoutes = (config: RouteConfig[]): RouteObject[] =>
    config.map((r) => {
      const PageComponent = componentMap[r.component];
      const LayoutComponent = r.layout ? componentMap[r.layout] : null;

      const page = (
        <Suspense fallback={<PageLoader />}>
          <PageComponent />
        </Suspense>
      );

      const protectedPage = r.roles.includes("public") ? (
        page
      ) : (
        <ProtectedRoute>{page}</ProtectedRoute>
      );

      const element = LayoutComponent ? (
        <Suspense fallback={<PageLoader />}>
          <LayoutComponent>{protectedPage}</LayoutComponent>
        </Suspense>
      ) : (
        protectedPage
      );

      return {
        path: r.path,
        element: canAccess(userRole, r.roles)
          ? element
          : <Navigate to="/unauthorized" replace />,
        children: r.children ? buildRoutes(r.children) : undefined,
      };
    });

  const routes = buildRoutes(routeConfig as RouteConfig[]);

  const UnauthorizedComponent = componentMap["Unauthorized"];
  routes.push({
    path: "/unauthorized",
    element: (
      <Suspense fallback={<PageLoader />}>
        <UnauthorizedComponent />
      </Suspense>
    ),
  });

  return useRoutes(routes);
}
