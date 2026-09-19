import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "../components/coming-soon-page";

export const Route = createFileRoute("/operator")({
  head: () => ({ meta: [{ title: "運営者情報 | バイトのホンネ" }] }),
  component: OperatorPage,
});

function OperatorPage() {
  return <ComingSoonPage title="運営者情報" />;
}
