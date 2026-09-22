import { useState } from "react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Button } from "../components/button";
import { ReviewCard } from "../features/stores/review-card";
import {
  GUIDELINE_VERSION,
  employmentStatuses,
  occupations,
  workDurations,
  atmosphereTags,
  staffTags,
  managerPresences,
  recommendations,
  ratingCodes,
  labels,
  createReviewInputSchema,
  type CreateReviewInput,
} from "../schemas/review-flow";
import { withDb } from "../server/db";
import { isDevReviewPostingEnabled } from "../server/dev-review-access";
import { DuplicateReviewError } from "../server/errors";
import {
  createReviewUseCase,
  getPublicStoreDetailUseCase,
} from "../server/use-cases";

const storeIdSchema = z.object({ storeId: z.uuid() });
const titles = [
  "属性入力",
  "職場の特徴",
  "働きやすさの評価",
  "生の声",
  "公開プレビュー・同意",
] as const;
type Draft = Omit<
  CreateReviewInput,
  | "storeId"
  | "employmentStatus"
  | "occupation"
  | "workDuration"
  | "managerPresence"
  | "recommendation"
  | "agreed"
  | "ratings"
> & {
  employmentStatus: CreateReviewInput["employmentStatus"] | "";
  occupation: CreateReviewInput["occupation"] | "";
  workDuration: CreateReviewInput["workDuration"] | "";
  managerPresence: CreateReviewInput["managerPresence"] | "";
  recommendation: CreateReviewInput["recommendation"] | "";
  ratings: Partial<CreateReviewInput["ratings"]>;
  agreed: boolean;
};
const initialDraft: Draft = {
  employmentStatus: "",
  occupation: "",
  workDuration: "",
  atmosphereTags: [],
  staffTags: [],
  managerPresence: "",
  ratings: {},
  recommendation: "",
  summary: "",
  agreed: false,
  guidelineVersion: GUIDELINE_VERSION,
};

const getPage = createServerFn({ method: "GET" })
  .validator((input: unknown) => storeIdSchema.parse(input))
  .handler(async ({ data }) => {
    const store = await withDb((db) =>
      getPublicStoreDetailUseCase(db, { storeId: data.storeId }),
    );
    return {
      store: store ? { id: store.id, name: store.name } : null,
      enabled: isDevReviewPostingEnabled(process.env),
    };
  });

const submitReview = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    if (!isDevReviewPostingEnabled(process.env)) {
      return {
        ok: false as const,
        issues: [{ path: "", message: "投稿は開発環境でのみ利用できます" }],
      };
    }
    try {
      return await withDb((db) => createReviewUseCase(db, data));
    } catch (error) {
      if (error instanceof DuplicateReviewError) {
        return {
          ok: false as const,
          issues: [
            {
              path: "",
              message:
                "この店舗にはすでに投稿しています。開発用リセット後に再試行してください。",
            },
          ],
        };
      }
      console.error("review_create_failed");
      return {
        ok: false as const,
        issues: [
          {
            path: "",
            message: "投稿できませんでした。時間をおいて再試行してください。",
          },
        ],
      };
    }
  });

export const Route = createFileRoute("/stores/$storeId/reviews/new")({
  loader: ({ params }) => {
    const parsed = storeIdSchema.safeParse(params);
    return parsed.success
      ? getPage({ data: parsed.data })
      : { store: null, enabled: false };
  },
  component: ReviewPage,
});

function ToggleGroup<T extends string>({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: readonly T[];
  selected: T | "";
  onSelect: (value: T) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="font-semibold text-stone-800">
        {label} <span className="text-orange-700">必須</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={selected === value}
            onClick={() => onSelect(value)}
            className={`min-h-11 rounded-xl border px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-orange-600 ${selected === value ? "border-orange-600 bg-orange-600 text-white" : "border-stone-300 bg-white text-stone-800"}`}
          >
            {value}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ReviewPage() {
  const { store, enabled } = Route.useLoaderData();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [issues, setIssues] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  if (!store)
    return (
      <main id="main" className="container page-section">
        店舗が見つかりませんでした。
      </main>
    );
  if (!enabled)
    return (
      <main id="main" className="container page-section">
        <h1>口コミ投稿</h1>
        <p>現在、投稿は開発環境でのみ利用できます。</p>
        <Link
          to="/stores/$storeId"
          params={{ storeId: store.id }}
          search={{ page: 1 }}
        >
          店舗へ戻る
        </Link>
      </main>
    );

  const storeId = store.id;
  function patch(value: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...value }));
  }
  function toggle<K extends "atmosphereTags" | "staffTags">(
    key: K,
    value: Draft[K][number],
  ) {
    const current = draft[key] as string[];
    if (current.includes(value))
      patch({
        [key]: current.filter((item) => item !== value),
      } as Partial<Draft>);
    else if (current.length < 2)
      patch({ [key]: [...current, value] } as Partial<Draft>);
  }
  function validateStep() {
    if (
      step === 0 &&
      (!draft.employmentStatus || !draft.occupation || !draft.workDuration)
    )
      return ["3項目すべて選択してください"];
    if (
      step === 1 &&
      (!draft.atmosphereTags.length ||
        !draft.staffTags.length ||
        !draft.managerPresence)
    )
      return ["雰囲気・スタッフ層を1〜2つと、店長の関与度を選んでください"];
    if (
      step === 2 &&
      (ratingCodes.some((code) => !draft.ratings[code]) ||
        !draft.recommendation)
    )
      return ["4つの評価とおすすめ度を選んでください"];
    if (
      step === 3 &&
      (Array.from(draft.summary.trim()).length < 30 ||
        Array.from(draft.summary.trim()).length > 300)
    )
      return ["30〜300文字で入力してください"];
    if (step === 4 && !draft.agreed) return ["ガイドラインへの同意が必要です"];
    return [];
  }
  function next() {
    const errors = validateStep();
    setIssues(errors);
    if (!errors.length) setStep((value) => value + 1);
  }
  async function submit() {
    const errors = validateStep();
    setIssues(errors);
    if (errors.length) return;
    const input = createReviewInputSchema.safeParse({ ...draft, storeId });
    if (!input.success) {
      setIssues(input.error.issues.map((issue) => issue.message));
      return;
    }
    setBusy(true);
    try {
      const result = await submitReview({ data: input.data });
      if (!result.ok) {
        setIssues(result.issues.map((issue) => issue.message));
        return;
      }
      await router.invalidate();
      await router.navigate({
        to: "/stores/$storeId",
        params: { storeId },
        search: { page: 1 },
      });
    } finally {
      setBusy(false);
    }
  }
  const readyForPreview = createReviewInputSchema.safeParse({
    ...draft,
    storeId,
    agreed: true,
  });
  return (
    <main id="main" className="min-h-dvh bg-orange-50 px-4 py-8 text-stone-900">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/stores/$storeId"
          params={{ storeId: store.id }}
          search={{ page: 1 }}
          className="text-sm text-orange-700"
        >
          ← {store.name}へ戻る
        </Link>
        <div className="mt-5 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm text-stone-500">
            {store.name}への口コミ / {step + 1} of 5
          </p>
          <h1 className="mt-2 text-2xl font-bold">{titles[step]}</h1>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-orange-100"
            aria-hidden="true"
          >
            <div
              className="h-full bg-orange-600"
              style={{ width: `${((step + 1) / 5) * 100}%` }}
            />
          </div>
          {issues.length > 0 && (
            <ul
              role="alert"
              className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              {issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          )}
          <div className="mt-7 grid gap-6">
            {step === 0 && (
              <>
                <ToggleGroup
                  label="在籍状況"
                  values={employmentStatuses.map(
                    (v) => labels.employmentStatus[v],
                  )}
                  selected={
                    draft.employmentStatus
                      ? labels.employmentStatus[draft.employmentStatus]
                      : ""
                  }
                  onSelect={(label) =>
                    patch({
                      employmentStatus: employmentStatuses.find(
                        (v) => labels.employmentStatus[v] === label,
                      )!,
                    })
                  }
                />
                <ToggleGroup
                  label="働いていたときの立場"
                  values={occupations.map((v) => labels.occupation[v])}
                  selected={
                    draft.occupation ? labels.occupation[draft.occupation] : ""
                  }
                  onSelect={(label) =>
                    patch({
                      occupation: occupations.find(
                        (v) => labels.occupation[v] === label,
                      )!,
                    })
                  }
                />
                <ToggleGroup
                  label="勤務期間"
                  values={workDurations.map((v) => labels.workDuration[v])}
                  selected={
                    draft.workDuration
                      ? labels.workDuration[draft.workDuration]
                      : ""
                  }
                  onSelect={(label) =>
                    patch({
                      workDuration: workDurations.find(
                        (v) => labels.workDuration[v] === label,
                      )!,
                    })
                  }
                />
              </>
            )}
            {step === 1 && (
              <>
                <fieldset>
                  <legend className="font-semibold">
                    職場の雰囲気に近いものは？{" "}
                    <span className="text-orange-700">必須</span>
                  </legend>
                  <p className="text-sm text-stone-500">
                    近いものを1〜2つ選んでください
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {atmosphereTags.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        aria-pressed={draft.atmosphereTags.includes(tag)}
                        onClick={() => toggle("atmosphereTags", tag)}
                        className={`min-h-11 rounded-full border px-4 py-2 ${draft.atmosphereTags.includes(tag) ? "bg-orange-600 text-white" : "bg-white"}`}
                      >
                        {labels.atmosphere[tag]}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="font-semibold">
                    一緒に働いていたスタッフはどんな層が中心でしたか？{" "}
                    <span className="text-orange-700">必須</span>
                  </legend>
                  <p className="text-sm text-stone-500">1〜2つ選択</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {staffTags.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        aria-pressed={draft.staffTags.includes(tag)}
                        onClick={() => toggle("staffTags", tag)}
                        className={`min-h-11 rounded-full border px-4 py-2 ${draft.staffTags.includes(tag) ? "bg-orange-600 text-white" : "bg-white"}`}
                      >
                        {labels.staff[tag]}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <ToggleGroup
                  label="店長の関与度"
                  values={managerPresences.map((v) => labels.manager[v])}
                  selected={
                    draft.managerPresence
                      ? labels.manager[draft.managerPresence]
                      : ""
                  }
                  onSelect={(label) =>
                    patch({
                      managerPresence: managerPresences.find(
                        (v) => labels.manager[v] === label,
                      )!,
                    })
                  }
                />
              </>
            )}
            {step === 2 && (
              <>
                {ratingCodes.map((code) => (
                  <fieldset key={code}>
                    <legend className="font-semibold">
                      {labels.rating[code]}{" "}
                      <span className="text-orange-700">必須</span>
                    </legend>
                    <p className="text-xs text-stone-500">
                      {code === "atmosphere"
                        ? "1 ギスギス / 5 アットホーム・風通し良"
                        : code === "training"
                          ? "1 放置気味 / 5 手厚いフォロー"
                          : code === "workload"
                            ? "1 息つく暇なし / 5 落ち着いて作業できる"
                            : "1 変更が難しい / 5 予定に柔軟"}
                    </p>
                    <div className="mt-2 flex gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          type="button"
                          key={score}
                          aria-label={`${labels.rating[code]} ${score}点`}
                          aria-pressed={draft.ratings[code] === score}
                          onClick={() =>
                            patch({
                              ratings: { ...draft.ratings, [code]: score },
                            })
                          }
                          className={`min-h-11 min-w-11 rounded-lg border ${draft.ratings[code] === score ? "bg-orange-600 text-white" : "bg-white"}`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <ToggleGroup
                  label="おすすめ度"
                  values={recommendations.map((v) => labels.recommendation[v])}
                  selected={
                    draft.recommendation
                      ? labels.recommendation[draft.recommendation]
                      : ""
                  }
                  onSelect={(label) =>
                    patch({
                      recommendation: recommendations.find(
                        (v) => labels.recommendation[v] === label,
                      )!,
                    })
                  }
                />
              </>
            )}
            {step === 3 && (
              <label className="block font-semibold">
                応募前の自分にアドバイスするなら？{" "}
                <span className="text-orange-700">必須</span>
                <textarea
                  value={draft.summary}
                  onChange={(event) => patch({ summary: event.target.value })}
                  rows={6}
                  className="mt-2 w-full rounded-lg border border-stone-300 p-3 font-normal"
                  placeholder="例：ピーク時はレジと仕込みが重なりバタバタしますが、ミスをしても先輩がすぐにカバーしてくれました。テスト期間の休みも1ヶ月前なら問題なく通ります。"
                />
                <span className="block text-right text-xs text-stone-500">
                  {Array.from(draft.summary.trim()).length} / 30〜300文字
                </span>
              </label>
            )}
            {step === 4 && (
              <>
                <p className="text-sm text-stone-600">
                  ほかのユーザーや店舗に公開される内容を確認してください。属性や本文の組み合わせから身元が推測される可能性があります。
                </p>
                {readyForPreview.success && (
                  <ReviewCard review={readyForPreview.data} preview />
                )}
                <label className="flex gap-3 rounded-lg border border-orange-200 p-4 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.agreed}
                    onChange={(event) =>
                      patch({ agreed: event.target.checked })
                    }
                  />
                  <span>
                    <Link
                      to="/guidelines"
                      className="text-orange-700 underline"
                    >
                      投稿ガイドライン（版{GUIDELINE_VERSION}）
                    </Link>
                    を確認し、誹謗中傷・個人攻撃・実名記載を行っていないことに同意します。
                  </span>
                </label>
              </>
            )}
          </div>
          <div className="mt-8 flex justify-between border-t border-orange-100 pt-5">
            <Button
              variant="secondary"
              disabled={step === 0 || busy}
              onClick={() => {
                setIssues([]);
                setStep(step - 1);
              }}
            >
              戻る
            </Button>
            {step < 4 ? (
              <Button onClick={next}>次へ</Button>
            ) : (
              <Button disabled={busy} onClick={submit}>
                {busy ? "投稿中..." : "投稿する"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
