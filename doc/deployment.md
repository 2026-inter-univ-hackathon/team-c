# 開発版のデモへの自動デプロイ

`main` 更新 → 既存の `CI` 成功 → `Deploy development demo` → 10.229.0.31 を更新・再起動。

同じリポジトリのself-hosted runnerを使用します。定期監視や別のデプロイリポジトリは使いません。PRのCIからはデプロイしません。CIが確認したコミットを取得し、最新のmainである場合だけ反映します。

アプリのソースは無改変です。`pnpm install --frozen-lockfile` で依存を準備し、DBマイグレーション後に元の `dev` スクリプトを `npm run dev -- --host 127.0.0.1 --port 3000 --strictPort` で起動します。

- URL: http://10.229.0.31/
- Node.js 24 / PostgreSQL 18 / Nginx / systemd
- アプリ: `systemctl status team-c`、ログ: `journalctl -u team-c`
- ソース: `/opt/team-c/current`
- 環境設定: `/etc/team-c/app.env`（接続情報をGitへ保存しない）
- 投稿設定: `NODE_ENV=development`、`ENABLE_DEV_REVIEW_POSTING=true`、`DEV_DATABASE_NAME=team_c_dev`、ローカルDB接続

`deploy/install-release.sh` をサーバーの `/usr/local/sbin/team-c-deploy` にroot所有で配置しています。runnerはこのコマンドのみsudoで実行できます。変更する場合は管理者がサーバーにも反映してください。

更新前にDBを `/var/backups/team-c` へバックアップし、直前のコードを保持します。起動確認に失敗した場合は前のコードへ戻します。DBマイグレーションは自動では巻き戻しません。投稿データは通常の更新では消えません。
