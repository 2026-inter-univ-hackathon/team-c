import { Link, createFileRoute } from "@tanstack/react-router";
import { Icon } from "../components/icon";
export const Route = createFileRoute("/guidelines")({ component: GuidelinesPage });
function GuidelinesPage() {
  return (
    <main id="main" className="container page-section">
      <div className="breadcrumbs">
        <Link to="/">ホーム</Link>
        <span> / ガイドライン</span>
      </div>
      <p className="eyebrow">TRUST &amp; SAFETY</p>
      <h1>ガイドライン</h1>
      <p className="page-description">
        安心して投稿・閲覧いただけるよう、匿名性の守り方と口コミ投稿のルールをまとめています。
      </p>
      <section className="guideline-block">
        <h2>
          <Icon name="shield" size={20} />
          投稿の匿名性とプライバシー保護について
        </h2>
        <p>
          当アプリでは、投稿者が特定されたり、職場等から報復されることを防ぐため、厳重な匿名システムを採用しております。
        </p>
        <ul className="guideline-list">
          <li>
            <strong>データ開示の制限：</strong>
            口コミが一定件数（５件）に満たない店舗のデータは、企業側に詳細を開示しません。
          </li>
          <li>
            <strong>投稿日や属性の曖昧化：</strong>
            投稿日時や勤務期間は「○年○月上旬」のように丸めて表示し、シフトや勤務時期からの特定を防ぎます。
          </li>
          <li>
            <strong>要約データとしての提供：</strong>
            企業にはテキストの生データをそのまま渡すのではなく、統計データやAIによる「強み・課題の要約レポート」に変換して提供することで、個人が特定されるリスクを大幅に排除しています。
          </li>
        </ul>
      </section>
      <section className="guideline-block">
        <h2>
          <Icon name="alert" size={20} />
          口コミ投稿ガイドライン（禁止事項）
        </h2>
        <p>
          すべての方が安心して情報を活用できるよう、以下の表現を含む投稿はシステムによる自動伏字化フィルターの対象となる他、運営の裁量により予告なく非表示・削除する場合（悪質なアカウントは投稿停止・利用禁止）があります。
        </p>
        <ul className="guideline-list">
          <li>
            <strong>実名・個人を特定できる情報の記載：</strong>
            氏名、あだ名など個人を特定できる情報の記載はお控えください。
          </li>
          <li>
            <strong>噂話や憶測：</strong>
            他者から聞いた話や噂話ではなく、ご自身が働いた経験に基づく口コミを投稿してください。また、大げさな決めつけや断定するような表現は誤解を生む恐れがありますのでご遠慮ください。
          </li>
          <li>
            <strong>個人の人格攻撃・誹謗中傷：</strong>
            事実に基づかない悪意のある非難や、人格を否定するような表現は禁止しております。
            <span className="guideline-example">NG例：「バカ」「アホ」「無能」など</span>
          </li>
          <li>
            <strong>差別的な表現：</strong>
            性別、年齢、国籍、出身、人種・民族、障害の有無、宗教、外見などの属性を理由に、人を一方的に評価・攻撃するような表現はご遠慮ください。
            <span className="guideline-example">
              NG例：「女のくせに」「外国人だから」など
            </span>
          </li>
          <li>
            <strong>違反行為の告発・社外秘情報の漏洩：</strong>
            当アプリは事実確認が取れない犯罪行為の告発や企業の内部告発をする場ではございません。法律違反等については、当アプリではなく然るべき行政機関へご相談ください。また、投稿する際には非公開のマニュアルや内部データの情報が含まれていないことをご確認の上お願いいたします。
          </li>
        </ul>
      </section>
    </main>
  );
}
