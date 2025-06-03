# コミット履歴

このファイルは、WSL環境でのGit権限問題のため、手動でコミット履歴を管理するものです。
実際の開発環境では、以下のコマンドでGitコミットを実行してください。

## 初期コミット

### 1. プロジェクト初期設定
```bash
git init
git add .gitignore README.md package.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.js
git commit -m "chore: Next.js 14プロジェクトの初期設定

- Next.js 14 with App Router
- TypeScript設定
- Tailwind CSS設定
- 基本的な設定ファイル"
```

### 2. プロジェクト構造とユーティリティ
```bash
git add src/app/layout.tsx src/app/globals.css src/app/page.tsx src/lib/utils.ts
git add src/middleware.ts components.json
git commit -m "feat: 基本的なプロジェクト構造を作成

- src/ディレクトリ構造
- アプリケーションレイアウト
- ユーティリティ関数（cn）
- ミドルウェア設定"
```

### 3. 環境変数と設定ファイル
```bash
git add .env.example .env.local .eslintrc.json .prettierrc .vscode/
git commit -m "chore: 開発環境設定ファイルを追加

- ESLint設定
- Prettier設定
- VSCode設定
- 環境変数テンプレート"
```

### 4. データベース設計
```bash
git add prisma/schema.prisma prisma/seed.ts
git commit -m "feat: Prismaスキーマとシードデータを作成

- 全10テーブルのスキーマ定義
- users, admins, fortune_types等
- 開発用シードデータ"
```

### 5. Supabase統合
```bash
git add src/lib/supabase/
git commit -m "feat: Supabase接続設定を追加

- クライアント用ヘルパー
- サーバー用ヘルパー
- ミドルウェア用ヘルパー"
```

### 6. tRPC設定
```bash
git add src/server/api/ src/lib/trpc/ src/app/api/trpc/ src/app/_components/providers.tsx src/app/_components/shared.ts
git commit -m "feat: tRPCの初期設定を実装

- tRPCサーバー設定
- tRPCクライアント設定
- React Queryプロバイダー
- API Route設定"
```

### 7. Prismaクライアント設定
```bash
git add src/server/db/
git commit -m "feat: Prismaクライアントを設定

- グローバルPrismaインスタンス
- 開発環境用ログ設定"
```

### 8. 環境変数管理
```bash
git add src/env.js
git commit -m "feat: 型安全な環境変数管理を追加

- @t3-oss/env-nextjs統合
- Zodによる環境変数検証"
```

### 9. 認証システム（NextAuth.js）
```bash
git add src/lib/auth/ src/app/api/auth/ src/types/next-auth.d.ts src/app/_components/auth-provider.tsx
git commit -m "feat(auth): NextAuth.js v5の認証システムを実装

- Credentialsプロバイダー設定
- JWT戦略
- セッション管理
- 型定義"
```

### 10. UIコンポーネント（shadcn/ui）
```bash
git add src/components/ui/
git commit -m "feat(ui): shadcn/ui基本コンポーネントを追加

- Button
- Input
- Label
- Card"
```

### 11. 認証フォーム
```bash
git add src/components/forms/auth-form.tsx
git commit -m "feat(auth): ログイン・サインアップフォームを実装

- React Hook Form統合
- Zod検証
- エラーハンドリング"
```

### 12. 認証ページ
```bash
git add src/app/\(auth\)/ src/app/api/auth/signup/
git commit -m "feat(auth): ログイン・サインアップページを作成

- ログインページ
- サインアップページ
- サインアップAPI（初回ボーナス3クレジット）"
```

### 13. レイアウトコンポーネント
```bash
git add src/components/layouts/
git commit -m "feat(ui): ヘッダー・フッターコンポーネントを作成

- ヘッダー（ナビゲーション、クレジット表示）
- フッター（リンク集）"
```

### 14. メインレイアウトとダッシュボード
```bash
git add src/app/\(main\)/
git commit -m "feat: 認証済みユーザー用レイアウトとダッシュボードを作成

- 認証チェック付きレイアウト
- ダッシュボードページ"
```

### 15. ホームページ更新
```bash
git add src/app/page.tsx
git commit -m "feat: ホームページにログイン・新規登録ボタンを追加"
```

### 16. ドキュメント
```bash
git add CLAUDE.md docs/
git commit -m "docs: プロジェクトドキュメントを整備

- CLAUDE.md（開発ガイド）
- 要件定義書等のドキュメント"
```

## 実行手順

1. まず、Git設定を確認：
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global core.filemode false
```

2. リポジトリを初期化：
```bash
git init -b main
```

3. 上記のコミットを順番に実行

4. リモートリポジトリに接続（GitHubなどを使用する場合）：
```bash
git remote add origin https://github.com/your-username/ai-fortune-teller.git
git push -u origin main
```