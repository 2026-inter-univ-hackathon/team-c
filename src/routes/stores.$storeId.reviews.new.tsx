import { useState } from "react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Button } from "../components/button";
import { defaultSearch } from "../schemas/store-search";
import { withDb } from "../server/db";
import { DuplicateReviewError } from "../server/errors";
import {
  createReviewUseCase,
  getPublicStoreDetailUseCase,
} from "../server/use-cases";
import {
  getPublishedReviewForm,
  listTestUsers,
  type PublishedReviewForm,
  type TestUser,
} from "../server/repositories";

const storeIdInputSchema = z.object({ storeId: z.uuid() });

const SCORE_CHOICES = [1, 2, 3, 4, 5] as const;
const STEP_TITLES = [
  "勤務情報",
  "5段階評価",
  "働いた人にしか分からないこと",
  "総合コメント",
  "確認",
] as const;
const LAST_INPUT_STEP = STEP_TITLES.length - 1;

const getNewReviewPageData = createServerFn({ method: "GET" })
  .validator((data: unknown) => storeIdInputSchema.parse(data))
  .handler(async ({ data }) => {
    return withDb(async (db) => {
      const store = await getPublicStoreDetailUseCase(db, {
        storeId: data.storeId,
      });

      if (!store) {
        return { store: null, form: null, testUsers: [] };
      }

      const [form, testUsers] = await Promise.all([
        getPublishedReviewForm(db),
        listTestUsers(db),
      ]);

      return { store: { id: store.id, name: store.name }, form, testUsers };
    });
  });

const submitReview = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    try {
      return await withDb((db) => createReviewUseCase(db, data as never));
    } catch (error) {
      if (error instanceof DuplicateReviewError) {
        return {
          ok: false as const,
          issues: [
            {
              path: "userId",
              message:
                "このテストユーザーは、すでにこの店舗へレビューを投稿しています。別のユーザーを選んでください。",
            },
          ],
        };
      }

      throw error;
    }
  });

export const Route = createFileRoute("/stores/$storeId/reviews/new")({
  loader: ({ params }) => {
    const parsed = storeIdInputSchema.safeParse(params);

    if (!parsed.success) {
      return { store: null, form: null, testUsers: [] };
    }

    return getNewReviewPageData({ data: parsed.data });
  },
  component: NewReviewPage,
});

type FormState = {
  userId: string;
  employmentStatus: "CURRENT" | "FORMER";
  employmentStartYear: string;
  employmentEndYear: string;
  publicAuthorLabel: string;
  summary: string;
  answers: Record<string, string>;
  ratings: Record<string, number>;
};

function NewReviewPage() {
  const { store, form, testUsers } = Route.useLoaderData();

  if (!store || !form) {
    return (
      <Shell>
        <div className="rounded border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
          {store
            ? "公開中の投稿フォームがありません。`pnpm run db:seed` を実行してください。"
            : "店舗が見つかりませんでした。"}
        </div>
      </Shell>
    );
  }

  return <ReviewForm store={store} form={form} testUsers={testUsers} />;
}

function ReviewForm({
  store,
  form,
  testUsers,
}: {
  store: { id: string; name: string };
  form: PublishedReviewForm;
  testUsers: TestUser[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [issues, setIssues] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<FormState>({
    userId: testUsers[0]?.id ?? "",
    employmentStatus: "CURRENT",
    employmentStartYear: String(new Date().getFullYear()),
    employmentEndYear: "",
    publicAuthorLabel: "経験者",
    summary: "",
    answers: {},
    ratings: {},
  });

  function update(patch: Partial<FormState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function goNext() {
    const stepIssues = validateStep(step, state, form);
    setIssues(stepIssues);

    if (stepIssues.length === 0) {
      setStep((current) => Math.min(current + 1, LAST_INPUT_STEP));
    }
  }

  function goBack() {
    setIssues([]);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function submit() {
    setIsSubmitting(true);
    setIssues([]);

    try {
      const result = await submitReview({
        data: {
          storeId: store.id,
          userId: state.userId,
          employmentStatus: state.employmentStatus,
          employmentStartYear: state.employmentStartYear,
          employmentEndYear:
            state.employmentStatus === "CURRENT" ? "" : state.employmentEndYear,
          publicAuthorLabel: state.publicAuthorLabel,
          summary: state.summary,
          answers: state.answers,
          ratings: state.ratings,
        },
      });

      if (!result.ok) {
        setIssues(result.issues.map((issue) => issue.message));
        return;
      }

      // 一覧と詳細の集計を取り直したいので、loaderを再実行してから遷移する。
      await router.invalidate();
      await router.navigate({
        to: "/stores/$storeId",
        params: { storeId: store.id },
        search: { page: 1 },
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Shell>
      <div className="rounded border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <p className="text-sm text-zinc-500">{store.name}へのレビュー</p>
          <div className="mt-2 flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">{STEP_TITLES[step]}</h1>
            <p className="text-sm font-medium text-zinc-500">
              {step + 1} / {STEP_TITLES.length}
            </p>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded bg-zinc-100">
            <div
              className="h-full bg-sky-600 transition-all"
              style={{
                width: `${((step + 1) / STEP_TITLES.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {issues.length > 0 && (
          <ul className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-800">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        )}

        <div className="px-5 py-5">
          {step === 0 && (
            <EmploymentStep
              state={state}
              testUsers={testUsers}
              onChange={update}
            />
          )}
          {step === 1 && (
            <RatingStep form={form} state={state} onChange={update} />
          )}
          {step === 2 && (
            <QuestionStep form={form} state={state} onChange={update} />
          )}
          {step === 3 && <SummaryStep state={state} onChange={update} />}
          {step === 4 && <ConfirmStep form={form} state={state} />}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4">
          <Button
            variant="secondary"
            onClick={goBack}
            disabled={step === 0 || isSubmitting}
          >
            戻る
          </Button>
          {step < LAST_INPUT_STEP ? (
            <Button onClick={goNext}>次へ</Button>
          ) : (
            <Button onClick={submit} disabled={isSubmitting}>
              {isSubmitting ? "投稿中..." : "投稿する"}
            </Button>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <Link
          to="/stores"
          search={defaultSearch}
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          店舗一覧へ戻る
        </Link>
        <div className="mt-4">{children}</div>
      </div>
    </main>
  );
}

function EmploymentStep({
  state,
  testUsers,
  onChange,
}: {
  state: FormState;
  testUsers: TestUser[];
  onChange: (patch: Partial<FormState>) => void;
}) {
  return (
    <div className="grid gap-5">
      <Field label="投稿者（開発用のテストユーザー）">
        <select
          value={state.userId}
          onChange={(event) => onChange({ userId: event.target.value })}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          {testUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500">
          認証は未実装のため、投稿者をここで選びます。同じユーザーが同じ店舗へ2件は投稿できません。
        </p>
      </Field>

      <Field label="いまも働いていますか">
        <div className="flex gap-4 text-sm">
          {(
            [
              ["CURRENT", "在籍中"],
              ["FORMER", "退職済み"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="employmentStatus"
                checked={state.employmentStatus === value}
                onChange={() => onChange({ employmentStatus: value })}
              />
              {label}
            </label>
          ))}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="働き始めた年">
          <input
            type="number"
            value={state.employmentStartYear}
            onChange={(event) =>
              onChange({ employmentStartYear: event.target.value })
            }
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </Field>
        {state.employmentStatus === "FORMER" && (
          <Field label="辞めた年">
            <input
              type="number"
              value={state.employmentEndYear}
              onChange={(event) =>
                onChange({ employmentEndYear: event.target.value })
              }
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </Field>
        )}
      </div>

      <Field label="表示名（求人票には出ない、あなたの立場）">
        <input
          type="text"
          value={state.publicAuthorLabel}
          onChange={(event) =>
            onChange({ publicAuthorLabel: event.target.value })
          }
          placeholder="例: 学生アルバイト2年目"
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </Field>
    </div>
  );
}

function RatingStep({
  form,
  state,
  onChange,
}: {
  form: PublishedReviewForm;
  state: FormState;
  onChange: (patch: Partial<FormState>) => void;
}) {
  return (
    <div className="grid gap-4">
      {form.dimensions.map((dimension) => (
        <div
          key={dimension.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded border border-zinc-200 px-4 py-3"
        >
          <p className="text-sm font-medium">{dimension.label}</p>
          <div className="flex gap-1">
            {SCORE_CHOICES.map((score) => {
              const isSelected = state.ratings[dimension.id] === score;

              return (
                <button
                  key={score}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() =>
                    onChange({
                      ratings: { ...state.ratings, [dimension.id]: score },
                    })
                  }
                  className={`h-9 w-9 rounded border text-sm font-semibold ${
                    isSelected
                      ? "border-sky-700 bg-sky-700 text-white"
                      : "border-zinc-300 text-zinc-700 hover:border-sky-400"
                  }`}
                >
                  {score}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuestionStep({
  form,
  state,
  onChange,
}: {
  form: PublishedReviewForm;
  state: FormState;
  onChange: (patch: Partial<FormState>) => void;
}) {
  return (
    <div className="grid gap-5">
      {form.questions.map((question) => {
        const value = state.answers[question.id] ?? "";

        return (
          <Field key={question.id} label={question.label}>
            <textarea
              value={value}
              rows={4}
              onChange={(event) =>
                onChange({
                  answers: {
                    ...state.answers,
                    [question.id]: event.target.value,
                  },
                })
              }
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-zinc-500">
              {question.minLength ?? 0}〜{question.maxLength ?? 500}文字・
              {value.trim().length}文字
            </p>
          </Field>
        );
      })}
    </div>
  );
}

function SummaryStep({
  state,
  onChange,
}: {
  state: FormState;
  onChange: (patch: Partial<FormState>) => void;
}) {
  return (
    <Field label="ひとことでいうと、どんな職場でしたか">
      <textarea
        value={state.summary}
        rows={4}
        onChange={(event) => onChange({ summary: event.target.value })}
        placeholder="例: 研修が丁寧で、初めての接客でも段階的に慣れられました。"
        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
      />
      <p className="mt-1 text-xs text-zinc-500">
        500文字以内・{state.summary.trim().length}文字
      </p>
    </Field>
  );
}

function ConfirmStep({
  form,
  state,
}: {
  form: PublishedReviewForm;
  state: FormState;
}) {
  return (
    <dl className="grid gap-3 text-sm">
      <Row label="勤務">
        {state.employmentStatus === "CURRENT"
          ? `${state.employmentStartYear}年から勤務中`
          : `${state.employmentStartYear}年〜${state.employmentEndYear}年`}
      </Row>
      <Row label="表示名">{state.publicAuthorLabel}</Row>
      {form.dimensions.map((dimension) => (
        <Row key={dimension.id} label={dimension.label}>
          {state.ratings[dimension.id] ?? "-"} / 5
        </Row>
      ))}
      {form.questions.map((question) => (
        <Row key={question.id} label={question.label}>
          {state.answers[question.id]?.trim() || "-"}
        </Row>
      ))}
      <Row label="総合コメント">{state.summary.trim() || "-"}</Row>
    </dl>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b border-zinc-100 pb-2 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-900">{children}</dd>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

/**
 * 各ステップで入力が揃っているかだけを見る。
 * 正しさの最終判断はサーバー側のUse Caseとフォーム定義で行う。
 */
function validateStep(
  step: number,
  state: FormState,
  form: PublishedReviewForm,
): string[] {
  const issues: string[] = [];

  if (step === 0) {
    if (!state.userId) {
      issues.push("投稿者を選んでください");
    }

    const startYear = Number(state.employmentStartYear);

    if (!Number.isInteger(startYear) || startYear < 1970) {
      issues.push("働き始めた年を入力してください");
    }

    if (state.employmentStatus === "FORMER") {
      const endYear = Number(state.employmentEndYear);

      if (!Number.isInteger(endYear) || endYear < startYear) {
        issues.push("辞めた年は、働き始めた年以降で入力してください");
      }
    }

    if (state.publicAuthorLabel.trim() === "") {
      issues.push("表示名を入力してください");
    }
  }

  if (step === 1) {
    for (const dimension of form.dimensions) {
      if (dimension.isRequired && state.ratings[dimension.id] === undefined) {
        issues.push(`「${dimension.label}」を評価してください`);
      }
    }
  }

  if (step === 2) {
    for (const question of form.questions) {
      const answer = (state.answers[question.id] ?? "").trim();

      if (question.isRequired && answer === "") {
        issues.push(`「${question.label}」に回答してください`);
        continue;
      }

      if (question.minLength !== null && answer.length < question.minLength) {
        issues.push(
          `「${question.label}」は${question.minLength}文字以上で入力してください`,
        );
      }
    }
  }

  if (step === 3 && state.summary.trim() === "") {
    issues.push("総合コメントを入力してください");
  }

  return issues;
}
