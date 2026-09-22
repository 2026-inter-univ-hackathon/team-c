import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "プライバシーポリシー | バイトのホンネ" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main id="main" className="container page-section">
      <div className="breadcrumbs">
        <Link to="/">ホーム</Link>
        <span> / プライバシーポリシー</span>
      </div>
      <p className="eyebrow">PRIVACY POLICY</p>
      <h1>プライバシーポリシー</h1>
      <p className="page-description">
        運営者（以下「運営」といいます。）は、口コミ投稿サービス「バイトのホンネ」（以下「本サービス」といいます。）における、ユーザーの情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
      </p>

      <section className="guideline-block">
        <h2>第1条（取得する情報）</h2>
        <p>運営は、本サービスの提供にあたり、以下の情報を取得します。</p>
        <dl className="guideline-list">
          <div>
            <dt>アクセスログ情報</dt>
            <dd>
              IPアドレス、ブラウザの種類・バージョン、OS、アクセス日時、閲覧ページ、リファラ等、ユーザーが本サービスを利用する際に生成される情報。
            </dd>
          </div>
          <div>
            <dt>投稿内容</dt>
            <dd>
              ユーザーが本サービスに投稿する口コミ本文、評価、勤務属性（年代、勤続期間等）その他の情報。
            </dd>
          </div>
          <div>
            <dt>お問い合わせ情報</dt>
            <dd>
              お問い合わせフォーム等を通じてユーザーが運営に提供する氏名、メールアドレス、お問い合わせ内容等の情報。
            </dd>
          </div>
          <div>
            <dt>Cookie等の技術により取得する情報</dt>
            <dd>
              端末識別子、利用状況等、Cookieその他これに類する技術を用いて取得する情報。
            </dd>
          </div>
        </dl>
      </section>

      <section className="guideline-block">
        <h2>第2条（利用目的）</h2>
        <p>運営は、取得した情報を、以下の目的の範囲内で利用します。</p>
        <ul className="guideline-ng-list">
          <li>本サービスの提供、維持、保護および改善のため</li>
          <li>
            不正アクセス、なりすまし、規約違反投稿その他の不正行為の防止・調査・対策のため
          </li>
          <li>
            法令に基づく対応、および裁判所・捜査機関等からの適法な開示請求への対応のため
          </li>
          <li>お問い合わせ・削除依頼への対応、および本人確認のため</li>
          <li>
            投稿データを匿名化・統計データとして加工したうえで行う、企業・店舗向けデータ分析レポート等の作成・提供およびサービス改善のため
          </li>
        </ul>
      </section>

      <section className="guideline-block">
        <h2>第3条（統計データとしての利用）</h2>
        <p>
          運営は、前条に定める分析レポート等の作成にあたり、投稿内容を特定の個人を識別できない形に匿名化・統計化したうえで利用するものとし、氏名等の個人情報そのものを企業・店舗その他の第三者に提供することはありません。
        </p>
      </section>

      <section className="guideline-block">
        <h2>第4条（第三者提供）</h2>
        <p>
          運営は、次のいずれかに該当する場合を除き、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。
        </p>
        <ul className="guideline-ng-list">
          <li>法令に基づく場合</li>
          <li>
            人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき
          </li>
          <li>
            裁判所、捜査機関その他これに準ずる権限を有する機関から法令に基づく開示要請があった場合
          </li>
          <li>
            その他、個人情報の保護に関する法律その他の法令で認められる場合
          </li>
        </ul>
      </section>

      <section className="guideline-block">
        <h2>第5条（Cookie等の利用）</h2>
        <p>
          本サービスは、利便性の向上、利用状況の分析等を目的として、Cookie等の技術を利用することがあります。ユーザーは、ブラウザの設定によりCookieの利用を拒否することができますが、その場合、本サービスの一部機能がご利用いただけない場合があります。
        </p>
      </section>

      <section className="guideline-block">
        <h2>第6条（安全管理措置）</h2>
        <p>
          運営は、取得した情報の漏えい、滅失またはき損の防止その他の安全管理のために、必要かつ適切な措置を講じます。
        </p>
      </section>

      <section className="guideline-block">
        <h2>第7条（開示・訂正・利用停止等の請求）</h2>
        <p>
          ユーザーは、運営の定める手続きに従い、運営が保有する自己の個人情報について、開示、訂正、追加、削除、利用停止を請求することができます。請求を受けた場合、運営は、本人確認を行ったうえで、法令に従い合理的な期間内に対応します。
        </p>
      </section>

      <section className="guideline-block">
        <h2>第8条（お問い合わせ窓口）</h2>
        <p>
          本ポリシーおよび個人情報の取扱いに関するお問い合わせ、開示等の請求または投稿の削除依頼は、
          <Link to="/contact">お問い合わせ・削除依頼ページ</Link>
          より受け付けます。
        </p>
      </section>

      <section className="guideline-block">
        <h2>第9条（プライバシーポリシーの変更）</h2>
        <p>
          運営は、法令の変更その他必要に応じて、本ポリシーを予告なく変更することがあります。変更後のプライバシーポリシーは、本サービス上に表示した時点から効力を生じるものとします。
        </p>
      </section>
    </main>
  );
}
