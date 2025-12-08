# 環境変数管理ガイド

## 概要

本プロジェクトでは、環境変数を使用してアプリケーションの設定を管理しています。環境変数は`.env`ファイルに保存され、Gitリポジトリには含まれません（`.gitignore`で除外）。

## 環境変数の種類

### 1. データベース設定

- `DATABASE_URL`: MySQLデータベースの接続文字列
  - 形式: `mysql://user:password@host:port/database`
  - 例: `mysql://root:password@localhost:3306/bear_map`

### 2. 認証設定

- `JWT_SECRET`: セッションCookieの署名に使用する秘密鍵
- `VITE_APP_ID`: Manus OAuthアプリケーションID
- `OAUTH_SERVER_URL`: Manus OAuthサーバーURL
- `VITE_OAUTH_PORTAL_URL`: Manusログインポータル URL（フロントエンド用）

### 3. オーナー情報

- `OWNER_OPEN_ID`: プロジェクトオーナーのOpenID
- `OWNER_NAME`: プロジェクトオーナーの名前

### 4. Manus Built-in APIs

- `BUILT_IN_FORGE_API_URL`: Manus APIのベースURL（バックエンド用）
- `BUILT_IN_FORGE_API_KEY`: Manus APIキー（バックエンド用）
- `VITE_FRONTEND_FORGE_API_URL`: Manus APIのベースURL（フロントエンド用）
- `VITE_FRONTEND_FORGE_API_KEY`: Manus APIキー（フロントエンド用）

### 5. アナリティクス（オプション）

- `VITE_ANALYTICS_ENDPOINT`: アナリティクスエンドポイント
- `VITE_ANALYTICS_WEBSITE_ID`: ウェブサイトID

### 6. アプリケーションブランディング

- `VITE_APP_TITLE`: アプリケーションのタイトル（例: "クマップ"）
- `VITE_APP_LOGO`: ロゴ画像のパス（例: "/logo.png"）

### 7. Node環境

- `NODE_ENV`: 実行環境（`development` または `production`）

## セキュリティベストプラクティス

### 1. `.env`ファイルの管理

- ✅ `.env`ファイルは`.gitignore`に含まれており、Gitリポジトリにコミットされません
- ✅ 本番環境では、環境変数はホスティングプラットフォームの設定画面から管理してください
- ❌ `.env`ファイルを直接Gitにコミットしないでください

### 2. フロントエンドへの環境変数の露出

- ✅ `VITE_`プレフィックスを持つ環境変数のみがフロントエンドに公開されます
- ❌ APIキーやデータベース認証情報など、機密情報を`VITE_`プレフィックスで公開しないでください
- ✅ バックエンドのみで使用する環境変数には`VITE_`プレフィックスを付けないでください

### 3. シークレットスキャン

以下のツールを使用して、誤ってコミットされたシークレットを検出できます：

- [git-secrets](https://github.com/awslabs/git-secrets)
- [truffleHog](https://github.com/trufflesecurity/trufflehog)
- [detect-secrets](https://github.com/Yelp/detect-secrets)

### 4. 環境変数のローテーション

- 定期的にAPIキーやJWT_SECRETをローテーションしてください
- 漏洩が疑われる場合は、直ちに環境変数を変更してください

## 開発環境のセットアップ

1. プロジェクトをクローン
2. Manus管理UIから環境変数を設定
3. アプリケーションを起動: `pnpm dev`

## 本番環境のデプロイ

1. Manus管理UIの「Publish」ボタンからデプロイ
2. 環境変数は自動的に本番環境に適用されます
3. カスタムドメインを設定する場合は、「Settings」→「Domains」から設定

## トラブルシューティング

### 環境変数が読み込まれない

- サーバーを再起動してください: `pnpm dev`
- 環境変数の名前が正しいか確認してください
- フロントエンドで使用する場合は、`VITE_`プレフィックスが付いているか確認してください

### データベース接続エラー

- `DATABASE_URL`が正しい形式か確認してください
- データベースサーバーが起動しているか確認してください
- ファイアウォール設定を確認してください

## 参考資料

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Drizzle ORM Configuration](https://orm.drizzle.team/docs/get-started-mysql)
- [Manus Documentation](https://docs.manus.im)
