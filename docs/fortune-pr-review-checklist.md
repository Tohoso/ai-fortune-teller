# 占い自動鑑定システム PRレビューチェックリスト

## 1. レビューの心構え

### 1.1 基本姿勢
- 🎯 **建設的**: 問題の指摘だけでなく、改善案を提示
- 💭 **謙虚**: 自分の理解が間違っている可能性を考慮
- 👍 **称賛**: 良いコードには積極的に褒める
- ❓ **質問**: 不明な点は遠慮なく質問

### 1.2 レビュー優先度
1. **🚨 Critical**: セキュリティ、データ損失、システム停止の可能性
2. **🎯 Must**: バグ、要件未達、パフォーマンス問題
3. **💭 Should**: コード品質、保守性、ベストプラクティス
4. **💡 Consider**: 改善提案、別解の提示
5. **📝 Note**: 情報共有、将来の参考

## 2. 機能要件チェック

### 2.1 要件の実装確認

```markdown
## 🎯 Must: 要件確認
- [ ] Issueに記載された要件を満たしているか
- [ ] 受け入れ条件（Acceptance Criteria）を満たしているか
- [ ] エッジケースが考慮されているか

### 確認ポイント
1. **正常系**: 期待通りの動作をするか
2. **異常系**: エラー時の挙動は適切か
3. **境界値**: 最大値・最小値での動作は正しいか
```

### 2.2 UI/UX確認

```markdown
## 💭 Should: UI/UX確認
- [ ] デザインモックアップと一致しているか
- [ ] レスポンシブデザインが実装されているか
- [ ] アクセシビリティ（a11y）が考慮されているか
- [ ] ローディング状態が適切に表示されるか
- [ ] エラー表示がユーザーフレンドリーか
```

## 3. コード品質チェック

### 3.1 TypeScript/型安全性

```typescript
// 🎯 Must: any型の使用を避ける
// ❌ Bad
const processData = (data: any) => {
  return data.value;
};

// ✅ Good
interface DataType {
  value: string;
}
const processData = (data: DataType) => {
  return data.value;
};

// 💭 Should: 型定義の共通化
// ❌ Bad - 同じ型を複数箇所で定義
interface UserInComponent {
  id: string;
  name: string;
}

// ✅ Good - 共通の型定義を使用
import { User } from '@/types';
```

**チェックリスト**:
- [ ] any型を使用していないか
- [ ] 型定義が適切か（過不足なく）
- [ ] 型の再利用性が考慮されているか
- [ ] strictNullChecksに対応しているか

### 3.2 React/Next.js

```typescript
// 🎯 Must: useEffectの依存配列
// ❌ Bad
useEffect(() => {
  fetchData(userId);
}, []); // userIdが依存配列にない

// ✅ Good
useEffect(() => {
  fetchData(userId);
}, [userId]);

// 💭 Should: パフォーマンス最適化
// ❌ Bad - 毎回新しい関数を作成
<Button onClick={() => handleClick(id)} />

// ✅ Good - useCallbackで最適化
const handleButtonClick = useCallback(() => {
  handleClick(id);
}, [id]);
<Button onClick={handleButtonClick} />
```

**チェックリスト**:
- [ ] useEffectの依存配列は正しいか
- [ ] 不要な再レンダリングが発生していないか
- [ ] メモ化（useMemo, useCallback）が適切に使用されているか
- [ ] コンポーネントの責務が単一か

### 3.3 エラーハンドリング

```typescript
// 🎯 Must: エラーハンドリング
// ❌ Bad
try {
  const result = await fetchData();
  setData(result);
} catch (e) {
  console.log(e); // エラーを握りつぶしている
}

// ✅ Good
try {
  const result = await fetchData();
  setData(result);
} catch (error) {
  logger.error('データ取得エラー', error);
  setError('データの取得に失敗しました');
  // ユーザーへの通知
  toast.error('データの取得に失敗しました');
}
```

**チェックリスト**:
- [ ] try-catchが適切に配置されているか
- [ ] エラーがユーザーに通知されるか
- [ ] エラーログが記録されるか
- [ ] エラー時のフォールバック処理があるか

## 4. セキュリティチェック

### 4.1 認証・認可

```typescript
// 🚨 Critical: 認可チェック
// ❌ Bad - 認可チェックなし
export const deleteUser = async (userId: string) => {
  await db.users.delete({ where: { id: userId } });
};

// ✅ Good - 認可チェックあり
export const deleteUser = protectedProcedure
  .input(z.object({ userId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // 管理者権限チェック
    if (ctx.session.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    
    await db.users.delete({ where: { id: input.userId } });
  });
```

**チェックリスト**:
- [ ] 認証が必要なエンドポイントは保護されているか
- [ ] 権限チェックが実装されているか
- [ ] セッション管理は適切か
- [ ] トークンの有効期限は設定されているか

### 4.2 入力検証

```typescript
// 🚨 Critical: 入力検証
// ❌ Bad - 検証なし
const createFortune = async (data: any) => {
  return await db.fortunes.create({ data });
};

// ✅ Good - Zodによる検証
const createFortuneSchema = z.object({
  name: z.string().min(1).max(100),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  consultation: z.string().max(500),
});

const createFortune = async (data: unknown) => {
  const validatedData = createFortuneSchema.parse(data);
  return await db.fortunes.create({ data: validatedData });
};
```

**チェックリスト**:
- [ ] すべての入力値が検証されているか
- [ ] SQLインジェクション対策はされているか
- [ ] XSS対策はされているか
- [ ] ファイルアップロードの検証は適切か

### 4.3 機密情報の取り扱い

```typescript
// 🚨 Critical: 機密情報の露出
// ❌ Bad - APIキーがハードコード
const apiKey = "sk-ant-api03-xxxxx";

// ✅ Good - 環境変数から取得
const apiKey = process.env.CLAUDE_API_KEY;

// 🚨 Critical: ログに機密情報
// ❌ Bad
logger.info('User login', { email, password });

// ✅ Good
logger.info('User login', { email });
```

**チェックリスト**:
- [ ] APIキー等がハードコードされていないか
- [ ] 環境変数が適切に使用されているか
- [ ] ログに機密情報が含まれていないか
- [ ] エラーメッセージに内部情報が露出していないか

## 5. パフォーマンスチェック

### 5.1 データベースクエリ

```typescript
// 🎯 Must: N+1問題
// ❌ Bad
const users = await db.users.findMany();
for (const user of users) {
  const requests = await db.fortuneRequests.findMany({
    where: { userId: user.id }
  });
}

// ✅ Good - includeで一括取得
const users = await db.users.findMany({
  include: {
    fortuneRequests: true
  }
});
```

**チェックリスト**:
- [ ] N+1問題は発生していないか
- [ ] 不要なデータを取得していないか（select指定）
- [ ] インデックスが活用されるクエリか
- [ ] ページネーションは実装されているか

### 5.2 フロントエンド最適化

```typescript
// 💭 Should: 画像最適化
// ❌ Bad
<img src="/large-image.png" />

// ✅ Good - Next.js Imageコンポーネント
import Image from 'next/image';
<Image
  src="/large-image.png"
  alt="説明"
  width={800}
  height={600}
  loading="lazy"
/>
```

**チェックリスト**:
- [ ] 画像は最適化されているか
- [ ] 遅延ローディングが適用されているか
- [ ] バンドルサイズは適切か
- [ ] 不要な再レンダリングは防げているか

## 6. テストチェック

### 6.1 テストカバレッジ

```typescript
// 🎯 Must: 重要なロジックのテスト
describe('FortuneService', () => {
  it('should deduct credits when creating fortune', async () => {
    const user = await createTestUser({ credits: 5 });
    
    await fortuneService.create(user.id, fortuneData);
    
    const updatedUser = await getUser(user.id);
    expect(updatedUser.credits).toBe(4);
  });
  
  it('should throw error when insufficient credits', async () => {
    const user = await createTestUser({ credits: 0 });
    
    await expect(
      fortuneService.create(user.id, fortuneData)
    ).rejects.toThrow('クレジットが不足しています');
  });
});
```

**チェックリスト**:
- [ ] 新機能に対するテストが追加されているか
- [ ] エッジケースがテストされているか
- [ ] 既存のテストが壊れていないか
- [ ] テストの可読性は高いか

### 6.2 E2Eテスト

```typescript
// 💭 Should: 重要なユーザーフローのE2Eテスト
test('占い申込フロー', async ({ page }) => {
  // ログイン
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // 占い選択
  await page.click('text=占いを選ぶ');
  await page.click('text=九星気学');
  
  // フォーム入力
  await page.fill('[name="name"]', '山田太郎');
  // ...
  
  // 結果確認
  await expect(page).toHaveURL('/fortune/complete');
});
```

**チェックリスト**:
- [ ] 主要なユーザーフローがカバーされているか
- [ ] モバイル表示のテストはあるか
- [ ] エラーケースのE2Eテストはあるか

## 7. ドキュメント・コメント

### 7.1 コードコメント

```typescript
// 💡 Consider: 複雑なロジックへのコメント
// ✅ Good - なぜこうしているかを説明
// Claude APIのレート制限（1分10リクエスト）を考慮して
// 同時実行数を2に制限し、exponential backoffで再試行
const CONCURRENT_JOBS = 2;
const MAX_RETRIES = 3;

// ❌ Bad - コードを読めばわかることを説明
// userIdを取得する
const userId = session.user.id;
```

**チェックリスト**:
- [ ] 複雑なロジックに説明があるか
- [ ] TODOコメントに期限や担当者が記載されているか
- [ ] 不要なコメントは削除されているか
- [ ] JSDocは適切に記載されているか

### 7.2 PR説明

**チェックリスト**:
- [ ] PRの説明は十分か
- [ ] スクリーンショットが添付されているか（UI変更の場合）
- [ ] 破壊的変更は明記されているか
- [ ] テスト方法が記載されているか

## 8. 特定技術のチェックポイント

### 8.1 tRPC

```typescript
// 🎯 Must: エラーハンドリング
export const fortuneRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createFortuneSchema)
    .mutation(async ({ ctx, input }) => {
      // トランザクション処理
      return await ctx.db.$transaction(async (tx) => {
        // クレジットチェック
        const user = await tx.user.findUnique({
          where: { id: ctx.session.user.id }
        });
        
        if (user.credits < requiredCredits) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'クレジットが不足しています',
          });
        }
        
        // 処理実行
        // ...
      });
    }),
});
```

### 8.2 Prisma

```typescript
// 💭 Should: 効率的なクエリ
// ✅ Good - 必要なフィールドのみ選択
const user = await db.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    credits: true,
  }
});
```

### 8.3 Next.js App Router

```typescript
// 🎯 Must: メタデータの設定
export const metadata: Metadata = {
  title: '占い申込 | 占い自動鑑定システム',
  description: 'AI占い師による本格的な占い鑑定',
};

// 💭 Should: エラーハンドリング
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
```

## 9. レビューコメントの書き方

### 9.1 良い例

```markdown
## 🎯 Must: クレジット不足時のエラーハンドリング

現在の実装では、クレジット不足時にエラーが発生しますが、
ユーザーへのフィードバックがありません。

以下のような実装を提案します：

```typescript
if (user.credits < requiredCredits) {
  // エラーをスロー
  throw new TRPCError({
    code: 'PRECONDITION_FAILED',
    message: `クレジットが不足しています。必要: ${requiredCredits}、現在: ${user.credits}`,
  });
}
```

また、フロントエンド側でもエラーをキャッチして、
クレジット購入ページへの導線を表示すると良いと思います。
```

### 9.2 悪い例

```markdown
これは良くない。
直してください。
```

## 10. チェックリスト要約

### 必須確認項目（マージ前に必ず確認）

- [ ] **要件**: Issueの要件を満たしているか
- [ ] **セキュリティ**: 認証・認可・入力検証は適切か
- [ ] **エラー**: エラーハンドリングは実装されているか
- [ ] **型安全性**: TypeScriptの型は適切か
- [ ] **テスト**: テストは追加/更新されているか
- [ ] **ビルド**: CIが成功しているか

### 推奨確認項目

- [ ] **パフォーマンス**: N+1問題等はないか
- [ ] **可読性**: コードは理解しやすいか
- [ ] **保守性**: 将来の変更に対応しやすいか
- [ ] **一貫性**: プロジェクトの規約に従っているか
- [ ] **ドキュメント**: 必要なコメントはあるか

---

このチェックリストを活用して、品質の高いコードレビューを実施してください。
レビューは学習の機会でもあるので、積極的に質問し、知識を共有しましょう。