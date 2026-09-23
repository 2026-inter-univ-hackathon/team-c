import { Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { demoCompany, demoStores } from "./demo-data";
import { analyze, dimensions } from "./analytics";

const key = "company-demo-work-v1";
const listeners = new Set<() => void>();
function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(key) ?? "{}";
  } catch {
    return "{}";
  }
}
const serverSnapshot = () => "{}";
const tasks = [
  {
    id: "training",
    storeId: demoStores[1].id,
    title: "初週の研修チェックリストを整える",
    reason: "覚える業務が多いという声を受け、教える順番と相談先を明文化。",
    owner: "池袋店 店長",
    due: "2026-09-30",
  },
  {
    id: "peak",
    storeId: demoStores[0].id,
    title: "ピーク前の役割確認を習慣にする",
    reason: "忙しい時間の役割分担を維持し、新人が助けを求める先を共有。",
    owner: "早稲田店 店長",
    due: "2026-10-07",
  },
];
const format = (value: number | null) =>
  value === null ? "—" : value.toFixed(2);

export function CompanyWorkspace({ report = false }: { report?: boolean }) {
  const [storeId, setStoreId] = useState("all");
  const [period, setPeriod] = useState("6");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("score");
  const [savedMessage, setSavedMessage] = useState("");
  const [people, setPeople] = useState(1);
  const [cost, setCost] = useState(20);
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  let stored: Record<string, string> = {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      stored = Object.fromEntries(
        Object.entries(parsed).filter(([, value]) => typeof value === "string"),
      );
  } catch {
    /* Invalid local data is ignored. */
  }
  function save(id: string, value: string) {
    try {
      localStorage.setItem(key, JSON.stringify({ ...stored, [id]: value }));
      listeners.forEach((fn) => fn());
      setSavedMessage("このブラウザに保存しました。");
    } catch {
      setSavedMessage(
        "保存できませんでした。ブラウザの保存設定を確認してください。",
      );
    }
  }
  const result = analyze(storeId, period);
  const selectedStores = demoStores.filter(
    (s) => storeId === "all" || s.id === storeId,
  );
  const activeTasks = tasks.filter(
    (t) => storeId === "all" || t.storeId === storeId,
  );
  const rows = selectedStores
    .filter((s) => s.name.includes(query))
    .map((s) => ({ ...s, result: analyze(s.id, period) }))
    .sort((a, b) =>
      sort === "count"
        ? b.result.selected.length - a.result.selected.length
        : (a.result.average ?? Infinity) - (b.result.average ?? Infinity),
    );
  const weakest = result.averages.reduce<number>(
    (best, value, i) =>
      value !== null && value < (result.averages[best] ?? Infinity) ? i : best,
    0,
  );
  const periodLabel = period === "3" ? "2026年7月〜9月" : "2026年4月〜9月";
  const scope =
    storeId === "all"
      ? "全店舗"
      : demoStores.find((s) => s.id === storeId)!.name.replace("【デモ】", "");
  return (
    <main id="main" className="cw">
      <div className="cw-banner">
        サンプルデータで操作できます · 対応状況と回答下書きはこのブラウザに保存
      </div>
      <div className="container">
        <nav className="cw-nav" aria-label="企業メニュー">
          <strong>バイトのホンネ / 企業向け</strong>
          <Link
            to="/company"
            activeOptions={{ exact: true }}
            activeProps={{ "aria-current": "page" }}
          >
            ダッシュボード
          </Link>
          <Link to="/company/report" activeProps={{ "aria-current": "page" }}>
            改善レポート
          </Link>
          <Link to="/demo">表示切替</Link>
        </nav>
        <header className="cw-heading">
          <div>
            <p>{demoCompany.name}</p>
            <h1>{report ? "組織改善レポート" : "職場の声を、次の改善へ。"}</h1>
            <p>
              {report
                ? "評価と根拠を確認し、対応方針をまとめる"
                : "店舗を比較し、現場で確認したい課題を見つける"}
            </p>
          </div>
          {report ? (
            <button className="button primary" onClick={() => window.print()}>
              印刷・PDF保存
            </button>
          ) : (
            <Link className="button primary" to="/company/report">
              改善レポートを開く
            </Link>
          )}
        </header>
        <div className="cw-filters">
          <label>
            対象店舗
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            >
              <option value="all">全店舗</option>
              {demoStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name.replace("【デモ】", "")}
                </option>
              ))}
            </select>
          </label>
          <label>
            集計期間
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="6">2026年4月〜9月</option>
              <option value="3">2026年7月〜9月</option>
            </select>
          </label>
          <span>基準日：2026年9月24日</span>
        </div>
        <p className="cw-scope">
          {scope} · {periodLabel} · 架空の口コミから集計 /
          各口コミを等しく扱う単純平均
        </p>
        <div className="cw-kpis">
          <article>
            <span>対象店舗</span>
            <strong>
              {selectedStores.length}
              <small>店舗</small>
            </strong>
          </article>
          <article>
            <span>対象口コミ</span>
            <strong>
              {result.selected.length}
              <small>件</small>
            </strong>
          </article>
          <article>
            <span>総合評価</span>
            <strong>
              {format(result.average)}
              <small>/ 5</small>
            </strong>
          </article>
          <article>
            <span>未完了の改善項目</span>
            <strong>
              {activeTasks.filter((t) => stored[t.id] !== "完了").length}
              <small>件</small>
            </strong>
          </article>
        </div>
        <div className="cw-charts">
          <section className="cw-panel">
            <h2>職場体験の4指標</h2>
            <p>低い指標から、現場への確認を始めましょう。</p>
            {dimensions.map((label, i) => (
              <div className="cw-bar" key={label}>
                <span>{label}</span>
                <meter
                  min="0"
                  max="5"
                  value={result.averages[i] ?? 0}
                  aria-label={label}
                />
                <strong>{format(result.averages[i])}</strong>
              </div>
            ))}
            <small>0〜5点。同じ期間・対象店舗の口コミを集計。</small>
          </section>
          <section className="cw-panel">
            <h2>月別の口コミ件数</h2>
            <p>声の集まり方を確認するための推移です。</p>
            <div className="cw-columns">
              {["04", "05", "06", "07", "08", "09"]
                .filter((m) => period === "6" || m >= "07")
                .map((m) => {
                  const count = result.selected.filter(
                    (v) => v.month === `2026-${m}`,
                  ).length;
                  return (
                    <div key={m}>
                      <strong>{count}件</strong>
                      <div className="cw-column-track">
                        <i style={{ height: `${count * 40}%` }} />
                      </div>
                      <span>{Number(m)}月</span>
                    </div>
                  );
                })}
            </div>
            <small>
              サンプル数が少ないため、離職リスクの判定には使いません。
            </small>
          </section>
        </div>
        <section className="cw-panel">
          <h2>{report ? "対象範囲の読み取り" : "今回、確認したいこと"}</h2>
          {result.selected.length ? (
            <p>
              対象の{result.selected.length}件では「{dimensions[weakest]}
              」が最も低く、{format(result.averages[weakest])}
              点でした。下記の口コミと現場の状況を確認し、改善する内容を決めてください。
            </p>
          ) : (
            <p>この期間の口コミはありません。期間を広げて確認してください。</p>
          )}
          <small>
            表示データに基づく定型サマリーです。AIによる分析や因果関係の推定は行っていません。
          </small>
        </section>
        <section className="cw-panel">
          <h2>店舗比較</h2>
          <div className="cw-table-controls">
            <label>
              店舗名で絞り込み
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="店舗名を入力"
              />
            </label>
            <label>
              並び順
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="score">評価が低い順</option>
                <option value="count">口コミが多い順</option>
              </select>
            </label>
          </div>
          <div className="cw-table-wrap">
            <table>
              <caption>{periodLabel}の店舗別評価</caption>
              <thead>
                <tr>
                  <th scope="col">店舗</th>
                  <th scope="col">口コミ</th>
                  <th scope="col">総合</th>
                  {dimensions.map((d) => (
                    <th scope="col" key={d}>
                      {d}
                    </th>
                  ))}
                  <th scope="col">詳細</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">
                      {row.name.replace("【デモ】", "")}
                      <small>
                        {row.category} · {row.location}
                      </small>
                    </th>
                    <td>{row.result.selected.length}件</td>
                    <td>{format(row.result.average)}</td>
                    {row.result.averages.map((value, i) => (
                      <td key={i} data-low={value !== null && value < 3.5}>
                        {format(value)}
                      </td>
                    ))}
                    <td>
                      <button onClick={() => setStoreId(row.id)}>
                        この店舗を見る
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p>該当する店舗がありません。</p>}
          </div>
        </section>
        <section className="cw-panel">
          <h2>改善アクション</h2>
          <p>担当者と期限を確認し、進捗を記録できます。</p>
          <div className="cw-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>取り組み / 根拠</th>
                  <th>担当</th>
                  <th>期限</th>
                  <th>状況</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.map((t) => (
                  <tr key={t.id}>
                    <th scope="row">
                      {t.title}
                      <small>{t.reason}</small>
                    </th>
                    <td>{t.owner}</td>
                    <td>{t.due}</td>
                    <td>
                      <select
                        aria-label={`${t.title}の状況`}
                        value={stored[t.id] ?? "未着手"}
                        onChange={(e) => save(t.id, e.target.value)}
                      >
                        {["未着手", "対応中", "完了"].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!activeTasks.length && (
              <p>この店舗の改善アクションは登録されていません。</p>
            )}
          </div>
          <p role="status">{savedMessage}</p>
        </section>
        <section className="cw-panel">
          <h2>口コミと公式回答の下書き</h2>
          <p>架空の口コミです。下書きは公開・送信されません。</p>
          {result.selected.map((v) => (
            <article className="cw-voice" key={v.id}>
              <h3>{v.storeName.replace("【デモ】", "")}</h3>
              <small>
                {v.date} · 総合{" "}
                {format(v.scores.reduce((a, b) => a + b, 0) / 4)}
              </small>
              <blockquote>{v.summary}</blockquote>
              <Reply
                key={`${v.id}-${stored[v.id] ?? ""}`}
                value={stored[v.id] ?? ""}
                onSave={(value) => save(v.id, value)}
              />
            </article>
          ))}
          {!result.selected.length && <p>対象期間の口コミはありません。</p>}
        </section>
        {report && (
          <section className="cw-panel">
            <h2>改善効果のシナリオ試算</h2>
            <p>自社の仮定を入力して、検討用の金額を計算します。</p>
            <div className="cw-filters">
              <label>
                早期離職を防ぐ人数
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={people}
                  onChange={(e) =>
                    setPeople(
                      Math.min(
                        100,
                        Math.max(0, Math.floor(Number(e.target.value) || 0)),
                      ),
                    )
                  }
                />
              </label>
              <label>
                1人あたりの採用・研修費（万円）
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={cost}
                  onChange={(e) =>
                    setCost(
                      Math.min(1000, Math.max(0, Number(e.target.value) || 0)),
                    )
                  }
                />
              </label>
            </div>
            <p className="cw-impact">
              {people}人 × {cost}万円 ={" "}
              <strong>{(people * cost).toLocaleString()}万円</strong>
            </p>
            <small>
              費用の削減を保証するものではありません。初期値は操作例の仮定です。
            </small>
          </section>
        )}
      </div>
    </main>
  );
}
function Reply({
  value,
  onSave,
}: {
  value: string;
  onSave: (text: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <details>
      <summary>
        {value ? "保存済みの回答下書きを編集" : "公式回答の下書きを作成"}
      </summary>
      <label>
        回答内容
        <textarea
          maxLength={1000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </label>
      <button className="button secondary" onClick={() => onSave(draft)}>
        下書きを保存
      </button>
      <small>{draft.length}/1000文字</small>
    </details>
  );
}
