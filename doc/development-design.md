# アルバイト口コミWebアプリ 開発設計書

更新日: 2026-09-23

本書は現在のDB設計とアプリケーション境界、および認証・組織管理の将来設計を記載します。現在の実装範囲は[実装状況](./implementation-status.md)を参照してください。将来設計を現行機能として扱わないでください。

## 1. 目的と設計原則

本書はMVPの技術構成、DB設計、公開境界を定義する。開発デモへのデプロイは実装済みで、AI機能は対象外とする。認証・認可はテーブルと将来方針だけがあり、実際の認証フローは未実装である。

- ユーザーを種類別のテーブルへ分割しない
- 認証方法、プラットフォーム権限、組織内権限を分離する
- 質問や評価軸を追加してもテーブル変更を不要にする
- 画面やRouteからDBを直接操作しない
- 変更が予想される箇所だけを分離し、過度に汎用化しない

## 2. 技術スタック

| 領域 | 採用技術 |
|---|---|
| Full-stack | TanStack Start |
| Language | TypeScript（strict） |
| UI | React / Tailwind CSS / プロジェクト固有CSS |
| Routing / State / Form | TanStack Router / React hooks / URL search params |
| Validation | Zod |
| Database | PostgreSQL 18 |
| ORM / Migration | Drizzle ORM / Drizzle Kit |
| Authentication | 未実装。開発用更新だけ環境・DB制約で限定 |
| Test | Vitest |
| Package manager | pnpm |
| CI / Deployment | GitHub Actions / self-hosted runner / Nginx / systemd |

単一のTanStack Startアプリとして構築し、独立Backendやモノレポは設けない。

TanStack Query、TanStack Form、shadcn/ui、Playwrightは現在の実装へ導入していない。

## 3. アプリケーション構成

```text
Browser → TanStack Start
             ├─ Routes / UI
             ├─ Server Functions
             ├─ Use Cases
             ├─ Repositories
             └─ Drizzle ORM → PostgreSQL
```

画面から使う処理はServer Functionsとする。外部APIが必要になった場合だけServer Routesを追加し、同じUse Caseを呼び出す。

## 4. ディレクトリ構成

```text
src/
├─ routes/
├─ features/
│  └─ stores/
├─ components/
├─ server/
│  ├─ use-cases/
│  ├─ repositories/
│  ├─ errors/
│  └─ dev-review-access.ts
├─ db/
│  ├─ schema/
│  ├─ migrations/
│  ├─ seed.ts
│  └─ client.ts
├─ schemas/
└─ lib/
```

依存方向は`Route → Server Function → Use Case → Repository/DB`とする。

## 5. 認証・認可設計

この章は将来設計である。現在は `AuthAdapter`、Session発行、Authorization Policyを実装しておらず、一般ユーザーの投稿を許可しない。開発用投稿とリアクションは固定Userをサーバー側で選び、環境・localhost・DB名を検証して限定している。これは認証や認可の代替ではない。

### 5.1 概念の分離

| 概念 | 管理対象 |
|---|---|
| User | サービスを利用する人 |
| AuthAccount | Basic、Google等の本人確認手段 |
| Session | ログイン状態 |
| PlatformRole | サービス全体に対する管理権限 |
| OrganizationMembership | 組織への所属と組織内権限 |

一般利用者であることはRoleではない。有効なUserは店舗閲覧や口コミ投稿ができる。同じUserが口コミを投稿しながら、複数組織の管理者になることも許容する。

### 5.2 認証境界

```ts
type AuthenticatedPrincipal = {
  userId: string
  sessionId: string
}

interface AuthAdapter {
  authenticate(request: Request): Promise<AuthenticatedPrincipal | null>
}
```

`AuthAdapter`は本人を特定するだけで権限を返さない。Authorization PolicyがDB上のPlatformRoleとOrganizationMembershipから権限を判定する。

将来認証を追加する場合は、認証方式を `AuthAccount` から既存Userへ紐づける。Review等の業務テーブルは認証プロバイダーの識別子ではなく `users.id` を参照し続ける。Basic認証は現行実装でも確定した導入方式でもない。

### 5.3 認可ルール

| 操作 | 条件 |
|---|---|
| 店舗・口コミ閲覧、口コミ投稿 | ACTIVEなUser |
| 口コミ編集・削除 | 投稿者本人またはPlatform ADMIN |
| 組織ダッシュボード | 対象組織のMembership保有者またはPlatform ADMIN |
| 店舗管理 | 対象組織でOWNERまたはMANAGER |
| サービス全体の管理 | Platform ADMIN |

- 未認証は`401`、権限不足は`403`
- Session Cookieは`HttpOnly`、`SameSite=Lax`
- DBにはSession Tokenのハッシュだけを保存する

## 6. DB設計

### 6.1 共通方針

- 全テーブルの単独主キーはPostgreSQL 18の`uuidv7()`でDB側生成し、型は`uuid`とする
- 複合主キーは関連する外部キーの組み合わせとする
- 日時は`timestamptz`、名前は`snake_case`
- 外部キーカラムには原則Indexを付与する
- RoleやStatusは`varchar`＋CHECK制約で管理する
- 口コミや店舗は原則論理削除する
- 認証情報ではなく、必ず`users.id`を業務データの参照先にする
- `created_at`は`DEFAULT now()`、`updated_at`は更新処理で必ず更新する

### 6.2 ER図

```mermaid
erDiagram
    USERS ||--o{ AUTH_ACCOUNTS : authenticates_with
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ PLATFORM_ROLE_ASSIGNMENTS : receives
    PLATFORM_ROLES ||--o{ PLATFORM_ROLE_ASSIGNMENTS : defines
    USERS ||--o{ ORGANIZATION_MEMBERSHIPS : joins
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERSHIPS : has
    ORGANIZATIONS o|--o{ STORES : owns
    STORES ||--o{ STORE_CATEGORIES : classified_as
    CATEGORIES ||--o{ STORE_CATEGORIES : classifies
    STORES ||--o{ REVIEWS : receives
    USERS ||--o{ REVIEWS : writes
    REVIEW_FORMS ||--o{ REVIEW_QUESTIONS : contains
    REVIEW_FORMS ||--o{ REVIEW_FORM_RATING_DIMENSIONS : configures
    RATING_DIMENSIONS ||--o{ REVIEW_FORM_RATING_DIMENSIONS : included_in
    REVIEW_FORMS ||--o{ REVIEWS : structures
    REVIEWS ||--o{ REVIEW_ANSWERS : contains
    REVIEW_QUESTIONS ||--o{ REVIEW_ANSWERS : answers
    RATING_DIMENSIONS ||--o{ REVIEW_RATINGS : defines
    REVIEWS ||--o{ REVIEW_RATINGS : contains
    REVIEWS ||--o{ REVIEW_REACTIONS : receives
    USERS ||--o{ REVIEW_REACTIONS : reacts

    USERS {
        uuid id PK
        varchar email
        varchar display_name
        text avatar_url
        varchar status
        timestamptz email_verified_at
        timestamptz deleted_at
        timestamptz created_at
        timestamptz updated_at
    }
    AUTH_ACCOUNTS {
        uuid id PK
        uuid user_id FK
        varchar provider
        varchar provider_user_id
        timestamptz created_at
    }
    SESSIONS {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
        timestamptz expires_at
        timestamptz revoked_at
        timestamptz last_seen_at
        timestamptz created_at
    }
    PLATFORM_ROLES {
        uuid id PK
        varchar code UK
        varchar name
    }
    PLATFORM_ROLE_ASSIGNMENTS {
        uuid user_id FK
        uuid platform_role_id FK
        timestamptz created_at
    }
    ORGANIZATIONS {
        uuid id PK
        varchar name
        varchar status
        timestamptz created_at
        timestamptz updated_at
    }
    ORGANIZATION_MEMBERSHIPS {
        uuid organization_id FK
        uuid user_id FK
        varchar role
        varchar status
        timestamptz created_at
        timestamptz updated_at
    }
    STORES {
        uuid id PK
        uuid organization_id FK
        varchar name
        varchar normalized_name
        varchar postal_code
        varchar prefecture
        varchar city
        varchar address
        decimal latitude
        decimal longitude
        varchar external_source
        varchar external_id
        varchar status
        timestamptz deleted_at
        timestamptz created_at
        timestamptz updated_at
    }
    CATEGORIES {
        uuid id PK
        varchar code UK
        varchar name
        boolean is_active
    }
    STORE_CATEGORIES {
        uuid store_id FK
        uuid category_id FK
    }
    REVIEW_FORMS {
        uuid id PK
        integer version UK
        varchar status
        timestamptz published_at
        timestamptz created_at
    }
    REVIEW_QUESTIONS {
        uuid id PK
        uuid review_form_id FK
        varchar code
        varchar label
        varchar answer_type
        integer display_order
        boolean is_required
        integer min_length
        integer max_length
    }
    REVIEW_FORM_RATING_DIMENSIONS {
        uuid review_form_id FK
        uuid rating_dimension_id FK
        integer display_order
        boolean is_required
    }
    RATING_DIMENSIONS {
        uuid id PK
        varchar code UK
        varchar label
        integer display_order
        boolean is_active
    }
    REVIEWS {
        uuid id PK
        uuid store_id FK
        uuid user_id FK
        uuid review_form_id FK
        smallint employment_start_year
        smallint employment_end_year
        varchar employment_status
        varchar occupation
        varchar work_duration
        jsonb atmosphere_tags
        jsonb staff_tags
        varchar manager_presence
        varchar recommendation
        integer guideline_version
        timestamptz guideline_agreed_at
        varchar summary
        varchar public_author_label
        varchar status
        integer lock_version
        timestamptz published_at
        timestamptz hidden_at
        uuid hidden_by_user_id FK
        text hidden_reason
        timestamptz deleted_at
        timestamptz created_at
        timestamptz updated_at
    }
    REVIEW_ANSWERS {
        uuid review_id FK
        uuid review_form_id FK
        uuid review_question_id FK
        text answer_text
    }
    REVIEW_RATINGS {
        uuid review_id FK
        uuid review_form_id FK
        uuid rating_dimension_id FK
        smallint score
    }
    REVIEW_REACTIONS {
        uuid review_id FK
        uuid user_id FK
        varchar reaction_type
        timestamptz created_at
    }
```

### 6.3 Identity・権限系

#### users

全利用者の共通情報。`role`は持たない。Statusは`ACTIVE / SUSPENDED / DELETED`とする。

外部ProviderがEmailを返さない場合に備えて`email`はNULL可とする。EmailがあるUserについては次の部分Unique Indexを設定する。Emailは本人の識別子として使わず、本人確認済みの場合だけ`email_verified_at`を設定する。

```sql
CREATE UNIQUE INDEX users_active_email_unique
  ON users (lower(email))
  WHERE email IS NOT NULL AND deleted_at IS NULL;
```

#### auth_accounts

認証ProviderとUserの紐づけ。`UNIQUE(provider, provider_user_id)`と`UNIQUE(user_id, provider)`を設定する。Provider側の可変なEmailではなく、不変なSubject IDを`provider_user_id`へ保存する。

#### sessions

`user_id`、`token_hash`、`expires_at`、`revoked_at`、`last_seen_at`、`created_at`を保持し、User削除時はCASCADEする。有効条件は`revoked_at IS NULL AND expires_at > now()`とする。Tokenはログイン時に一度だけ平文をCookieへ返し、DBにはハッシュのみ保存する。

#### platform_roles / platform_role_assignments

サービス全体の権限を管理する。初期Roleは`ADMIN`のみ。Assignmentの主キーは`(user_id, platform_role_id)`とする。

### 6.4 組織・店舗系

#### organizations

企業や運営法人など、店舗を所有する主体を表す。

#### organization_memberships

UserとOrganizationの関係。主キーは`(organization_id, user_id)`、Roleは`OWNER / MANAGER / VIEWER`、Statusは`INVITED / ACTIVE / SUSPENDED`とする。Userは複数Organizationへ所属できる。権限判定では`ACTIVE`だけを有効とする。

#### stores

NULL可の`organization_id`、店舗名、検索・重複確認用の`normalized_name`、郵便番号、都道府県、市区町村、住所、緯度・経度、外部店舗ID、Statusを持つ。運営組織が不明・未登録でも店舗と口コミを先に登録できる。口コミがある店舗は物理削除せず`INACTIVE`にする。

- Statusは`DRAFT / ACTIVE / INACTIVE / MERGED / DELETED`
- 緯度は-90～90、経度は-180～180のCHECK制約
- 外部IDがある場合は`UNIQUE(external_source, external_id)`
- `organization_id, normalized_name, postal_code, address`へ重複候補検索用Index
- 表記揺れを完全にはDB制約で排除せず、登録Use Caseで候補を提示する
- 統合機能が必要になった場合は`merged_into_store_id`を追加し、Reviewを移管する

#### categories / store_categories

業種分類をマスタ化する。店舗とCategoryは多対多で、関連テーブルの主キーは`(store_id, category_id)`とする。

### 6.5 口コミ系

#### 投稿コンテンツとしての境界

Reviewは、投稿者・本文・公開状態・作成日時を持つ点ではブログやSNSの投稿と同じ性質を持つ。一方で、対象店舗、勤務経験、質問回答、評価値を持つため、汎用的な`contents`や`posts`へ抽象化せず、店舗口コミを表すAggregate Rootとして扱う。

```text
Review（Aggregate Root）
├─ 投稿としての共通情報
│  ├─ author
│  ├─ summary
│  ├─ status
│  └─ created_at / updated_at
└─ 店舗口コミ固有の情報
   ├─ store
   ├─ employment
   ├─ review_answers
   └─ review_ratings
```

Reviewの作成・編集・削除は必ずReview Use Caseを経由する。Review AnswerやReview Ratingを単独で外部公開・更新しない。投稿時にはReview、Answers、Ratingsを1トランザクションで保存する。

ブログ記事や通常のSNS投稿を実際に扱う要件が追加されるまでは、共通親テーブルを作らない。

#### review_forms / review_questions

投稿時の質問構成をVersion管理する。公開済みFormは変更せず、新しいVersionを作成する。Questionは`UNIQUE(review_form_id, code)`とする。

FormのStatusは`DRAFT / PUBLISHED / RETIRED`とし、同時に`PUBLISHED`にできるFormは1件とする。公開済みFormとQuestionは削除・更新せず、新Versionを作成する。公開時は`published_at`を設定する。

```sql
CREATE UNIQUE INDEX review_forms_one_published
  ON review_forms ((true))
  WHERE status = 'PUBLISHED';
```

Questionは`min_length`と`max_length`を持ち、`0 <= min_length <= max_length`をCHECK制約で保証する。

#### rating_dimensions

現行フォームでは`atmosphere`、`training`、`workload`、`flexibility`の4評価軸を有効にする。旧`overall`は無効化し、総合点は保存値ではなく4軸の算術平均として計算する。評価軸追加時にReviewsのカラム変更は不要。

`review_form_rating_dimensions`でFormごとの評価軸、表示順、必須設定を管理する。主キーは`(review_form_id, rating_dimension_id)`とする。これにより、過去のFormで要求された評価軸を再現できる。

#### reviews

口コミの主体、勤務情報、公開状態、匿名表示用Snapshotを保持する。主なIndexは`store_id`、`user_id`、`(store_id, status, published_at DESC)`とする。

Statusは`DRAFT / PUBLISHED / HIDDEN / DELETED`、Employment Statusは`CURRENT / LEFT_RECENTLY / LEFT_LONG_AGO`とする。

- `employment_start_year` と `employment_end_year` は旧形式との移行用にnullableで残す。現行フォームでは収集せず、勤務期間は `work_duration` の区分で保存する
- 年が残る旧データでは `employment_start_year <= employment_end_year`、`CURRENT`の場合は`employment_end_year IS NULL`
- 未削除の口コミは同一User・Storeにつき1件とする
- `PUBLISHED`では`published_at IS NOT NULL`
- `HIDDEN`では`hidden_at`と`hidden_reason`を必須とする。`hidden_by_user_id`は監査用だが、User物理削除に備えてNULLを許容する
- `DELETED`では`deleted_at IS NOT NULL`
- `public_author_label`は旧形式との互換用にnullableで残す。現行の公開属性は在籍状況・立場・勤務期間からサーバー側で生成する
- 公開ResponseへUserのEmail、表示名、User IDを含めない
- `lock_version`を更新条件に含め、更新成功時に1加算する。値が一致しない場合は`409 Conflict`

```sql
CREATE UNIQUE INDEX reviews_active_author_store_unique
  ON reviews (store_id, user_id)
  WHERE deleted_at IS NULL;
```

Status遷移は次に限定する。

```text
DRAFT → PUBLISHED → HIDDEN
  │          │          │
  └──────────┴──────────┴→ DELETED
                  HIDDEN → PUBLISHED（管理者による再公開）
```

`summary`のカラム長は500文字だが、現行フォームとDBのCHECK制約は前後の空白を除いて30〜300文字を許可する。Questionの`label`は1〜300文字、`answer_text`はQuestionの`min_length`〜`max_length`とする。空白だけの値は保存しない。自由記述へ個人名・連絡先等を入力しない旨を投稿画面に表示する。

#### review_answers

主キーは`(review_id, review_question_id)`。`review_form_id`を冗長に保持し、次の複合外部キーでFormの混在をDBでも防ぐ。

```text
(review_id, review_form_id) → reviews(id, review_form_id)
(review_question_id, review_form_id) → review_questions(id, review_form_id)
```

この制約のため、参照先にも対応するUnique制約を設定する。必須Questionがすべて回答済みであることと文字数制限は公開Use Caseで検証する。

#### review_ratings

主キーは`(review_id, rating_dimension_id)`。`review_form_id`を冗長に保持し、`score`には1～5のCHECK制約を設定する。

```text
(review_id, review_form_id) → reviews(id, review_form_id)
(review_form_id, rating_dimension_id)
  → review_form_rating_dimensions(review_form_id, rating_dimension_id)
```

これによりFormにない評価軸をDBでも拒否する。必須評価軸がすべて存在することは公開Use Caseで検証する。

#### 投稿の周辺機能

SNS的な機能が必要になった場合は、Reviewを参照する独立テーブルとして追加する。

| テーブル | 状態・用途 | 主な一意制約 |
|---|---|---|
| review_reactions | 実装済み。3種類のリアクション | `(review_id, user_id, reaction_type)` |
| review_comments | 未実装。Reviewへのコメント・返信 | id |
| review_bookmarks | 未実装。アカウント単位の口コミ保存 | `(review_id, user_id)` |
| review_reports | 未実装。不適切なReviewの通報 | 要件確定時に定義 |

店舗の「気になる」はReview bookmarkではなく、店舗IDをブラウザの `localStorage` に保存する。複数種類の投稿に同じ機能を提供することが確定した場合に限り、共通Contentモデルへの再設計を検討する。

### 6.6 削除ルール

| 親 | 子 | 方針 |
|---|---|---|
| User | AuthAccount / Session | CASCADE |
| User | Review | Userを論理削除しReviewは保持 |
| Organization | Membership | CASCADE |
| Organization | Store | Organizationを論理削除しStoreは保持 |
| Review | Answer / Rating | CASCADE |
| ReviewForm | Question | 公開済みは削除禁止 |
| Category / RatingDimension | 利用データ | 物理削除せず無効化 |

外部キーの基本動作は次とする。

- 業務データの親（User、Organization、Store、ReviewForm）は`ON DELETE RESTRICT`
- Sessionと未使用のAuthAccountはUserの物理削除時に`ON DELETE CASCADE`
- Review削除時のAnswerとRatingは`ON DELETE CASCADE`。通常運用ではReview自体を論理削除する
- `hidden_by_user_id`はUserを論理削除するため通常維持し、例外的な物理削除では`ON DELETE SET NULL`
- 多対多の関連テーブルは、いずれかの親が物理削除された場合に`ON DELETE CASCADE`

### 6.7 初期データ

Seedで固定テストUserと5人のダミー投稿者、50店舗、Category、ReviewForm、4つのRatingDimension、214件のReviewを作成する。固定テストUserの投稿枠は空ける。Organization、Platform Role、Membershipの初期データは現在投入しない。

Seedは開発・テスト環境だけで実行可能にし、既存Reviewを削除・上書きせず、再実行しても重複しないようにする。Embeddingは生成しない。

### 6.8 Transactionと集計

- Review作成はReview、Answers、Ratings、公開状態の更新を1Transactionで行う
- Review編集も同じAggregate全体を1Transactionで更新し、`lock_version`で楽観ロックする
- ReviewForm公開は旧FormのRETIRED化と新FormのPUBLISHED化を1Transactionで行う
- Organizationから最後のOWNERを外す操作は禁止し、同一Transaction内で確認する
- 評価と件数は、4評価と勤務期間が揃った公開・非表示でないReviewだけから計算する
- 勤続期間と在籍状況を掛け合わせて評価軸別・総合点を重み付けし、`stores` の集計カラムへ小数第1位で保存する
- 評価順用の `bayesian_score` は全体平均3.2、事前重み3.0で少数口コミを補正する。表示値と最低評価の絞り込みは `overall_score` を使う
- Sessionの`last_seen_at`は毎Requestで更新せず、一定時間以上経過した場合だけ更新する

### 6.9 Migration受け入れ条件

- すべての単独主キーに`DEFAULT uuidv7()`がある
- ER図に記載した外部キー、Unique制約、CHECK制約、部分IndexがMigrationに含まれる
- `review_answers`と`review_ratings`のForm整合性を不正SQLの実行でも破れない
- 公開済みReviewFormの変更禁止をUse Caseテストで保証する
- Migrationを空DBへ適用し、Seed投入後に主要Queryの実行計画を確認する
- Down Migrationに依存せず、適用済みMigrationを変更しないForward-only運用とする

## 7. Server Function設計

```text
Route / Server Function → Zod検証 → Use Case → Repository / DB → 公開DTO
```

| Feature | 現在の主な処理 |
|---|---|
| Store | 一覧、検索、詳細取得、ページング、集計 |
| Review | 公開一覧、開発環境限定の投稿、リアクション |
| Saved | ブラウザ側で店舗IDを保存し、公開店舗だけ取得 |

Auth、口コミ編集・削除、Profile、Organizationは未実装。

DB Entityをそのまま画面へ返さず、Zodで定義したResponse Schemaへ変換する。

## 8. 環境変数

```env
DATABASE_URL=
ENABLE_DEV_REVIEW_POSTING=false
DEV_DATABASE_NAME=example_dev
BASIC_AUTH_USER=
BASIC_AUTH_PASSWORD=
SESSION_SECRET=
```

`.env`はGitへ追加しない。`BASIC_AUTH_USER`、`BASIC_AUTH_PASSWORD`、`SESSION_SECRET` は将来用であり、現在の認証には使用していない。開発用投稿は `ENABLE_DEV_REVIEW_POSTING` と `DEV_DATABASE_NAME` に加え、`NODE_ENV`、localhost、実際のDB名をサーバー側で検証する。

## 9. テスト方針

- Zod Schemaは正常値、境界値、不正値を検証
- 検索、公開条件、属性の粗粒度化、投稿日、評価集計、お気に入りをVitestで検証
- 投稿、開発環境拒否、同意、文字数、禁止語、重複、リアクションをVitestで検証
- 公開Responseに内部User ID、正確な日時、同意日時が含まれないことを確認
- CIでMigration適用、Seedの再実行、Drizzleスキーマとの差分を確認
- Playwright等のE2Eテストは未導入。主要ブラウザ動線は手動確認する

## 10. 初期スコープ外

- Google OAuth等の外部認証
- AI口コミ分析、自然言語検索、Embedding、pgvector
- 画像アップロード
- コメント、アカウント単位のブックマーク
- 通報・本格モデレーション
- 本番向けの認証・公開投稿・運用設計
- Nativeアプリ向けAPI
