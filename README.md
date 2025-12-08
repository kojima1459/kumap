# クマップ（Kumap） - Bear Sighting Information Map

**クマ出没情報マップ** - 日本全国のクマ目撃情報を地図上で可視化し、地域住民の安全を守るためのWebアプリケーション

![クマップロゴ](client/public/logo.png)

---

## 概要

クマップは、日本全国のクマ出没情報をリアルタイムで収集・可視化するWebアプリケーションです。公式データのスクレイピングとユーザー投稿の両方に対応し、地域住民がクマの出没状況を把握できるようにすることで、安全な生活をサポートします。

### 主な機能

- 📍 **地図上での出没情報表示**: Google Mapsを使用した直感的なマーカー表示
- 🔍 **フィルタリング機能**: 都道府県・期間・情報源（公式/ユーザー）による絞り込み
- 📝 **ユーザー投稿**: 認証ユーザーによる目撃情報の投稿
- 🤖 **自動スクレイピング**: Yahoo!ニュースから毎日自動的に最新情報を取得
- 🔔 **通知機能**: 都道府県別の新規出没情報をメール通知
- 📊 **統計表示**: 都道府県別の出没件数を地図上で可視化
- 🔐 **管理者機能**: ユーザー投稿の承認・却下

---

## 技術スタック

### フロントエンド

- **React 19** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Tailwind CSS 4** - スタイリング
- **shadcn/ui** - UIコンポーネントライブラリ
- **Wouter** - ルーティング
- **tRPC** - 型安全なAPI通信
- **Google Maps JavaScript API** - 地図表示

### バックエンド

- **Express 4** - Webフレームワーク
- **tRPC 11** - 型安全なRPCフレームワーク
- **Drizzle ORM** - データベースORM
- **MySQL/TiDB** - データベース
- **Axios** - HTTPクライアント
- **Cheerio** - HTMLパース（スクレイピング用）

### インフラ・ツール

- **Vite** - ビルドツール
- **Vitest** - テストフレームワーク
- **pnpm** - パッケージマネージャー
- **Manus Platform** - ホスティング・認証・通知

---

## セットアップ

### 必要な環境

- Node.js 22.13.0以上
- pnpm 9.x以上
- MySQL 8.0以上（またはTiDB）

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd bear_map_app

# 依存関係をインストール
pnpm install

# データベースマイグレーション
pnpm db:push

# 開発サーバーを起動
pnpm dev
```

### 環境変数

環境変数はManus管理UIから設定してください。詳細は[環境変数管理ガイド](docs/environment_variables.md)を参照してください。

---

## プロジェクト構造

```
bear_map_app/
├── client/                 # フロントエンドコード
│   ├── public/            # 静的ファイル（ロゴ、画像など）
│   └── src/
│       ├── pages/         # ページコンポーネント
│       ├── components/    # 再利用可能なコンポーネント
│       ├── lib/           # ユーティリティ・tRPCクライアント
│       └── App.tsx        # ルーティング設定
├── server/                # バックエンドコード
│   ├── _core/             # フレームワークコア（OAuth、tRPC、LLMなど）
│   ├── routers.ts         # tRPCルーター定義
│   ├── db.ts              # データベースヘルパー
│   ├── scraper.ts         # スクレイピングロジック
│   ├── notificationService.ts  # 通知サービス
│   └── utils/             # ユーティリティ関数
├── drizzle/               # データベーススキーマ・マイグレーション
│   └── schema.ts          # テーブル定義
├── shared/                # フロントエンド・バックエンド共通コード
│   └── constants.ts       # 定数定義
├── docs/                  # ドキュメント
│   ├── code_review_report.md       # コードレビューレポート
│   └── environment_variables.md    # 環境変数ガイド
└── marketing/             # マーケティング素材
    ├── twitter_posts.md   # X宣伝文章
    ├── ad_image_*.png     # 広告画像
    └── logo_kumap.png     # ロゴ
```

---

## 開発ワークフロー

### 1. 機能開発

```bash
# 新しいブランチを作成
git checkout -b feature/new-feature

# コードを編集
# ...

# テストを実行
pnpm test

# コミット
git add .
git commit -m "Add new feature"

# プッシュ
git push origin feature/new-feature
```

### 2. データベーススキーマ変更

```bash
# drizzle/schema.ts を編集
# ...

# マイグレーションを生成・適用
pnpm db:push
```

### 3. チェックポイント作成

重要な機能追加やバグ修正後は、Manus管理UIから「Save Checkpoint」を実行してください。

---

## テスト

```bash
# 全テストを実行
pnpm test

# 特定のテストファイルを実行
pnpm test server/bearSightings.test.ts

# カバレッジレポートを生成
pnpm test:coverage
```

---

## デプロイ

### Manusプラットフォームへのデプロイ

1. Manus管理UIで「Save Checkpoint」を実行
2. 「Publish」ボタンをクリック
3. デプロイが完了すると、自動的にURLが発行されます

### カスタムドメインの設定

1. Manus管理UI → 「Settings」 → 「Domains」
2. カスタムドメインを追加
3. DNSレコードを設定

---

## API仕様

### tRPCルーター

#### `bearSightings.list`

クマ出没情報の一覧を取得

**入力**:
```typescript
{
  prefecture?: string;
  startDate?: Date;
  endDate?: Date;
  sourceType?: "official" | "user";
}
```

**出力**:
```typescript
BearSighting[]
```

#### `bearSightings.submit`

クマ出没情報を投稿（認証必須）

**入力**:
```typescript
{
  prefecture: string;
  city?: string;
  location?: string;
  latitude: string;
  longitude: string;
  sightedAt: Date;
  bearType?: string;
  description?: string;
  imageUrl?: string;
}
```

**出力**:
```typescript
BearSighting
```

#### `bearSightings.updateStatus`

出没情報のステータスを更新（管理者のみ）

**入力**:
```typescript
{
  id: number;
  status: "approved" | "rejected" | "pending";
}
```

**出力**:
```typescript
void
```

#### `stats.prefectureStats`

都道府県別の出没件数統計を取得

**出力**:
```typescript
{
  prefecture: string;
  count: number;
  percentage: number;
}[]
```

#### `notifications.getPreferences`

ユーザーの通知設定を取得（認証必須）

**出力**:
```typescript
NotificationPreference[]
```

#### `notifications.upsertPreference`

通知設定を追加・更新（認証必須）

**入力**:
```typescript
{
  prefecture: string;
  enabled: boolean;
}
```

---

## トラブルシューティング

### データベース接続エラー

**症状**: `Database not available`エラーが表示される

**解決方法**:
1. `DATABASE_URL`環境変数が正しく設定されているか確認
2. データベースサーバーが起動しているか確認
3. ファイアウォール設定を確認

### スクレイピングが失敗する

**症状**: 自動スクレイピングでエラーが発生する

**解決方法**:
1. Yahoo!ニュースのページ構造が変更されていないか確認
2. ネットワーク接続を確認
3. User-Agentヘッダーが正しく設定されているか確認

### 地図が表示されない

**症状**: Google Mapsが表示されない

**解決方法**:
1. Google Maps APIキーが正しく設定されているか確認（Manusプロキシを使用している場合は不要）
2. ブラウザのコンソールでエラーメッセージを確認
3. ネットワーク接続を確認

---

## コントリビューション

プルリクエストを歓迎します！以下のガイドラインに従ってください：

1. フォークしてブランチを作成
2. コードを変更
3. テストを追加・実行
4. プルリクエストを作成

---

## ライセンス

MIT License

---

## 作者

**Manus AI** - [https://manus.im](https://manus.im)

---

## 問い合わせ

- **Email**: [email protected]
- **GitHub Issues**: [リポジトリURL]/issues
- **X (Twitter)**: [@kumap_official](https://twitter.com/kumap_official)

---

## 寄付

クマップの開発を支援していただける場合は、以下の方法で寄付をお願いします：

- **GitHub Sponsors**: [スポンサーページURL]
- **Buy Me a Coffee**: [寄付ページURL]

---

## 謝辞

- Yahoo!ニュース - クマ出没情報の提供
- 各都道府県の公式サイト - 詳細な出没情報の提供
- Manusプラットフォーム - ホスティング・認証・通知機能の提供
- オープンソースコミュニティ - 使用しているライブラリの開発者の皆様

---

**最終更新**: 2025年12月8日
