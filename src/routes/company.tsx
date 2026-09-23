import {
  createFileRoute,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { CompanyWorkspace } from "../features/company/workspace";
export const Route = createFileRoute("/company")({ component: Company });
function Company() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return path.startsWith("/company/") ? <Outlet /> : <CompanyWorkspace />;
}
