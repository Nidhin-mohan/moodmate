export interface RouteConfig {
  path: string;
  component: string;
  roles: string[];
  layout?: string;
  children?: RouteConfig[];
}
