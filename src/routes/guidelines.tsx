import { useRef, useState, type KeyboardEvent } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Icon } from "../components/icon";
export const Route = createFileRoute("/guidelines")({
  head: () => ({ meta: [{ title: "ガイドライン | バイトのホンネ" }] }),
  component: GuidelinesPage,
});
type AudienceTab = "general" | "business";
function GuidelinesPage() {
  const [activeTab, setActiveTab] = useState<AudienceTab>("general");
  const generalTabRef = useRef<HTMLButtonElement>(null);
  const businessTabRef = useRef<HTMLButtonElement>(null);

  function handleTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let nextTab: AudienceTab;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight":
        nextTab = activeTab === "general" ? "business" : "general";
        break;
      case "Home":
        nextTab = "general";
        break;
      case "End":
        nextTab = "business";
        break;
      default:
        return;
    }
    event.preventDefault();
    setActiveTab(nextTab);
    (nextTab === "general" ? generalTabRef : businessTabRef).current?.focus();
  }
  return (
    <main id="main" className="container page-section">
      <div className="breadcrumbs">
        <Link to="/">ホーム</Link>
        <span> / ガイドライン</span>
      </div>
      <p className="eyebrow">TRUST &amp; SAFETY</p>
      <h1>ガイドライン（版1）</h1>
      <p className="page-description">
        安心して投稿・閲覧いただけるよう、匿名性の守り方と口コミ投稿のルールをまとめています。
      </p>
      <div
        className="guideline-tabs"
        role="tablist"
        aria-label="ガイドラインの対象切り替え"
        onKeyDown={handleTabKeyDown}
      >
        <button
          type="button"
          role="tab"
          id="guideline-tab-general"
          ref={generalTabRef}
          aria-selected={activeTab === "general"}
          aria-controls="guideline-panel-general"
          tabIndex={activeTab === "general" ? 0 : -1}
          onClick={() => setActiveTab("general")}
        >
          一般の方向け
        </button>
        <button
          type="button"
          role="tab"
          id="guideline-tab-business"
          ref={businessTabRef}
          aria-selected={activeTab === "business"}
          aria-controls="guideline-panel-business"
          tabIndex={activeTab === "business" ? 0 : -1}
          onClick={() => setActiveTab("business")}
        >
          企業・店舗向け
        </button>
      </div>

      <div
        id="guideline-panel-general"
        hidden={activeTab !== "general"}
        tabIndex={0}
        role="tabpanel"
        aria-labelledby="guideline-tab-general"
      >
        <section className="guideline-block">
          <h2>
            <Icon name="shield" size={20} />
            投稿の匿名性とプライバシー保護について
          </h2>
          <p>
            投稿者を特定しにくくするため、勤務期間や投稿日を粗い区分で表示します。ただし、投稿内容や職場の状況から身元が推測される可能性があります。
          </p>
          <dl className="guideline-list">
            <div>
              <dt>データ開示の制限</dt>
              <dd>投稿者の内部IDや同意日時は公開画面に表示しません。</dd>
            </div>
            <div>
              <dt>投稿日や勤務期間の曖昧化</dt>
              <dd>
                投稿日時や勤務期間は「○年○月上旬」のように丸めて表示し、シフトや勤務時期からの特定を防ぎます。
              </dd>
            </div>
            <div>
              <dt>要約データとしての提供</dt>
              <dd>
                投稿前のプレビューで、属性バッジ・タグ・評価・本文がどのように見えるか確認してください。
              </dd>
            </div>
          </dl>
        </section>
        <section className="guideline-block">
          <h2>
            <Icon name="star" size={20} />
            投稿をおすすめする内容（推奨）
          </h2>
          <p>
            実際に働いた方だからこそ分かる情報は、次にバイトを探す方の大きな参考になります。以下のような内容の投稿をおすすめします。
          </p>
          <dl className="guideline-list">
            <div>
              <dt>職場の雰囲気・人間関係</dt>
              <dd>話しやすさ、質問のしやすさ、学生や同年代の多さなど</dd>
            </div>
            <div>
              <dt>業務内容の範囲</dt>
              <dd>レジ、品出し、発注補助など実際の一般的な業務範囲</dd>
            </div>
            <div>
              <dt>シフト・働きやすさ</dt>
              <dd>シフトの組みやすさ、急な休みの相談しやすさなど</dd>
            </div>
          </dl>
        </section>
        <section className="guideline-block">
          <h2>
            <Icon name="alert" size={20} />
            口コミ投稿ガイドライン（禁止事項）
          </h2>
          <p>
            すべての方が安心して情報を活用できるよう、以下の内容は投稿しないでください。問題のある投稿は運営の判断で非表示または削除する場合があります。
          </p>
          <dl className="guideline-list">
            <div>
              <dt>実名・個人を特定できる情報の記載</dt>
              <dd>
                氏名、あだ名など個人を特定できる情報の記載はお控えください。
              </dd>
            </div>
            <div>
              <dt>噂話や憶測</dt>
              <dd>
                他者から聞いた話や噂話ではなく、ご自身が働いた経験に基づく口コミを投稿してください。また、大げさな決めつけや断定するような表現は誤解を生む恐れがありますのでご遠慮ください。
              </dd>
            </div>
            <div>
              <dt>個人の人格攻撃・誹謗中傷</dt>
              <dd>
                事実に基づかない悪意のある非難や、人格を否定するような表現は禁止しております。
                <span className="guideline-example">
                  NG例：「バカ」「アホ」「無能」など
                </span>
              </dd>
            </div>
            <div>
              <dt>差別的な表現</dt>
              <dd>
                性別、年齢、国籍、出身、人種・民族、障害の有無、宗教、外見などの属性を理由に、人を一方的に評価・攻撃するような表現はご遠慮ください。
                <span className="guideline-example">
                  NG例：「女のくせに」「外国人だから」など
                </span>
              </dd>
            </div>
            <div>
              <dt>営業秘密・社外秘情報の漏洩（守秘義務の遵守）</dt>
              <dd>
                退職後であっても、元勤務先との秘密保持義務に違反する行為は法的責任を問われる可能性があります。以下の情報は固く禁止します。
                <ul className="guideline-ng-list">
                  <li>
                    未公開の事業情報（新店舗オープン予定、未発表の新メニュー・新商品など）
                  </li>
                  <li>
                    業務マニュアル・ノウハウ（レジパスワード、金庫管理法、マニュアル丸写し、売上や原価率などの内部データ）
                  </li>
                  <li>
                    犯罪行為や内部告発（事実確認が取れない告発は行わず、然るべき行政機関へ相談してください）
                  </li>
                </ul>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div
        id="guideline-panel-business"
        hidden={activeTab !== "business"}
        tabIndex={0}
        role="tabpanel"
        aria-labelledby="guideline-tab-business"
      >
        <section className="guideline-block">
          <h2>
            <Icon name="shield" size={20} />
            掲載企業様へ：公平な評価と保護に関する規定
          </h2>
          <p>
            当サービスは、求職者と職場のミスマッチをなくす目的で運営されております。掲載企業様および求職者の双方が安心して利用できるよう、以下の通り運用規約を定めます。
          </p>
          <dl className="guideline-list">
            <div>
              <dt>事実に基づく客観的評価の保障</dt>
              <dd>
                投稿される口コミは、実際に勤務経験のあるユーザー（勤続期間等で加重平均処理）による評価に基づきます。誹謗中傷、事実無根の悪意ある低評価、および企業の社会的評価を著しく不当に低下させる投稿は固く禁止し、システムおよび運営による事前・事後のチェックにて即時削除を行います。
              </dd>
            </div>
            <div>
              <dt>企業の反論・公式コメント権</dt>
              <dd>
                掲載企業様は、自社の店舗ページにおける口コミに対し、公式回答（改善の取り組みや補足説明）を投稿する権利を有します。これにより、過去の課題が現在改善されている場合のミスマッチを防ぎます。
              </dd>
            </div>
            <div>
              <dt>非開示・削除請求の迅速対応</dt>
              <dd>
                権利侵害（著作権・名誉毀損・営業秘密侵害）の申し出があった場合、運営事務局はガイドラインに基づき迅速な非表示措置および事実確認を実施します。
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
