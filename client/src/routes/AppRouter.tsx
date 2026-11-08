import { Navigate, RouteObject, useRoutes } from "react-router-dom";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import routeConfig from "./routes.json";
import { componentMap } from "./componentMap";
import { routeDecision } from "../auth/access";
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

  const guard = (allowed: string[], element: JSX.Element) => {
    switch (routeDecision(isLoggedIn, user?.role, allowed)) {
      case "allow":
        return element;
      case "login":
        return <Navigate to="/login" replace />;
      case "unauthorized":
        return <Navigate to="/unauthorized" replace />;
    }
  };

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
        element: guard(r.roles, element),
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
