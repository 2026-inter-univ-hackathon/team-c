import { Link, createFileRoute } from "@tanstack/react-router";
import { SearchForm } from "../features/stores/search-form";
import { AtmosphereSearch } from "../features/stores/atmosphere-search";
import { defaultSearch } from "../schemas/store-search";
import { Icon } from "../components/icon";
import cafe from "../../img/cafe.jpg";
import conv from "../../img/conv.jpg";
import juku from "../../img/juku.jpg";
export const Route = createFileRoute("/")({ component: Home });
function Home() {
  return (
    <main id="main">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span />
              働いた人の声で、バイト選びは変わる。
            </p>
            <h1>
              求人票の、その先の
              <br />
              <em>ホンネ</em>を知ろう。
            </h1>
            <p className="hero-description">
              職場の雰囲気、教え方、忙しさ。
              <br />
              働いてみないとわからないことを、
              <br className="mobile-only" />
              先輩たちの口コミから。
            </p>
            <div className="hero-footnote">
              <span>はじめてのバイトも。</span>
              <span>次の一歩も。</span>
            </div>
          </div>
          <div className="hero-visual">
            <img src={cafe} alt="カフェのカウンターのイメージ" />
            <span className="photo-caption">職場イメージ</span>
            <div className="hero-note">
              <Icon name="chat" size={28} />
              <div>
                <strong>
                  「ここで働く」を、
                  <br />
                  もっと自分らしく。
                </strong>
                <span>WORK WITH YOUR OWN VALUES</span>
              </div>
            </div>
            <span className="hero-stamp">
              働く前に
              <b>ホンネ</b>
              をチェック
            </span>
          </div>
        </div>
        <div className="container hero-search">
          <SearchForm />
          <AtmosphereSearch />
          <div className="quick-search">
            <span>気になる業種から：</span>
            {[
              ["cafe", "カフェ"],
              ["convenience", "コンビニ"],
              ["education", "教育・塾"],
            ].map(([code, label]) => (
              <Link
                key={code}
                to="/stores"
                search={{ ...defaultSearch, category: code }}
              >
                {label}
                <span>↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="container home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR WORKPLACE</p>
            <h2>どんな場所で、働きたい？</h2>
          </div>
          <Link to="/stores" search={defaultSearch} className="text-link">
            すべての職場を見る
            <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="category-grid">
          {[
            {
              code: "cafe",
              name: "カフェ",
              en: "CAFE",
              image: cafe,
              description: "一杯のコーヒーの、その裏側。",
            },
            {
              code: "convenience",
              name: "コンビニ",
              en: "CONVENIENCE STORE",
              image: conv,
              description: "身近なお店の、リアルな毎日。",
            },
            {
              code: "education",
              name: "教育・塾",
              en: "EDUCATION",
              image: juku,
              description: "誰かの成長を支える仕事。",
            },
          ].map((item) => (
            <Link
              key={item.code}
              to="/stores"
              search={{ ...defaultSearch, category: item.code }}
              className="category-card"
            >
              <div>
                <img src={item.image} alt="" loading="lazy" />
                <span>業種イメージ</span>
              </div>
              <p>{item.en}</p>
              <h3>
                {item.name}
                <Icon name="arrow" />
              </h3>
              <span>{item.description}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="about-section">
        <div className="container about-grid">
          <div>
            <p className="eyebrow">BEFORE YOU START</p>
            <h2>
              条件だけじゃ、
              <br />
              わからないことがある。
            </h2>
            <p>
              大事なのは、あなたに合うかどうか。
              <br />
              いろいろな声を見比べて、納得できる選択を。
            </p>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "職場のホンネを見つける",
                "エリアや業種から、気になるバイト先を検索。",
              ],
              [
                "02",
                "評価と口コミを読み比べる",
                "雰囲気や新人教育など、あなたの重視するポイントを確認。",
              ],
              [
                "03",
                "気になる職場を保存する",
                "このブラウザに保存して、あとでじっくり検討。",
              ],
            ].map(([n, title, description]) => (
              <div key={n}>
                <span>{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container trust-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TRUST &amp; SAFETY</p>
            <h2>安心して、投稿・閲覧できる場所に。</h2>
          </div>
          <Link to="/guidelines" className="text-link">
            ガイドラインを見る
            <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="trust-grid">
          <Link to="/guidelines" className="trust-card">
            <Icon name="shield" size={22} />
            <h3>「個人特定」を防ぐ仕組み</h3>
            <p>
              口コミの少ない店舗の詳細は企業に非開示、投稿日や勤務期間はぼかして表示、企業にはAIによる要約レポートで提供するなど、投稿者が特定されない仕組みを設けています。
            </p>
          </Link>
          <Link to="/guidelines" className="trust-card">
            <Icon name="alert" size={22} />
            <h3>名誉棄損・誹謗中傷・個人名晒し</h3>
            <p>
              実名や個人を特定できる情報の記載、根拠のない誹謗中傷や差別的な表現などは禁止事項です。該当する投稿は自動伏字化や非表示・削除の対象となります。
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
