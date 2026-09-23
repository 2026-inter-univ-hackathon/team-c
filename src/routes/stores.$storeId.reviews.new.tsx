import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Button } from "../components/button";
import { ReviewCard } from "../features/stores/review-card";
import {
  containsForbiddenWord,
  FORBIDDEN_WORD_MESSAGE,
} from "../lib/forbidden-words";
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
import { detailedAuthorAttributes } from "../lib/review-visibility";
import { isDevReviewPostingEnabled } from "../server/dev-review-access";
import { DuplicateReviewError } from "../server/errors";
import {
  createReviewUseCase,
  getPublicStoreDetailUseCase,
} from "../server/use-cases";

const storeIdSchema = z.object({ storeId: z.uuid() });
const ratingEnds = {
  atmosphere: ["ギスギス", "アットホーム・風通し良"],
  training: ["放置気味", "手厚いフォロー"],
  workload: ["息つく暇なし", "落ち着いて作業できる"],
  flexibility: ["変更が難しい", "予定に柔軟"],
} as const;
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

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="review-field-label">
      <span>{children}</span>
      <span className="review-required">必須</span>
    </span>
  );
}

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
    <fieldset className="review-field">
      <legend className="w-full font-semibold text-stone-800">
        <RequiredLabel>{label}</RequiredLabel>
      </legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={selected === value}
            onClick={() => onSelect(value)}
            className="review-choice"
          >
            {value}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const consentRules = [
  {
    title: "実体験に基づく投稿",
    body: "ご自身が実際に働いた店舗での体験談のみを投稿してください（噂話や客目線の投稿は禁止です）。",
  },
  {
    title: "個人名の記載禁止",
    body: "店長やスタッフ個人を特定・誹謗中傷する表現、個人名の記載は固く禁じます。",
  },
  {
    title: "秘密情報の保持",
    body: "業務マニュアルや社外秘情報、インサイダーに該当する内容は投稿しないでください。",
  },
  {
    title: "データの取り扱い",
    body: "投稿内容は匿名で公開・分析データとして活用されますが、規約違反や法的要請があった場合は削除や情報開示を行う場合があります。",
  },
] as const;

function ConsentModal({
  onAgree,
  onCancel,
}: {
  onAgree: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="review-consent fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 text-stone-900 backdrop:bg-stone-900/60 open:flex"
      aria-labelledby="consent-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="review-consent-panel">
        <h2 id="consent-modal-title" className="text-xl font-bold">
          利用規約およびプライバシーポリシーへの同意
        </h2>
        <p className="mt-3 text-sm text-stone-600">
          当サービスを安心・安全にご利用いただくため、以下のルールを必ずお守りください。
        </p>
        <ul className="mt-4 grid gap-3 text-sm text-stone-700">
          {consentRules.map((rule) => (
            <li key={rule.title} className="review-consent-rule">
              <strong className="block text-stone-900">{rule.title}</strong>
              {rule.body}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-stone-600">
          詳細な内容については、必ず{" "}
          <Link to="/terms" target="_blank" className="consent-policy-link">
            利用規約全文
          </Link>{" "}
          および{" "}
          <Link to="/privacy" target="_blank" className="consent-policy-link">
            プライバシーポリシー
          </Link>{" "}
          をご確認ください。
        </p>
        <label className="mt-5 flex items-start gap-3 rounded-lg border border-orange-200 p-4 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-0.5"
          />
          <span>利用規約とプライバシーポリシーに同意する</span>
        </label>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            キャンセル
          </Button>
          <Button
            disabled={!checked}
            onClick={() => {
              ref.current?.close();
              onAgree();
            }}
          >
            同意して始める
          </Button>
        </div>
      </div>
    </dialog>
  );
}

function ReviewPage() {
  const { store, enabled } = Route.useLoaderData();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [issues, setIssues] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
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
    if (step === 3) {
      const errors: string[] = [];
      const length = Array.from(draft.summary.trim()).length;
      if (length < 30 || length > 300)
        errors.push("30〜300文字で入力してください");
      if (containsForbiddenWord(draft.summary))
        errors.push(FORBIDDEN_WORD_MESSAGE);
      if (errors.length) return errors;
    }
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
    const input = createReviewInputSchema.safeParse({
      ...draft,
      storeId,
      agreed: agreedToPolicy,
    });
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
    <main id="main" className="review-page">
      {!agreedToPolicy && (
        <ConsentModal
          onAgree={() => setAgreedToPolicy(true)}
          onCancel={() => {
            void router.navigate({
              to: "/stores/$storeId",
              params: { storeId },
              search: { page: 1 },
            });
          }}
        />
      )}
      <div className="mx-auto max-w-2xl" inert={!agreedToPolicy}>
        <Link
          to="/stores/$storeId"
          params={{ storeId: store.id }}
          search={{ page: 1 }}
          className="review-back-link"
        >
          ← {store.name}へ戻る
        </Link>
        <div className="review-form-card">
          <div className="review-step-meta">
            <p>{store.name}への口コミ</p>
            <span>
              STEP {step + 1} / {titles.length}
            </span>
          </div>
          <h1 className="review-form-title">{titles[step]}</h1>
          <p className="review-step-description">
            {step === 2
              ? "バーを動かして、あなたの実感に近い評価を選んでください。"
              : step === 4
                ? "公開される内容を確認して、投稿を完了しましょう。"
                : "あなたの経験に近いものを教えてください。"}
          </p>
          <div className="review-progress" aria-hidden="true">
            <div
              className="review-progress-fill"
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
          <div className="review-fields">
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
                <fieldset className="review-field">
                  <legend className="w-full font-semibold">
                    <RequiredLabel>職場の雰囲気に近いものは？</RequiredLabel>
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
                        className="review-choice"
                      >
                        {labels.atmosphere[tag]}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="review-field">
                  <legend className="w-full font-semibold">
                    <RequiredLabel>
                      一緒に働いていたスタッフはどんな層が中心でしたか？
                    </RequiredLabel>
                  </legend>
                  <p className="text-sm text-stone-500">1〜2つ選択</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {staffTags.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        aria-pressed={draft.staffTags.includes(tag)}
                        onClick={() => toggle("staffTags", tag)}
                        className="review-choice"
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
                  <fieldset key={code} className="review-field review-rating">
                    <legend className="w-full font-semibold">
                      <RequiredLabel>{labels.rating[code]}</RequiredLabel>
                    </legend>
                    <div
                      className="review-rating-control"
                      data-selected={draft.ratings[code] !== undefined}
                    >
                      <p
                        id={`rating-status-${code}`}
                        className="review-rating-score"
                      >
                        {draft.ratings[code] === undefined ? (
                          "未選択"
                        ) : (
                          <>
                            <strong>{draft.ratings[code]}</strong>
                            <span> / 5</span>
                          </>
                        )}
                      </p>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={draft.ratings[code] ?? 3}
                        aria-label={labels.rating[code]}
                        aria-describedby={`rating-status-${code} rating-ends-${code}`}
                        aria-valuetext={
                          draft.ratings[code] === undefined
                            ? "未選択"
                            : `${draft.ratings[code]}点（5点満点）`
                        }
                        onChange={(event) =>
                          patch({
                            ratings: {
                              ...draft.ratings,
                              [code]: Number(event.target.value),
                            },
                          })
                        }
                        onPointerUp={(event) =>
                          patch({
                            ratings: {
                              ...draft.ratings,
                              [code]: Number(event.currentTarget.value),
                            },
                          })
                        }
                        onKeyUp={(event) => {
                          if (
                            [
                              "ArrowLeft",
                              "ArrowRight",
                              "ArrowUp",
                              "ArrowDown",
                              "Home",
                              "End",
                              " ",
                              "Enter",
                            ].includes(event.key)
                          ) {
                            patch({
                              ratings: {
                                ...draft.ratings,
                                [code]: Number(event.currentTarget.value),
                              },
                            });
                          }
                        }}
                        className="review-rating-slider"
                      />
                      <div aria-hidden="true" className="review-rating-ticks">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <span
                            key={score}
                            data-active={draft.ratings[code] === score}
                          >
                            {score}
                          </span>
                        ))}
                      </div>
                      <div
                        id={`rating-ends-${code}`}
                        className="review-rating-ends"
                      >
                        <span>
                          <span className="sr-only">1点：</span>
                          {ratingEnds[code][0]}
                        </span>
                        <span>
                          <span className="sr-only">5点：</span>
                          {ratingEnds[code][1]}
                        </span>
                      </div>
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
                <RequiredLabel>
                  応募前の自分にアドバイスするなら？
                </RequiredLabel>
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
                {containsForbiddenWord(draft.summary) && (
                  <span className="mt-1 block text-sm text-red-800">
                    {FORBIDDEN_WORD_MESSAGE}
                  </span>
                )}
              </label>
            )}
            {step === 4 && (
              <>
                <p className="text-sm text-stone-600">
                  ほかのユーザーや店舗に公開される内容を確認してください。このプレビューでは、口コミが5件集まった後の詳細な属性表示を確認できます。5件未満の間は、職業と在籍状況を大まかに表示し、勤務期間は非表示になります。本文・評価・タグは件数にかかわらず公開されるため、組み合わせから身元が推測されない内容にしてください。
                </p>
                {readyForPreview.success && (
                  <ReviewCard
                    review={{
                      ...readyForPreview.data,
                      author: detailedAuthorAttributes(readyForPreview.data),
                    }}
                    preview
                  />
                )}
                <p className="text-sm text-stone-600">
                  ※
                  投稿内容に個人名や誹謗中傷が含まれていないことをご確認の上、投稿してください。
                </p>
              </>
            )}
          </div>
          <div className="review-form-actions">
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
