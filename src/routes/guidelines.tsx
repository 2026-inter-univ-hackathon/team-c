import { Link, createFileRoute } from "@tanstack/react-router";
import { Icon } from "../components/icon";
export const Route = createFileRoute("/guidelines")({
  head: () => ({ meta: [{ title: "ガイドライン | バイトのホンネ" }] }),
  component: GuidelinesPage,
});
function GuidelinesPage() {
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
            <dt>違反行為の告発・社外秘情報の漏洩</dt>
            <dd>
              当アプリは事実確認が取れない犯罪行為の告発や企業の内部告発をする場ではございません。法律違反等については、当アプリではなく然るべき行政機関へご相談ください。また、投稿する際には非公開のマニュアルや内部データの情報が含まれていないことをご確認の上お願いいたします。
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
