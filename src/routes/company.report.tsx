import { createFileRoute } from "@tanstack/react-router";
import { CompanyWorkspace } from "../features/company/workspace";
export const Route = createFileRoute("/company/report")({
  component: () => <CompanyWorkspace report />,
});
