import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "../components/coming-soon-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "プライバシーポリシー | バイトのホンネ" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <ComingSoonPage title="プライバシーポリシー" />;
}
