import { Link, createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { withDb } from "../server/db";
import { listPublicStoresUseCase } from "../server/use-cases";

const getStoresPageData = createServerFn({ method: "GET" }).handler(
  async () => {
    return withDb(async (db) => {
      const stores = await listPublicStoresUseCase(db, { limit: 30 });
      return { stores };
    });
  },
);

export const Route = createFileRoute("/stores")({
  loader: () => getStoresPageData(),
  component: StoresPage,
});

function StoresPage() {
  const { stores } = Route.useLoaderData();

  return (
    <main className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <header className="border-b border-zinc-200 pb-5">
          <Link
            to="/"
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            トップへ戻る
          </Link>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-700">
                店舗を比較する
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
                店舗一覧
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                公開レビューをもとに、エリア・カテゴリ・評価・働いた人の声を見比べられます。
              </p>
            </div>
            <p className="text-sm text-zinc-500">{stores.length}件</p>
          </div>
        </header>

        <section className="mt-5" aria-label="店舗一覧">
          {stores.length > 0 ? (
            <div className="grid gap-3">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  to="/stores/$storeId"
                  params={{ storeId: store.id }}
                  className="block rounded border border-zinc-200 bg-white p-4 transition hover:border-sky-300 hover:bg-sky-50/40"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_180px] lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-zinc-950">
                          {store.name}
                        </h2>
                        {store.categories.map((category) => (
                          <span
                            key={category.id}
                            className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 text-sm text-zinc-600">
                        {formatArea(store.prefecture, store.city)}
                      </p>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">
                        {store.reviewExcerpt ??
                          "まだレビュー抜粋はありません。"}
                      </p>
                    </div>

                    <dl className="grid grid-cols-2 gap-2 text-sm lg:grid-cols-1">
                      <div className="rounded bg-zinc-50 px-3 py-2">
                        <dt className="text-xs text-zinc-500">平均評価</dt>
                        <dd className="mt-1 font-semibold text-zinc-950">
                          {formatRating(store.averageRating)}
                        </dd>
                      </div>
                      <div className="rounded bg-zinc-50 px-3 py-2">
                        <dt className="text-xs text-zinc-500">レビュー</dt>
                        <dd className="mt-1 font-semibold text-zinc-950">
                          {store.reviewCount}件
                        </dd>
                      </div>
                    </dl>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
              表示できる店舗がありません。`pnpm run db:seed`
              を実行してください。
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatArea(prefecture: string | null, city: string | null) {
  return [prefecture, city].filter(Boolean).join(" ") || "所在地未設定";
}

function formatRating(value: number | null) {
  return value === null ? "未評価" : `${value.toFixed(1)} / 5`;
}
