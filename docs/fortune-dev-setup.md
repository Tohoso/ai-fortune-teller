# 占い自動鑑定システム 開発環境構築手順書

## 1. 前提条件

### 1.1 必要なソフトウェア
- **OS**: Windows 10/11, macOS 12+, Ubuntu 20.04+
- **Node.js**: v20.x LTS
- **npm**: v10.x
- **Git**: v2.x
- **VSCode**: 最新版

### 1.2 必要なアカウント
- GitHub
- Vercel
- Supabase
- Anthropic (Claude API)
- Stripe
- Resend
- Uploadthing

## 2. 開発環境構築手順

### 2.1 リポジトリのクローン
```bash
# リポジトリをクローン
git clone https://github.com/your-org/fortune-telling-system.git
cd fortune-telling-system

# 開発ブランチに切り替え
git checkout -b develop origin/develop
```

### 2.2 Node.jsのインストール
```bash
# nvmを使用する場合（推奨）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# バージョン確認
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 2.3 依存関係のインストール
```bash
# パッケージのインストール
npm install

# 開発用パッケージも含めてインストール
npm install --include=dev
```

### 2.4 環境変数の設定
```bash
# .env.localファイルを作成
cp .env.example .env.local
```

`.env.local`を編集:
```env
# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000

# データベース（Supabase）
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# 認証（NextAuth）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[生成したシークレット]

# AI（Anthropic Claude）
CLAUDE_API_KEY=sk-ant-api03-[YOUR-API-KEY]

# 決済（Stripe）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[YOUR-PUBLISHABLE-KEY]
STRIPE_SECRET_KEY=sk_test_[YOUR-SECRET-KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR-WEBHOOK-SECRET]

# メール（Resend）
RESEND_API_KEY=re_[YOUR-API-KEY]

# ファイルアップロード（Uploadthing）
UPLOADTHING_SECRET=sk_live_[YOUR-SECRET]
UPLOADTHING_APP_ID=[YOUR-APP-ID]

# Redis（Bull Queue）
REDIS_URL=redis://localhost:6379
```

### 2.5 データベースのセットアップ

#### Supabaseプロジェクトの作成
1. https://supabase.com にアクセス
2. 新規プロジェクトを作成
3. プロジェクトの設定から接続情報を取得

#### Prismaのセットアップ
```bash
# Prismaクライアントの生成
npx prisma generate

# データベースマイグレーション
npx prisma migrate dev --name init

# シードデータの投入
npx prisma db seed
```

### 2.6 Redisのセットアップ（ローカル開発）
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt update
sudo apt install redis-server
sudo systemctl start redis

# Windows (WSL2推奨)
sudo apt update
sudo apt install redis-server
sudo service redis-server start

# 動作確認
redis-cli ping
# PONG と返ってくればOK
```

### 2.7 Stripeのセットアップ
```bash
# Stripe CLIのインストール
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Ubuntu
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe

# ログイン
stripe login

# Webhookのフォワーディング（開発時）
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

## 3. VSCode設定

### 3.1 必須拡張機能
以下の拡張機能をインストール:

```json
{
  "recommendations": [
    // 基本
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    
    // React/Next.js
    "dsznajder.es7-react-js-snippets",
    "formulahendry.auto-rename-tag",
    "naumovs.color-highlight",
    
    // Tailwind CSS
    "bradlc.vscode-tailwindcss",
    
    // Prisma
    "prisma.prisma",
    
    // Git
    "eamodio.gitlens",
    "mhutchie.git-graph",
    
    // その他便利ツール
    "christian-kohler.path-intellisense",
    "aaron-bond.better-comments",
    "streetsidesoftware.code-spell-checker",
    "usernamehw.errorlens",
    "yoavbls.pretty-ts-errors",
    
    // AI補助
    "github.copilot",
    "github.copilot-chat"
  ]
}
```

### 3.2 VSCode設定ファイル
`.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "editor.quickSuggestions": {
    "strings": true
  }
}
```

### 3.3 デバッグ設定
`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

## 4. 開発サーバーの起動

### 4.1 基本的な起動方法
```bash
# 開発サーバーの起動
npm run dev

# 別ターミナルでRedisの起動確認
redis-cli ping

# 別ターミナルでStripe Webhookの起動
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

### 4.2 並列起動スクリプト
`package.json`に追加:
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:all": "concurrently \"npm run dev\" \"stripe listen --forward-to localhost:3000/api/webhook/stripe\"",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{js,ts,tsx,md,json}\"",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  }
}
```

### 4.3 動作確認
1. http://localhost:3000 にアクセス
2. ログイン画面が表示されることを確認
3. Prisma Studioでデータベースを確認
   ```bash
   npm run db:studio
   ```

## 5. トラブルシューティング

### 5.1 よくある問題と解決方法

#### Node.jsバージョンエラー
```bash
# エラー: The engine "node" is incompatible with this module
# 解決方法:
nvm use 20
```

#### Prismaエラー
```bash
# エラー: Can't reach database server
# 解決方法:
# 1. DATABASE_URLが正しいか確認
# 2. Supabaseプロジェクトが起動しているか確認
# 3. Prismaクライアントを再生成
npx prisma generate
```

#### TypeScriptエラー
```bash
# エラー: Cannot find module
# 解決方法:
rm -rf node_modules package-lock.json
npm install
npm run type-check
```

#### Redisエラー
```bash
# エラー: Redis connection to localhost:6379 failed
# 解決方法:
# Redisが起動しているか確認
redis-cli ping
# 起動していない場合は起動
redis-server
```

### 5.2 開発用コマンド一覧
```bash
# 型チェック
npm run type-check

# リント実行
npm run lint

# フォーマット実行
npm run format

# データベース関連
npm run db:push      # スキーマをDBに反映
npm run db:migrate   # マイグレーション実行
npm run db:seed      # シードデータ投入
npm run db:studio    # Prisma Studio起動

# テスト実行
npm test            # ユニットテスト
npm run test:e2e    # E2Eテスト
```

## 6. 開発フロー

### 6.1 日次の開発フロー
1. mainブランチの最新を取得
   ```bash
   git checkout main
   git pull origin main
   ```

2. 作業ブランチを作成
   ```bash
   git checkout -b feature/issue-123-add-fortune-type
   ```

3. 開発サーバーを起動
   ```bash
   npm run dev:all
   ```

4. コーディング

5. コミット前チェック
   ```bash
   npm run type-check
   npm run lint
   npm run format
   ```

6. コミット＆プッシュ
   ```bash
   git add .
   git commit -m "feat(fortune): 新しい占い種別を追加"
   git push origin feature/issue-123-add-fortune-type
   ```

### 6.2 PRを作成する前のチェックリスト
- [ ] 型チェックが通る
- [ ] リントエラーがない
- [ ] フォーマットが適用されている
- [ ] テストが通る
- [ ] ローカルで動作確認済み
- [ ] 不要なconsole.logが削除されている

## 7. その他の設定

### 7.1 Git設定
```bash
# ユーザー情報の設定
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 改行コードの自動変換を無効化（Windows）
git config --global core.autocrlf false
```

### 7.2 npmスクリプトのエイリアス
`.bashrc`または`.zshrc`に追加:
```bash
# 開発用エイリアス
alias nrd="npm run dev"
alias nrb="npm run build"
alias nrl="npm run lint"
alias nrt="npm test"
```

---

これで開発環境の構築は完了です。問題が発生した場合は、このドキュメントのトラブルシューティングセクションを参照してください。