import { createFileRoute } from "@tanstack/react-router";
import { appInfo } from "../lib/app-info";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="min-h-dvh bg-stone-50 text-zinc-950">
      <section className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-5 py-12">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="text-sm font-semibold text-sky-700">
              {appInfo.stage}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal sm:text-5xl">
              {appInfo.name}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-700">
              働く人の声から、自分に合うアルバイト先を選ぶための口コミWebアプリです。
              まずは実装基盤を固め、設計書に沿って安全に機能を増やしていきます。
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">実装基盤</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              {appInfo.stack.map((item) => (
                <div key={item.label} className="flex justify-between gap-4">
                  <dt className="text-zinc-500">{item.label}</dt>
                  <dd className="font-medium text-zinc-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
