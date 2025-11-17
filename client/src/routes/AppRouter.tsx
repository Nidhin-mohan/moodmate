import { Navigate, RouteObject, useRoutes } from "react-router-dom";
import { Suspense } from "react";
import routeConfig from "./routes.json";
import { componentMap } from "./componentMap";
import { canAccess } from "../auth/access";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import type { RouteConfig } from "./routeTypes";

export function AppRouter() {
  const { isLoggedIn } = useAuth();
  const userRole = isLoggedIn ? "user" : "public";

  const buildRoutes = (config: RouteConfig[]): RouteObject[] =>
    config.map((r) => {
      const PageComponent = componentMap[r.component];
      const LayoutComponent = r.layout
        ? componentMap[r.layout]
        : null;

      // PAGE ELEMENT
      const page = (
        <Suspense fallback={<div>Loading...</div>}>
          <PageComponent />
        </Suspense>
      );

      // PROTECTED WRAPPER
      const protectedPage =
        r.roles.includes("public") ? (
          page
        ) : (
          <ProtectedRoute>
            {page}
          </ProtectedRoute>
        );

      // LAYOUT WRAPPER
      const element = LayoutComponent ? (
        <Suspense fallback={<div>Loading...</div>}>
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
        children: r.children ? buildRoutes(r.children) : undefined
      };
    });

  const routes = buildRoutes(routeConfig as RouteConfig[]);

  // unauthorized route
  const UnauthorizedComponent = componentMap["Unauthorized"];
  routes.push({
    path: "/unauthorized",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <UnauthorizedComponent />
      </Suspense>
    )
  });

  return useRoutes(routes);
}
