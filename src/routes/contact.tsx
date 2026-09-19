import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "../components/coming-soon-page";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [{ title: "お問い合わせ・削除依頼 | バイトのホンネ" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return <ComingSoonPage title="お問い合わせ・削除依頼" />;
}
