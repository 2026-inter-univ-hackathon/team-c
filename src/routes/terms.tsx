import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "../components/coming-soon-page";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "利用規約 | バイトのホンネ" }] }),
  component: TermsPage,
});

function TermsPage() {
  return <ComingSoonPage title="利用規約" />;
}
