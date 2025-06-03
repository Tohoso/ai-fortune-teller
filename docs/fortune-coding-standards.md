# 占い自動鑑定システム コーディング規約

## 1. 基本方針

### 1.1 原則
- **可読性**: コードは書く時間より読む時間の方が長い
- **一貫性**: プロジェクト全体で統一されたスタイル
- **保守性**: 将来の変更に対応しやすい設計
- **型安全性**: TypeScriptの型システムを最大限活用

### 1.2 技術スタック別ガイドライン
- TypeScript: 厳格な型定義
- React: 関数コンポーネント + Hooks
- Next.js: App Router規約に準拠
- Tailwind CSS: ユーティリティファースト

## 2. プロジェクト構造

### 2.1 ディレクトリ構成
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証が不要なページ群
│   ├── (main)/            # 認証が必要なページ群
│   └── (admin)/           # 管理者ページ群
├── components/            # 共通コンポーネント
│   ├── ui/               # 基本UIコンポーネント
│   ├── features/         # 機能別コンポーネント
│   └── layouts/          # レイアウトコンポーネント
├── hooks/                # カスタムフック
├── lib/                  # ユーティリティ・ライブラリ
├── server/               # サーバーサイドロジック
│   ├── api/             # tRPCルーター
│   └── services/        # ビジネスロジック
├── types/               # 型定義
└── constants/           # 定数定義
```

### 2.2 ファイル命名規則
- **コンポーネント**: PascalCase（例: `UserProfile.tsx`）
- **フック**: camelCase + use接頭辞（例: `useAuth.ts`）
- **ユーティリティ**: camelCase（例: `formatDate.ts`）
- **型定義**: PascalCase（例: `UserTypes.ts`）
- **定数**: UPPER_SNAKE_CASE（例: `API_ENDPOINTS.ts`）

## 3. TypeScript規約

### 3.1 型定義
```typescript
// ✅ Good: 明示的な型定義
interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

// ❌ Bad: any型の使用
const processData = (data: any) => { ... };

// ✅ Good: Union型で制限
type FortuneStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ✅ Good: 型ガード
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

### 3.2 Enum vs Union Type
```typescript
// ✅ Prefer: Union Types
type Role = 'super_admin' | 'admin' | 'user';

// ❌ Avoid: Enum（Tree-shakingに不利）
enum RoleEnum {
  SuperAdmin = 'super_admin',
  Admin = 'admin',
  User = 'user'
}
```

### 3.3 型のエクスポート
```typescript
// types/index.ts
export type { User, Admin } from './user';
export type { FortuneRequest, FortuneResult } from './fortune';
```

## 4. React/Next.js規約

### 4.1 コンポーネント設計パターン
**Feature-Sliced Design**を採用（Atomic Designの改良版）

```
components/
├── ui/                    # 基本UI要素
│   ├── Button/
│   ├── Input/
│   └── Card/
├── features/              # 機能別コンポーネント
│   ├── fortune/
│   │   ├── FortuneCard/
│   │   ├── FortuneForm/
│   │   └── FortuneResult/
│   └── payment/
│       ├── CreditBalance/
│       └── PaymentForm/
└── layouts/               # レイアウト
    ├── Header/
    ├── Footer/
    └── Sidebar/
```

### 4.2 コンポーネント規約
```tsx
// ✅ Good: 関数コンポーネント + 明示的な型定義
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// ✅ Good: カスタムフックの抽出
const useFortuneRequest = (fortuneId: string) => {
  const [data, setData] = useState<FortuneResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // ロジック
  }, [fortuneId]);

  return { data, loading, error };
};
```

### 4.3 Next.js規約
```tsx
// ✅ Good: メタデータの定義
export const metadata: Metadata = {
  title: '占い自動鑑定システム',
  description: '本格的な占い鑑定をAIで自動生成',
};

// ✅ Good: エラーバウンダリ
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>エラーが発生しました</h2>
      <button onClick={reset}>再試行</button>
    </div>
  );
}

// ✅ Good: ローディング状態
export default function Loading() {
  return <LoadingSpinner />;
}
```

## 5. CSS/Tailwind規約

### 5.1 クラス名の順序
```tsx
// ✅ Good: 論理的な順序
<div className="
  {/* レイアウト */}
  flex items-center justify-between
  {/* 間隔 */}
  p-4 mt-2 mb-4
  {/* サイズ */}
  w-full h-16
  {/* 背景・境界 */}
  bg-white border border-gray-200 rounded-lg
  {/* エフェクト */}
  shadow-sm hover:shadow-md
  {/* トランジション */}
  transition-shadow duration-200
">

// ✅ Good: cn()ユーティリティの使用
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  condition && 'conditional-class',
  {
    'active': isActive,
    'disabled': isDisabled,
  }
)} />
```

### 5.2 レスポンシブデザイン
```tsx
// ✅ Good: モバイルファースト
<div className="
  text-sm md:text-base lg:text-lg
  p-2 md:p-4 lg:p-6
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
">
```

## 6. 状態管理

### 6.1 状態の種類と管理方法
- **ローカル状態**: useState
- **フォーム状態**: React Hook Form
- **サーバー状態**: tRPC + React Query
- **グローバル状態**: Zustand（必要な場合のみ）

```tsx
// ✅ Good: 適切な状態管理の選択
// ローカル状態
const [isOpen, setIsOpen] = useState(false);

// フォーム状態
const form = useForm<FortuneFormData>({
  resolver: zodResolver(fortuneSchema),
  defaultValues: {
    name: '',
    birthdate: '',
  },
});

// サーバー状態
const { data, loading } = api.fortune.getHistory.useQuery();
```

## 7. API設計（tRPC）

### 7.1 ルーター構成
```typescript
// server/api/routers/fortune.ts
export const fortuneRouter = createTRPCRouter({
  // Query: データ取得
  getTypes: publicProcedure
    .query(async () => {
      return await fortuneService.getTypes();
    }),

  // Mutation: データ変更
  create: protectedProcedure
    .input(createFortuneSchema)
    .mutation(async ({ input, ctx }) => {
      return await fortuneService.create(input, ctx.session.user.id);
    }),
});
```

### 7.2 エラーハンドリング
```typescript
// ✅ Good: 一貫したエラーハンドリング
import { TRPCError } from '@trpc/server';

if (!hasEnoughCredits) {
  throw new TRPCError({
    code: 'PRECONDITION_FAILED',
    message: 'クレジットが不足しています',
  });
}
```

## 8. テスト規約

### 8.1 テストファイルの配置
```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.test.tsx    # ユニットテスト
│       └── Button.stories.tsx  # Storybook
```

### 8.2 テストの書き方
```typescript
// ✅ Good: 明確なテスト名
describe('Button', () => {
  it('should render with primary variant by default', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 9. パフォーマンス最適化

### 9.1 コンポーネントの最適化
```tsx
// ✅ Good: メモ化の適切な使用
const ExpensiveComponent = memo(({ data }: Props) => {
  const processedData = useMemo(() => {
    return heavyProcessing(data);
  }, [data]);

  const handleClick = useCallback(() => {
    // 処理
  }, [dependency]);

  return <div>{/* 内容 */}</div>;
});
```

### 9.2 画像の最適化
```tsx
// ✅ Good: Next.js Imageコンポーネント
import Image from 'next/image';

<Image
  src="/fortune-card.png"
  alt="占いカード"
  width={300}
  height={400}
  loading="lazy"
  placeholder="blur"
/>
```

## 10. セキュリティ

### 10.1 入力検証
```typescript
// ✅ Good: Zodによる入力検証
import { z } from 'zod';

const fortuneInputSchema = z.object({
  name: z.string().min(1).max(100),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  consultation: z.string().max(500),
});

// サニタイゼーション
import DOMPurify from 'isomorphic-dompurify';
const sanitized = DOMPurify.sanitize(userInput);
```

### 10.2 認証・認可
```typescript
// ✅ Good: ミドルウェアでの保護
export const protectedProcedure = t.procedure.use(
  async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
      ctx: {
        session: ctx.session,
      },
    });
  }
);
```

## 11. コミット規約

### 11.1 コミットメッセージ
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- feat: 新機能
- fix: バグ修正
- docs: ドキュメント変更
- style: フォーマット変更
- refactor: リファクタリング
- test: テスト追加・修正
- chore: ビルドプロセスやツールの変更

**例**:
```
feat(fortune): AI鑑定生成機能を実装

- Claude APIとの連携処理を追加
- キューイングシステムを実装
- レート制限対策を実装

Closes #123
```

## 12. コメント規約

### 12.1 コメントの書き方
```typescript
// ✅ Good: なぜそうしているかを説明
// Claude APIのレート制限（1分10リクエスト）を考慮して
// 同時実行数を2に制限している
const CONCURRENT_AI_JOBS = 2;

// ❌ Bad: コードを読めばわかることを説明
// ユーザーIDを取得
const userId = session.user.id;

// ✅ Good: TODOコメント
// TODO: (2025-07-01) キャッシュ機能を実装する
// FIXME: エラーハンドリングを改善する必要あり
```

## 13. 環境変数

### 13.1 命名規則
```bash
# Public環境変数（クライアントで使用可能）
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Private環境変数（サーバーのみ）
DATABASE_URL=postgresql://...
CLAUDE_API_KEY=sk-ant-xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

## 14. エラーハンドリング

### 14.1 一貫したエラー処理
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 使用例
if (!user) {
  throw new AppError('USER_NOT_FOUND', 'ユーザーが見つかりません', 404);
}
```

## 15. ロギング

### 15.1 ログレベル
```typescript
// lib/logger.ts
export const logger = {
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // Sentryに送信
  },
  warn: (message: string) => {
    console.warn(`[WARN] ${message}`);
  },
  info: (message: string) => {
    console.info(`[INFO] ${message}`);
  },
  debug: (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`);
    }
  },
};
```

## 付録: ESLint/Prettier設定

### .eslintrc.json
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```