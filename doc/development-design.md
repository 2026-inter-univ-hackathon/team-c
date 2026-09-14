# アルバイト口コミWebアプリ 開発設計書

## 1. 目的

本書はMVPを実装するための技術構成、コード配置、認証・認可、DB設計を定義する。初期段階では機能開発を優先し、デプロイとAI機能は対象外とする。

## 2. 技術スタック

| 領域 | 採用技術 |
|---|---|
| Full-stack | TanStack Start |
| Language | TypeScript（strict） |
| UI | React / Tailwind CSS / shadcn/ui |
| Routing | TanStack Router |
| Server state | TanStack Query |
| Form | TanStack Form |
| Validation | Zod |
| Database | PostgreSQL |
| ORM / Migration | Drizzle ORM / Drizzle Kit |
| Authentication | 開発用HTTP Basic認証＋アプリ内セッション |
| Unit test | Vitest |
| E2E test | Playwright |
| Package manager | pnpm |

単一のTanStack Startアプリとして構築し、独立したBackendやモノレポは設けない。

## 3. アプリケーション構成

```text
Browser
  ↓
TanStack Start
  ├─ Routes / UI
  ├─ Server Functions
  ├─ AuthAdapter / Authorization Policy
  ├─ Use Cases
  └─ Drizzle ORM
        ↓
    PostgreSQL
```

画面からのみ使う処理はServer Functionsとして実装する。外部クライアント向けAPIが必要になった場合だけServer Routesを追加し、同じUse Caseを呼び出す。

## 4. ディレクトリ構成

```text
src/
├─ routes/                 # TanStack RouterのRoute
├─ features/
│  ├─ auth/
│  ├─ stores/
│  ├─ reviews/
│  ├─ profile/
│  └─ companies/
├─ components/             # 複数Featureで使うUI
├─ server/
│  ├─ auth/                # AuthAdapterと認可処理
│  ├─ use-cases/           # 業務処理
│  └─ errors/              # 共通エラー
├─ db/
│  ├─ schema/              # Drizzle schema
│  ├─ migrations/
│  ├─ seed.ts
│  └─ client.ts
├─ schemas/                # 共有Zod schema
└─ lib/                    # 副作用を持たない共通処理
```

RouteからDrizzleを直接呼ばず、Server FunctionからUse Caseを経由してDBへアクセスする。

## 5. 認証・認可

### 5.1 基本方針

認証方式と業務ロジックを分離する。業務処理がBasic認証、Google OAuth等の具体的な方式を判定してはならない。

```ts
type AuthenticatedUser = {
  userId: string
  role: "USER" | "COMPANY" | "ADMIN"
}

interface AuthAdapter {
  authenticate(request: Request): Promise<AuthenticatedUser | null>
}
```

初期実装は`BasicAuthAdapter`とする。Basic認証は開発環境への入口として使用し、通過後に固定テストユーザーを選択してアプリ内セッションを発行する。

```text
Basic認証 → テストユーザー選択 → アプリ内セッション → 認可判定
```

将来は`GoogleAuthAdapter`等を追加する。外部サービスのユーザーIDは`auth_identities`でアプリ内の`users.id`に紐づけるため、Reviews等の業務テーブルは変更しない。

### 5.2 認可ルール

| 操作 | 条件 |
|---|---|
| 店舗・口コミ閲覧 | 認証済みユーザー |
| 口コミ投稿 | USERまたはADMIN |
| 口コミ編集・削除 | 投稿者本人またはADMIN |
| 企業ダッシュボード | COMPANYまたはADMIN |
| 企業の店舗情報閲覧 | 対象企業のCompanyMemberまたはADMIN |
| 管理操作 | ADMIN |

- 未認証は`401 Unauthorized`
- 権限不足は`403 Forbidden`
- Basic認証の資格情報は環境変数で管理し、DBへ保存しない
- アプリ内セッショントークンはCookieへ`HttpOnly`、`SameSite=Lax`で保存する
- DBにはセッショントークンのハッシュだけを保存する

## 6. DB設計

### 6.1 共通方針

- 主キーはUUIDを使用する
- 日時は`timestamp with time zone`を使用する
- テーブル名・カラム名は`snake_case`とする
- 外部キーを持つカラムには原則Indexを付与する
- Roleなど選択肢が増える可能性のある値は、DB enumではなく`varchar`＋CHECK制約で管理する
- 物理削除が必要な場合は参照関係を確認し、原則としてユーザー操作では論理削除を使用する

### 6.2 ER図

```text
users ──< auth_identities
  │
  ├──< sessions
  ├──< reviews >── stores >── companies
  └──< company_members >─────────┘
```

### 6.3 users

認証方式に依存しないアプリ内ユーザーを保持する。

| カラム | 型 | 制約・説明 |
|---|---|---|
| id | uuid | PK |
| email | varchar(320) | NOT NULL、UNIQUE、小文字へ正規化 |
| display_name | varchar(100) | NOT NULL |
| avatar_url | text | NULL可 |
| role | varchar(20) | NOT NULL、`USER / COMPANY / ADMIN` |
| status | varchar(20) | NOT NULL、`ACTIVE / SUSPENDED / DELETED` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Index：`email`のUnique Index、`role`、`status`

### 6.4 auth_identities

外部認証とアプリ内ユーザーの対応を保持する。Basic認証では使用せず、Google等の導入時に使用する。

| カラム | 型 | 制約・説明 |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → users.id、NOT NULL |
| provider | varchar(50) | NOT NULL、例：`google` |
| provider_user_id | varchar(255) | NOT NULL、Provider側の不変ID |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

制約：`UNIQUE(provider, provider_user_id)`、`UNIQUE(user_id, provider)`

削除：User削除時にCASCADE

### 6.5 sessions

認証後のアプリ内セッションを保持する。

| カラム | 型 | 制約・説明 |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → users.id、NOT NULL |
| token_hash | varchar(255) | NOT NULL、UNIQUE |
| expires_at | timestamptz | NOT NULL |
| created_at | timestamptz | NOT NULL |
| last_seen_at | timestamptz | NULL可 |

Index：`user_id`、`expires_at`

削除：User削除時にCASCADE。期限切れセッションは定期的またはログイン時に削除する。

### 6.6 companies

企業情報を保持する。

| カラム | 型 | 制約・説明 |
|---|---|---|
| id | uuid | PK |
| name | varchar(200) | NOT NULL |
| status | varchar(20) | NOT NULL、`ACTIVE / INACTIVE` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Index：`name`

### 6.7 company_members

企業ユーザーと企業の所属関係を保持する。

| カラム | 型 | 制約・説明 |
|---|---|---|
| id | uuid | PK |
| company_id | uuid | FK → companies.id、NOT NULL |
| user_id | uuid | FK → users.id、NOT NULL |
| member_role | varchar(20) | NOT NULL、初期値`MEMBER` |
| created_at | timestamptz | NOT NULL |

制約：`UNIQUE(company_id, user_id)`

Index：`company_id`、`user_id`

削除：CompanyまたはUser削除時にCASCADE

### 6.8 stores

口コミの対象となる店舗を保持する。

| カラム | 型 | 制約・説明 |
|---|---|---|
| id | uuid | PK |
| company_id | uuid | FK → companies.id、NOT NULL |
| name | varchar(200) | NOT NULL |
| industry | varchar(100) | NOT NULL |
| prefecture | varchar(20) | NOT NULL |
| city | varchar(100) | NOT NULL |
| address | varchar(255) | NULL可 |
| status | varchar(20) | NOT NULL、`ACTIVE / INACTIVE` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Index：`company_id`、`name`、`industry`、`(prefecture, city)`、`status`

削除：口コミが存在する店舗は物理削除せず`INACTIVE`にする。

### 6.9 reviews

勤務経験と口コミ回答を保持する。

| カラム | 型 | 制約・説明 |
|---|---|---|
| id | uuid | PK |
| store_id | uuid | FK → stores.id、NOT NULL |
| user_id | uuid | FK → users.id、NOT NULL |
| employment_start_year | smallint | NULL可 |
| employment_end_year | smallint | NULL可、在職中はNULL |
| employment_status | varchar(20) | NOT NULL、`CURRENT / FORMER` |
| overall_rating | smallint | NOT NULL、1～5 |
| atmosphere_rating | smallint | NOT NULL、1～5 |
| relationship_rating | smallint | NOT NULL、1～5 |
| training_rating | smallint | NOT NULL、1～5 |
| workload_rating | smallint | NOT NULL、1～5 |
| beginner_trap | text | NOT NULL |
| reaction_to_mistake | text | NOT NULL |
| busiest_moment | text | NOT NULL |
| hidden_reality | text | NOT NULL |
| advice_for_newcomer | text | NOT NULL |
| summary | varchar(500) | NOT NULL |
| status | varchar(20) | NOT NULL、`PUBLISHED / HIDDEN / DELETED` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

制約：各Ratingは`CHECK (rating BETWEEN 1 AND 5)`、開始年は終了年以下

Index：`store_id`、`user_id`、`status`、`(store_id, status, created_at DESC)`

削除：ユーザー操作では`DELETED`へ変更する。通常の一覧・集計は`PUBLISHED`のみ対象とする。

### 6.10 初期データ

開発環境ではSeedで以下を作成する。

| ユーザー | Role | 用途 |
|---|---|---|
| user@test.local | USER | 一般ユーザー操作 |
| company@test.local | COMPANY | 企業画面操作 |
| admin@test.local | ADMIN | 管理操作 |

併せてCompany、CompanyMember、Store、Reviewの確認用データを投入する。Seedは開発・テスト環境だけで実行可能にする。

## 7. Server Function設計

Server Functionは次の順序で処理する。

```text
認証 → Zod検証 → 認可 → Use Case → DB → Response
```

主な処理単位：

| Feature | 処理 |
|---|---|
| Auth | テストユーザー選択、セッション取得、ログアウト |
| Store | 一覧、検索、詳細取得 |
| Review | 一覧、詳細、投稿、編集、削除 |
| Profile | 自分の情報、投稿履歴取得 |
| Company | 所属店舗一覧、店舗別評価・口コミ取得 |

DB Entityをそのまま画面へ返さず、必要な項目だけをResponse Schemaで返す。

## 8. 環境変数

```env
DATABASE_URL=
BASIC_AUTH_USER=
BASIC_AUTH_PASSWORD=
SESSION_SECRET=
```

- `.env`をGitへ追加しない
- `.env.example`には値を含めず変数名だけを記載する
- 起動時にZodで必須環境変数を検証する

## 9. テスト方針

- 認可PolicyはRoleと所有者条件をVitestで網羅する
- Zod schemaは正常値、境界値、不正値を検証する
- Use Caseは認証方式に依存させず、テスト用AuthAdapterで検証する
- PlaywrightでUSERの口コミ投稿とCOMPANYの店舗確認を検証する
- Migration適用後にSeedを投入し、主要Server Functionの疎通を確認する

## 10. 初期スコープ外

- Google OAuth等の外部認証
- AI口コミ分析、自然言語検索、Embedding
- pgvector
- 画像アップロード
- 通報・本格モデレーション
- デプロイ・本番インフラ設計
- Nativeアプリ向けAPI

