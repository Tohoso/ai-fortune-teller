# AI占い自動鑑定システム

AI（Claude API）を使用した本格的な占い鑑定システムです。

## 技術スタック

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, tRPC
- **Database**: PostgreSQL (Supabase), Prisma ORM
- **Authentication**: NextAuth.js v5
- **AI**: Anthropic Claude API
- **Payment**: Stripe
- **UI Components**: shadcn/ui

## セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定
```bash
cp .env.example .env.local
# .env.localを編集して実際の値を設定
```

3. データベースのセットアップ
```bash
npm run db:push
npm run db:seed
```

4. 開発サーバーの起動
```bash
npm run dev
```

## 開発コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run start        # プロダクションサーバー起動
npm run lint         # Lintチェック
npm run type-check   # 型チェック
npm run format       # コードフォーマット
npm run db:studio    # Prisma Studio起動
```

## プロジェクト構造

```
src/
├── app/             # Next.js App Router
├── components/      # Reactコンポーネント
├── lib/            # ユーティリティ関数
├── server/         # サーバーサイドロジック
├── types/          # TypeScript型定義
└── hooks/          # カスタムフック
```