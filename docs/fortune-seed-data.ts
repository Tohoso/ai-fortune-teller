// prisma/seed.ts
// 開発環境用のシードデータ

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ヘルパー関数
const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};

// 日付のランダム生成
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function main() {
  console.log('🌱 シードデータ投入開始...');

  // 既存データのクリア（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 既存データをクリア中...');
    await prisma.auditLog.deleteMany();
    await prisma.paymentHistory.deleteMany();
    await prisma.creditTransaction.deleteMany();
    await prisma.fortuneResult.deleteMany();
    await prisma.aiResult.deleteMany();
    await prisma.fortuneRequest.deleteMany();
    await prisma.fortuneType.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.user.deleteMany();
  }

  // ========================================
  // 1. 管理者データ
  // ========================================
  console.log('👨‍💼 管理者を作成中...');
  
  const superAdmin = await prisma.admin.create({
    data: {
      email: 'super@example.com',
      password_hash: await hashPassword('password123'),
      name: 'スーパー管理者',
      role: 'super_admin',
    },
  });

  const admin1 = await prisma.admin.create({
    data: {
      email: 'admin1@example.com',
      password_hash: await hashPassword('password123'),
      name: '管理者1',
      role: 'admin',
    },
  });

  const admin2 = await prisma.admin.create({
    data: {
      email: 'admin2@example.com',
      password_hash: await hashPassword('password123'),
      name: '管理者2',
      role: 'admin',
    },
  });

  console.log('✅ 管理者作成完了');

  // ========================================
  // 2. 占い種別マスタ
  // ========================================
  console.log('🔮 占い種別を作成中...');

  const fortuneTypes = await Promise.all([
    prisma.fortuneType.create({
      data: {
        name: '九星気学',
        description: '生年月日から導き出す東洋の占術。運勢の流れと開運法をお伝えします。',
        required_credits: 1,
        is_active: true,
        input_schema: {
          required: ['name', 'birthdate', 'gender', 'consultation'],
          optional: ['birthtime', 'birthplace'],
          fields: {
            name: { type: 'text', label: 'お名前', maxLength: 100 },
            birthdate: { type: 'date', label: '生年月日' },
            birthtime: { type: 'time', label: '出生時刻（わかる場合）' },
            birthplace: { type: 'text', label: '出生地（都道府県）' },
            gender: { 
              type: 'select', 
              label: '性別',
              options: [
                { value: 'male', label: '男性' },
                { value: 'female', label: '女性' },
                { value: 'other', label: 'その他' }
              ]
            },
            consultation: { 
              type: 'textarea', 
              label: 'ご相談内容',
              maxLength: 500,
              placeholder: '具体的なお悩みや知りたいことをお書きください'
            }
          }
        },
      },
    }),
    
    prisma.fortuneType.create({
      data: {
        name: 'タロット占い',
        description: '78枚のカードが示す神秘のメッセージ。具体的な悩みにお答えします。',
        required_credits: 1,
        is_active: true,
        input_schema: {
          required: ['name', 'gender', 'question_type', 'consultation'],
          optional: ['birthdate'],
          fields: {
            name: { type: 'text', label: 'お名前', maxLength: 100 },
            birthdate: { type: 'date', label: '生年月日（任意）' },
            gender: { 
              type: 'select', 
              label: '性別',
              options: [
                { value: 'male', label: '男性' },
                { value: 'female', label: '女性' },
                { value: 'other', label: 'その他' }
              ]
            },
            question_type: {
              type: 'select',
              label: '質問カテゴリ',
              options: [
                { value: 'love', label: '恋愛' },
                { value: 'work', label: '仕事' },
                { value: 'money', label: '金運' },
                { value: 'health', label: '健康' },
                { value: 'general', label: '総合' }
              ]
            },
            consultation: { 
              type: 'textarea', 
              label: '具体的な質問',
              maxLength: 500,
              placeholder: 'タロットに聞きたいことを具体的にお書きください'
            }
          }
        },
      },
    }),
    
    prisma.fortuneType.create({
      data: {
        name: '西洋占星術',
        description: '惑星の配置から読み解く運命。詳細な性格分析と未来予測を行います。',
        required_credits: 2,
        is_active: true,
        input_schema: {
          required: ['name', 'birthdate', 'birthtime', 'birthplace', 'gender', 'consultation'],
          optional: [],
          fields: {
            name: { type: 'text', label: 'お名前', maxLength: 100 },
            birthdate: { type: 'date', label: '生年月日' },
            birthtime: { type: 'time', label: '出生時刻（必須）' },
            birthplace: { 
              type: 'location', 
              label: '出生地',
              placeholder: '市区町村まで入力してください'
            },
            gender: { 
              type: 'select', 
              label: '性別',
              options: [
                { value: 'male', label: '男性' },
                { value: 'female', label: '女性' },
                { value: 'other', label: 'その他' }
              ]
            },
            consultation: { 
              type: 'textarea', 
              label: 'ご相談内容',
              maxLength: 500
            }
          }
        },
      },
    }),
    
    prisma.fortuneType.create({
      data: {
        name: '四柱推命',
        description: '生まれた年月日時から運命を精密に分析。人生の指針をお示しします。',
        required_credits: 2,
        is_active: true,
        input_schema: {
          required: ['name', 'birthdate', 'birthtime', 'gender', 'consultation'],
          optional: ['birthplace'],
          fields: {
            name: { type: 'text', label: 'お名前', maxLength: 100 },
            birthdate: { type: 'date', label: '生年月日' },
            birthtime: { type: 'time', label: '出生時刻（必須）' },
            birthplace: { type: 'text', label: '出生地（都道府県）' },
            gender: { 
              type: 'select', 
              label: '性別',
              options: [
                { value: 'male', label: '男性' },
                { value: 'female', label: '女性' },
                { value: 'other', label: 'その他' }
              ]
            },
            consultation: { 
              type: 'textarea', 
              label: 'ご相談内容',
              maxLength: 500
            }
          }
        },
      },
    }),
  ]);

  console.log('✅ 占い種別作成完了');

  // ========================================
  // 3. テストユーザー
  // ========================================
  console.log('👤 ユーザーを作成中...');

  // テストユーザー1: アクティブユーザー
  const user1 = await prisma.user.create({
    data: {
      email: 'test1@example.com',
      password_hash: await hashPassword('password123'),
      name: '山田太郎',
      credits: 10,
      email_verified: true,
    },
  });

  // テストユーザー2: 新規ユーザー（初回ボーナス付き）
  const user2 = await prisma.user.create({
    data: {
      email: 'test2@example.com',
      password_hash: await hashPassword('password123'),
      name: '佐藤花子',
      credits: 3,
      email_verified: true,
    },
  });

  // テストユーザー3: クレジット不足ユーザー
  const user3 = await prisma.user.create({
    data: {
      email: 'test3@example.com',
      password_hash: await hashPassword('password123'),
      name: '鈴木一郎',
      credits: 0,
      email_verified: true,
    },
  });

  // 追加のダミーユーザー（統計用）
  const dummyUsers = await Promise.all(
    Array.from({ length: 20 }, (_, i) => 
      prisma.user.create({
        data: {
          email: `dummy${i + 1}@example.com`,
          password_hash: await hashPassword('password123'),
          name: `ダミーユーザー${i + 1}`,
          credits: Math.floor(Math.random() * 10),
          email_verified: Math.random() > 0.2,
          created_at: randomDate(new Date('2025-01-01'), new Date()),
        },
      })
    )
  );

  console.log('✅ ユーザー作成完了');

  // ========================================
  // 4. クレジット取引履歴
  // ========================================
  console.log('💰 クレジット取引を作成中...');

  // ユーザー1の取引履歴
  await prisma.creditTransaction.createMany({
    data: [
      {
        user_id: user1.id,
        amount: 5,
        type: 'purchase',
        description: '5クレジット購入',
        created_at: new Date('2025-05-01'),
      },
      {
        user_id: user1.id,
        amount: -1,
        type: 'usage',
        description: '九星気学占い利用',
        created_at: new Date('2025-05-05'),
      },
      {
        user_id: user1.id,
        amount: 10,
        type: 'purchase',
        description: '10クレジット購入（お得パック）',
        created_at: new Date('2025-05-15'),
      },
    ],
  });

  // ユーザー2の初回ボーナス
  await prisma.creditTransaction.create({
    data: {
      user_id: user2.id,
      amount: 3,
      type: 'bonus',
      description: '新規登録ボーナス',
    },
  });

  console.log('✅ クレジット取引作成完了');

  // ========================================
  // 5. 決済履歴
  // ========================================
  console.log('💳 決済履歴を作成中...');

  await prisma.paymentHistory.createMany({
    data: [
      {
        user_id: user1.id,
        stripe_payment_id: 'pi_test_1234567890',
        amount_jpy: 2500,
        credits_purchased: 5,
        status: 'succeeded',
        created_at: new Date('2025-05-01'),
      },
      {
        user_id: user1.id,
        stripe_payment_id: 'pi_test_0987654321',
        amount_jpy: 4500,
        credits_purchased: 10,
        status: 'succeeded',
        created_at: new Date('2025-05-15'),
      },
    ],
  });

  console.log('✅ 決済履歴作成完了');

  // ========================================
  // 6. 占い申込とAI結果
  // ========================================
  console.log('🔮 占い申込とAI結果を作成中...');

  // 完成済みの占い（ユーザー1）
  const fortuneRequest1 = await prisma.fortuneRequest.create({
    data: {
      user_id: user1.id,
      fortune_type_id: fortuneTypes[0].id, // 九星気学
      status: 'published',
      input_data: {
        name: '山田太郎',
        birthdate: '1990-01-01',
        birthtime: '10:30',
        birthplace: '東京都',
        gender: 'male',
        consultation: '仕事運について教えてください。転職を考えているのですが、時期的にどうでしょうか？',
      },
      created_at: new Date('2025-05-05'),
    },
  });

  // AI結果（編集済み）
  await prisma.aiResult.create({
    data: {
      request_id: fortuneRequest1.id,
      prompt: `あなたはプロの九星気学占い師です。以下の情報を元に、丁寧で前向きな鑑定を行ってください。

【基本情報】
- 名前: 山田太郎
- 生年月日: 1990年1月1日
- 出生時刻: 10:30
- 出生地: 東京都
- 性別: 男性

【相談内容】
仕事運について教えてください。転職を考えているのですが、時期的にどうでしょうか？

1000文字程度で、具体的なアドバイスを含めて鑑定してください。`,
      raw_result: `山田太郎様

あなたは一白水星の生まれで、水の性質を持つ柔軟で適応力の高い方です。2025年の今年は、あなたにとって「変化と成長」の年となっています。

【仕事運について】
現在のあなたの運勢を見ると、転職を考えられているのは自然な流れと言えます。一白水星の方は、環境の変化に順応する能力が高く、新しい場所でも実力を発揮できる資質をお持ちです。

特に今年の後半（7月〜9月）は、あなたにとって良い転機となる時期です。この期間は、あなたの能力を正当に評価してくれる人との出会いや、新しいチャンスが巡ってくる可能性が高いでしょう。

【転職のタイミング】
5月〜6月：情報収集と準備の時期。焦らず、じっくりと自分に合った職場を探しましょう。
7月〜9月：行動の時期。積極的に面接を受けたり、人脈を広げたりすると良いでしょう。
10月〜12月：収穫の時期。良い結果が期待できます。

【開運アドバイス】
- ラッキーカラー：青、黒
- ラッキー方位：北、東北
- 開運アイテム：水晶、観葉植物

転職活動中は、青や黒を基調とした服装を心がけると良いでしょう。また、面接の際は北または東北の方角にある企業だと、より良い縁に恵まれやすくなります。

【注意点】
ただし、3月と11月は運気が不安定になりやすい時期です。重要な決断は避け、慎重に行動することをお勧めします。

あなたの持つ柔軟性と適応力を信じて、前向きに進んでいってください。必ず良い結果が待っています。`,
      edited_result: `山田太郎様

この度は九星気学による鑑定をご依頼いただき、ありがとうございます。

あなたは一白水星の生まれで、水の性質を持つ柔軟で適応力の高い方です。2025年の今年は、あなたにとって「変化と成長」の年となっています。

【仕事運について】
現在のあなたの運勢を見ると、転職を考えられているのは自然な流れと言えます。一白水星の方は、環境の変化に順応する能力が高く、新しい場所でも実力を発揮できる資質をお持ちです。

水の性質を持つあなたは、どんな器にも合わせて形を変えることができる柔軟性があります。これは転職において大きな強みとなるでしょう。

【転職の最適なタイミング】
◆ 5月〜6月：情報収集と準備の時期
この期間は焦らず、じっくりと自分に合った職場を探しましょう。自己分析を深め、本当にやりたいことを明確にする時期です。

◆ 7月〜9月：行動の黄金期 ★最重要期間★
この3ヶ月間は、あなたにとって最高の転機となる時期です。積極的に面接を受けたり、人脈を広げたりすると良いでしょう。特に8月は運気が最高潮に達します。

◆ 10月〜12月：収穫の時期
良い結果が期待できる時期です。複数の内定が出る可能性もあります。

【開運アドバイス】
🔷 ラッキーカラー：青、黒、紺
🔷 ラッキー方位：北、東北
🔷 開運アイテム：水晶、観葉植物（特にポトス）
🔷 開運日：水曜日

転職活動中は、青や黒を基調とした服装を心がけると良いでしょう。ネクタイやハンカチなどの小物に取り入れるのも効果的です。

【具体的な行動指針】
1. 履歴書や職務経歴書は、水曜日に作成・更新すると良い
2. 面接の際は、北または東北の方角にある企業だと良縁に恵まれやすい
3. 朝起きたら、コップ一杯の水を飲んで運気を整える
4. デスクに小さな観葉植物を置いて、気の流れを良くする

【注意すべき時期】
⚠️ 3月と11月は運気が不安定になりやすい時期です。この時期の重要な決断は避け、慎重に行動することをお勧めします。

【最後に】
あなたの持つ柔軟性と適応力は、必ず新しい職場でも評価されるはずです。自信を持って、前向きに進んでいってください。水の流れのように、自然体で臨むことが成功への鍵となるでしょう。

転職活動の成功を心よりお祈りしております。`,
      editor_id: admin1.id,
      approved_at: new Date('2025-05-06'),
      created_at: new Date('2025-05-05'),
    },
  });

  // 最終結果とPDF
  await prisma.fortuneResult.create({
    data: {
      request_id: fortuneRequest1.id,
      final_content: `（最終的な鑑定文...上記のedited_resultと同じ）`,
      pdf_url: 'https://example.com/fortunes/result1.pdf',
      published_at: new Date('2025-05-06'),
    },
  });

  // AI生成済み・未編集の占い（ユーザー2）
  const fortuneRequest2 = await prisma.fortuneRequest.create({
    data: {
      user_id: user2.id,
      fortune_type_id: fortuneTypes[1].id, // タロット占い
      status: 'ai_generated',
      input_data: {
        name: '佐藤花子',
        gender: 'female',
        question_type: 'love',
        consultation: '最近出会った人との関係はうまくいくでしょうか？彼の気持ちが知りたいです。',
      },
      created_at: new Date('2025-06-02'),
    },
  });

  await prisma.aiResult.create({
    data: {
      request_id: fortuneRequest2.id,
      prompt: `タロット占いのプロンプト...`,
      raw_result: `タロットカードの結果...`,
      created_at: new Date('2025-06-02'),
    },
  });

  // 処理中の占い（ユーザー1）
  await prisma.fortuneRequest.create({
    data: {
      user_id: user1.id,
      fortune_type_id: fortuneTypes[2].id, // 西洋占星術
      status: 'processing',
      input_data: {
        name: '山田太郎',
        birthdate: '1990-01-01',
        birthtime: '10:30',
        birthplace: '東京都新宿区',
        gender: 'male',
        consultation: '今年の総合運を教えてください。',
      },
      created_at: new Date('2025-06-03T10:00:00'),
    },
  });

  console.log('✅ 占い申込とAI結果作成完了');

  // ========================================
  // 7. 監査ログ
  // ========================================
  console.log('📋 監査ログを作成中...');

  await prisma.auditLog.createMany({
    data: [
      {
        table_name: 'users',
        action: 'INSERT',
        user_id: user1.id,
        changes: { new: { name: '山田太郎', email: 'test1@example.com' } },
        ip_address: '192.168.1.100',
        created_at: user1.created_at,
      },
      {
        table_name: 'users',
        action: 'LOGIN',
        user_id: user1.id,
        ip_address: '192.168.1.100',
        created_at: new Date('2025-06-03T09:00:00'),
      },
      {
        table_name: 'ai_results',
        action: 'UPDATE',
        admin_id: admin1.id,
        changes: {
          old: { status: 'ai_generated' },
          new: { status: 'approved' },
        },
        ip_address: '192.168.1.200',
        created_at: new Date('2025-05-06'),
      },
    ],
  });

  console.log('✅ 監査ログ作成完了');

  // ========================================
  // 8. 統計情報の表示
  // ========================================
  console.log('\n📊 シードデータ投入完了！');
  console.log('================================');
  console.log(`管理者: ${await prisma.admin.count()}名`);
  console.log(`ユーザー: ${await prisma.user.count()}名`);
  console.log(`占い種別: ${await prisma.fortuneType.count()}種類`);
  console.log(`占い申込: ${await prisma.fortuneRequest.count()}件`);
  console.log(`クレジット取引: ${await prisma.creditTransaction.count()}件`);
  console.log('================================');

  console.log('\n🔐 ログイン情報');
  console.log('================================');
  console.log('【管理者】');
  console.log('スーパー管理者: super@example.com / password123');
  console.log('一般管理者1: admin1@example.com / password123');
  console.log('一般管理者2: admin2@example.com / password123');
  console.log('\n【テストユーザー】');
  console.log('アクティブユーザー: test1@example.com / password123 (10クレジット)');
  console.log('新規ユーザー: test2@example.com / password123 (3クレジット)');
  console.log('クレジット不足: test3@example.com / password123 (0クレジット)');
  console.log('================================\n');
}

main()
  .catch((e) => {
    console.error('❌ シードデータ投入エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// ========================================
// package.jsonに追加するスクリプト
// ========================================
/*
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts",
    "db:seed:prod": "NODE_ENV=production tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "db:reset:seed": "prisma migrate reset --force && npm run db:seed"
  }
}
*/

// ========================================
// 開発用の追加シードデータ（オプション）
// ========================================

// 大量データ生成用の関数（パフォーマンステスト用）
export async function generateBulkData() {
  console.log('🚀 大量データ生成開始...');
  
  const batchSize = 100;
  const totalUsers = 1000;
  
  for (let i = 0; i < totalUsers / batchSize; i++) {
    const users = Array.from({ length: batchSize }, (_, j) => ({
      email: `bulk-user-${i * batchSize + j}@example.com`,
      password_hash: '$2b$10$dummyHashForBulkUsers',
      name: `バルクユーザー${i * batchSize + j}`,
      credits: Math.floor(Math.random() * 20),
      email_verified: true,
      created_at: randomDate(new Date('2024-01-01'), new Date()),
    }));
    
    await prisma.user.createMany({ data: users });
    console.log(`✅ ${(i + 1) * batchSize}/${totalUsers} ユーザー作成完了`);
  }
  
  console.log('✅ 大量データ生成完了');
}

// 特定のテストシナリオ用データ
export async function generateScenarioData() {
  // シナリオ1: 決済エラーのテスト
  const paymentErrorUser = await prisma.user.create({
    data: {
      email: 'payment-error@example.com',
      password_hash: await hashPassword('password123'),
      name: '決済エラーテスト',
      credits: 0,
    },
  });
  
  await prisma.paymentHistory.create({
    data: {
      user_id: paymentErrorUser.id,
      stripe_payment_id: 'pi_test_failed',
      amount_jpy: 2500,
      credits_purchased: 5,
      status: 'failed',
    },
  });
  
  // シナリオ2: 大量の占い履歴を持つユーザー
  const heavyUser = await prisma.user.create({
    data: {
      email: 'heavy-user@example.com',
      password_hash: await hashPassword('password123'),
      name: 'ヘビーユーザー',
      credits: 100,
    },
  });
  
  // 50件の占い履歴を作成
  for (let i = 0; i < 50; i++) {
    await prisma.fortuneRequest.create({
      data: {
        user_id: heavyUser.id,
        fortune_type_id: fortuneTypes[Math.floor(Math.random() * fortuneTypes.length)].id,
        status: 'published',
        input_data: {
          name: 'ヘビーユーザー',
          birthdate: '1985-05-15',
          gender: 'male',
          consultation: `テスト相談 ${i + 1}`,
        },
        created_at: randomDate(new Date('2024-01-01'), new Date()),
      },
    });
  }
  
  console.log('✅ テストシナリオデータ作成完了');
}