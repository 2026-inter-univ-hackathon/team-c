import { Link, createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { withDb } from "../server/db";
import {
  getPublicStoreDetailUseCase,
  listPublicStoreReviewsUseCase,
} from "../server/use-cases";

const storeDetailInputSchema = z.object({
  storeId: z.uuid(),
});

const getStoreDetailPageData = createServerFn({ method: "GET" })
  .validator((data: unknown) => storeDetailInputSchema.parse(data))
  .handler(async ({ data }) => {
    return withDb(async (db) => {
      const store = await getPublicStoreDetailUseCase(db, {
        storeId: data.storeId,
      });
      const reviews = store
        ? await listPublicStoreReviewsUseCase(db, {
            storeId: data.storeId,
            limit: 20,
          })
        : [];

      return {
        store,
        reviews: reviews.map((review) => ({
          ...review,
          publishedAt: review.publishedAt.toISOString(),
        })),
      };
    });
  });

export const Route = createFileRoute("/stores/$storeId")({
  // URLのIDが壊れている場合はサーバーに問い合わせず、「見つかりません」を出す。
  // サーバー側の検証は残したまま、500ではなく通常の画面を返すため。
  loader: ({ params }) => {
    const parsed = storeDetailInputSchema.safeParse(params);

    if (!parsed.success) {
      return { store: null, reviews: [] };
    }

    return getStoreDetailPageData({ data: parsed.data });
  },
  component: StoreDetailPage,
});

function StoreDetailPage() {
  const { store, reviews } = Route.useLoaderData();

  if (!store) {
    return (
      <main className="min-h-dvh bg-zinc-50 text-zinc-950">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
          <Link
            to="/stores"
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            店舗一覧へ戻る
          </Link>
          <div className="mt-5 rounded border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
            店舗が見つかりませんでした。
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <Link
          to="/stores"
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          店舗一覧へ戻る
        </Link>

        <header className="mt-4 border-b border-zinc-200 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-zinc-500">
                {store.postalCode ?? "郵便番号未設定"}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
                {store.name}
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                {[store.prefecture, store.city, store.address]
                  .filter(Boolean)
                  .join(" ") || "住所未設定"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {store.categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>

            <dl className="grid min-w-[220px] grid-cols-2 gap-2 text-sm">
              <div className="rounded bg-white px-3 py-2">
                <dt className="text-xs text-zinc-500">平均評価</dt>
                <dd className="mt-1 font-semibold text-zinc-950">
                  {formatRating(store.averageRating)}
                </dd>
              </div>
              <div className="rounded bg-white px-3 py-2">
                <dt className="text-xs text-zinc-500">レビュー</dt>
                <dd className="mt-1 font-semibold text-zinc-950">
                  {store.reviewCount}件
                </dd>
              </div>
            </dl>
          </div>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr] lg:items-start">
          <aside className="rounded border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-950">評価サマリー</p>
            <dl className="mt-3 grid gap-2">
              {store.ratingSummary.map((rating) => (
                <div
                  key={rating.dimensionCode}
                  className="flex items-center justify-between gap-3 rounded bg-zinc-50 px-3 py-2 text-sm"
                >
                  <dt className="text-zinc-600">{rating.dimensionLabel}</dt>
                  <dd className="font-semibold text-zinc-950">
                    {formatRating(rating.averageScore)}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>

          <section className="min-w-0">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-sky-700">
                  公開レビュー
                </p>
                <h2 className="mt-1 text-xl font-semibold">働いた人の声</h2>
              </div>
              <p className="text-sm text-zinc-500">{reviews.length}件表示</p>
            </div>

            <div className="mt-3 grid gap-3">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-950">
                          {review.publicAuthorLabel}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {formatEmployment(
                            review.employmentStartYear,
                            review.employmentEndYear,
                            review.employmentStatus,
                          )}
                        </p>
                      </div>
                      <time className="text-xs text-zinc-500">
                        {formatDate(review.publishedAt)}
                      </time>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-zinc-800">
                      {review.summary}
                    </p>

                    <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      {review.ratings.map((rating) => (
                        <div
                          key={rating.dimensionCode}
                          className="flex items-center justify-between gap-3 rounded bg-zinc-50 px-3 py-2"
                        >
                          <dt className="text-zinc-600">
                            {rating.dimensionLabel}
                          </dt>
                          <dd className="font-semibold">{rating.score}/5</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-4 grid gap-3">
                      {review.answers.map((answer) => (
                        <section key={answer.questionCode}>
                          <h3 className="text-xs font-semibold text-zinc-500">
                            {answer.questionLabel}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-zinc-800">
                            {answer.answerText}
                          </p>
                        </section>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
                  この店舗の公開レビューはまだありません。
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatRating(value: number | null) {
  return value === null ? "未評価" : `${value.toFixed(1)} / 5`;
}

function formatEmployment(
  startYear: number,
  endYear: number | null,
  status: "CURRENT" | "FORMER",
) {
  if (status === "CURRENT") {
    return `${startYear}年から勤務中`;
  }

  return endYear
    ? `${startYear}年〜${endYear}年に勤務`
    : `${startYear}年から勤務`;
}
