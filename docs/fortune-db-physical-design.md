# 占い自動鑑定システム データベース物理設計書

## 1. データベース基本情報

### 1.1 システム構成
- **DBMS**: PostgreSQL 15.x
- **ホスティング**: Supabase
- **接続方式**: Connection Pooling (PgBouncer)
- **文字コード**: UTF-8
- **タイムゾーン**: Asia/Tokyo

### 1.2 命名規則
- **テーブル名**: 複数形、スネークケース（例: `users`, `fortune_requests`）
- **カラム名**: スネークケース（例: `created_at`, `user_id`）
- **インデックス名**: `idx_<table>_<columns>`（例: `idx_users_email`）
- **外部キー制約名**: `fk_<table>_<column>`（例: `fk_fortune_requests_user_id`）

## 2. テーブル定義

### 2.1 users（ユーザー）

```sql
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- 更新日時自動更新トリガー
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**テーブル詳細**:
- **想定レコード数**: 10,000～100,000
- **増加率**: 月間1,000レコード
- **パーティション**: 不要（現時点）

### 2.2 admins（管理者）

```sql
CREATE TABLE admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE UNIQUE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_role ON admins(role);
```

**テーブル詳細**:
- **想定レコード数**: 2～3
- **増加率**: ほぼなし

### 2.3 fortune_types（占い種別マスタ）

```sql
CREATE TABLE fortune_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    required_credits INTEGER NOT NULL CHECK (required_credits > 0),
    input_schema JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE UNIQUE INDEX idx_fortune_types_name ON fortune_types(name);
CREATE INDEX idx_fortune_types_is_active ON fortune_types(is_active);
```

**input_schema の例**:
```json
{
  "required": ["name", "birthdate", "gender", "consultation"],
  "optional": ["birthtime", "birthplace"],
  "fields": {
    "birthtime": {
      "type": "time",
      "label": "出生時刻"
    }
  }
}
```

### 2.4 fortune_requests（占い申込）

```sql
CREATE TABLE fortune_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    fortune_type_id UUID NOT NULL,
    input_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'ai_generated', 'editing', 'approved', 'published')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_fortune_requests_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_fortune_requests_fortune_type_id 
        FOREIGN KEY (fortune_type_id) REFERENCES fortune_types(id)
);

-- インデックス
CREATE INDEX idx_fortune_requests_user_id ON fortune_requests(user_id);
CREATE INDEX idx_fortune_requests_fortune_type_id ON fortune_requests(fortune_type_id);
CREATE INDEX idx_fortune_requests_status ON fortune_requests(status);
CREATE INDEX idx_fortune_requests_created_at ON fortune_requests(created_at DESC);

-- 複合インデックス（よく使われるクエリ用）
CREATE INDEX idx_fortune_requests_user_status ON fortune_requests(user_id, status);
```

**テーブル詳細**:
- **想定レコード数**: 100,000～1,000,000
- **増加率**: 月間10,000レコード
- **パーティション検討**: 1年後に月次パーティション検討

### 2.5 ai_results（AI生成結果）

```sql
CREATE TABLE ai_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL,
    prompt TEXT NOT NULL,
    raw_result TEXT NOT NULL,
    edited_result TEXT,
    editor_id UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ai_results_request_id 
        FOREIGN KEY (request_id) REFERENCES fortune_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_results_editor_id 
        FOREIGN KEY (editor_id) REFERENCES admins(id) ON DELETE SET NULL
);

-- インデックス
CREATE UNIQUE INDEX idx_ai_results_request_id ON ai_results(request_id);
CREATE INDEX idx_ai_results_editor_id ON ai_results(editor_id);
CREATE INDEX idx_ai_results_approved_at ON ai_results(approved_at);
```

### 2.6 fortune_results（最終鑑定結果）

```sql
CREATE TABLE fortune_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL,
    final_content TEXT NOT NULL,
    pdf_url VARCHAR(500),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_fortune_results_request_id 
        FOREIGN KEY (request_id) REFERENCES fortune_requests(id) ON DELETE CASCADE
);

-- インデックス
CREATE UNIQUE INDEX idx_fortune_results_request_id ON fortune_results(request_id);
CREATE INDEX idx_fortune_results_published_at ON fortune_results(published_at DESC);
```

### 2.7 credit_transactions（クレジット取引）

```sql
CREATE TABLE credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    amount INTEGER NOT NULL, -- 正: 追加, 負: 使用
    type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')),
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_credit_transactions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- インデックス
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- 複合インデックス
CREATE INDEX idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);
```

### 2.8 payment_history（決済履歴）

```sql
CREATE TABLE payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    stripe_payment_id VARCHAR(255) NOT NULL,
    amount_jpy INTEGER NOT NULL CHECK (amount_jpy > 0),
    credits_purchased INTEGER NOT NULL CHECK (credits_purchased > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('succeeded', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_payment_history_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- インデックス
CREATE UNIQUE INDEX idx_payment_history_stripe_payment_id ON payment_history(stripe_payment_id);
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at DESC);
```

### 2.9 audit_logs（監査ログ）

```sql
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT')),
    user_id UUID,
    admin_id UUID,
    changes JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_audit_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_logs_admin_id 
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

-- インデックス
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- パーティション（月次）
CREATE TABLE audit_logs_2025_06 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
```

## 3. 共通関数・トリガー

### 3.1 更新日時自動更新関数

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### 3.2 クレジット残高更新トリガー

```sql
CREATE OR REPLACE FUNCTION update_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type IN ('purchase', 'bonus', 'refund') THEN
        UPDATE users 
        SET credits = credits + NEW.amount 
        WHERE id = NEW.user_id;
    ELSIF NEW.type = 'usage' THEN
        UPDATE users 
        SET credits = credits + NEW.amount -- amountは負の値
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_user_credits
    AFTER INSERT ON credit_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_credits();
```

### 3.3 監査ログ自動記録関数

```sql
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id UUID;
    audit_admin_id UUID;
    old_data JSONB;
    new_data JSONB;
    changed_fields JSONB;
BEGIN
    -- ユーザーIDの取得（セッション変数から）
    audit_user_id := current_setting('app.current_user_id', TRUE)::UUID;
    audit_admin_id := current_setting('app.current_admin_id', TRUE)::UUID;
    
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        INSERT INTO audit_logs (table_name, action, user_id, admin_id, changes)
        VALUES (TG_TABLE_NAME, TG_OP, audit_user_id, audit_admin_id, 
                jsonb_build_object('old', old_data));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        
        -- 変更されたフィールドのみ記録
        SELECT jsonb_object_agg(key, value)
        INTO changed_fields
        FROM jsonb_each(new_data)
        WHERE value IS DISTINCT FROM old_data->key;
        
        INSERT INTO audit_logs (table_name, action, user_id, admin_id, changes)
        VALUES (TG_TABLE_NAME, TG_OP, audit_user_id, audit_admin_id,
                jsonb_build_object('old', old_data, 'new', new_data, 'changed_fields', changed_fields));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        new_data = to_jsonb(NEW);
        INSERT INTO audit_logs (table_name, action, user_id, admin_id, changes)
        VALUES (TG_TABLE_NAME, TG_OP, audit_user_id, audit_admin_id,
                jsonb_build_object('new', new_data));
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- 重要テーブルに監査トリガーを設定
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_credit_transactions AFTER INSERT ON credit_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## 4. パフォーマンス最適化

### 4.1 インデックス戦略

**基本方針**:
- 外部キーには必ずインデックス
- WHERE句でよく使われるカラムにインデックス
- 複合インデックスは左端の列から使用頻度順

**主要クエリと対応インデックス**:

```sql
-- ユーザーの鑑定履歴取得
-- 使用インデックス: idx_fortune_requests_user_status
SELECT * FROM fortune_requests 
WHERE user_id = ? AND status IN ('published', 'approved')
ORDER BY created_at DESC;

-- 管理者の未処理鑑定一覧
-- 使用インデックス: idx_fortune_requests_status
SELECT * FROM fortune_requests 
WHERE status IN ('pending', 'ai_generated')
ORDER BY created_at ASC;

-- クレジット履歴
-- 使用インデックス: idx_credit_transactions_user_created
SELECT * FROM credit_transactions
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT 20;
```

### 4.2 パーティション設計

**audit_logs テーブル**: 月次パーティション
```sql
-- パーティションテーブルの作成
CREATE TABLE audit_logs (
    -- カラム定義は上記と同じ
) PARTITION BY RANGE (created_at);

-- 自動パーティション作成関数
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
BEGIN
    start_date := date_trunc('month', CURRENT_DATE);
    end_date := start_date + interval '1 month';
    partition_name := 'audit_logs_' || to_char(start_date, 'YYYY_MM');
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
                    FOR VALUES FROM (%L) TO (%L)',
                    partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- 月次実行（cronジョブで設定）
SELECT create_monthly_partition();
```

### 4.3 統計情報とVACUUM

```sql
-- 自動VACUUM設定（postgresql.conf）
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 30s
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05

-- 大量更新後の手動実行
VACUUM ANALYZE fortune_requests;
VACUUM ANALYZE users;
```

## 5. セキュリティ設計

### 5.1 Row Level Security (RLS)

```sql
-- RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fortune_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fortune_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY users_policy ON users
    FOR ALL
    USING (auth.uid() = id);

CREATE POLICY fortune_requests_policy ON fortune_requests
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY fortune_results_policy ON fortune_results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM fortune_requests
            WHERE fortune_requests.id = fortune_results.request_id
            AND fortune_requests.user_id = auth.uid()
        )
    );

-- 管理者は全データアクセス可能
CREATE POLICY admin_all_access ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admins.id = auth.uid()
        )
    );
```

### 5.2 暗号化

```sql
-- 個人情報の暗号化（アプリケーション層で実装）
-- pgcryptoを使用する場合
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 暗号化関数の例
CREATE OR REPLACE FUNCTION encrypt_pii(text_to_encrypt text, encryption_key text)
RETURNS text AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(text_to_encrypt, encryption_key),
        'base64'
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrypt_pii(encrypted_text text, encryption_key text)
RETURNS text AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(encrypted_text, 'base64'),
        encryption_key
    );
END;
$$ LANGUAGE plpgsql;
```

## 6. バックアップ・リカバリ設計

### 6.1 バックアップ戦略

**Supabase自動バックアップ**:
- **頻度**: 日次（深夜2時）
- **保持期間**: 30日間
- **タイプ**: フルバックアップ

**追加バックアップ**:
```bash
# 論理バックアップ（週次）
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -f backup_$(date +%Y%m%d).sql

# 特定テーブルのみ
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
    -t users -t fortune_requests -t fortune_results \
    -f important_tables_$(date +%Y%m%d).sql
```

### 6.2 リカバリ手順

```bash
# 1. 全体リストア
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup_20250603.sql

# 2. 特定時点へのリカバリ（PITR）
# Supabaseダッシュボードから実行

# 3. 特定テーブルのみリストア
psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
    -c "TRUNCATE TABLE users CASCADE;"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < users_backup.sql
```

## 7. 監視・メンテナンス

### 7.1 監視項目

```sql
-- 接続数監視
SELECT count(*) as connection_count
FROM pg_stat_activity;

-- 長時間実行クエリ
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- テーブルサイズ
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- インデックス使用状況
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 7.2 定期メンテナンス

```sql
-- 月次メンテナンススクリプト
-- 1. 統計情報更新
ANALYZE;

-- 2. インデックスの再構築（肥大化対策）
REINDEX INDEX CONCURRENTLY idx_fortune_requests_created_at;
REINDEX INDEX CONCURRENTLY idx_credit_transactions_user_created;

-- 3. 古いログデータの削除
DELETE FROM audit_logs 
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

-- 4. 不要なディスク領域の回収
VACUUM FULL audit_logs;
```

## 8. 開発環境用設定

### 8.1 ローカル開発用の簡易設定

```sql
-- 開発環境では一部の制約を緩和
ALTER TABLE users DISABLE TRIGGER ALL;
ALTER TABLE fortune_requests DISABLE TRIGGER audit_fortune_requests;

-- テストデータ投入時の高速化
SET synchronous_commit = OFF;
SET checkpoint_segments = 100;
SET checkpoint_completion_target = 0.9;

-- 開発完了後は元に戻す
ALTER TABLE users ENABLE TRIGGER ALL;
SET synchronous_commit = ON;
```

### 8.2 データマスキング（本番データを開発環境へ）

```sql
-- 個人情報をマスキング
UPDATE users SET
    email = 'user' || id || '@example.com',
    name = 'テストユーザー' || row_number() OVER (),
    password_hash = '$2b$10$YourDummyHashHere'
WHERE true;

-- IPアドレスをマスキング
UPDATE audit_logs SET
    ip_address = '192.168.1.' || (random() * 254 + 1)::int
WHERE ip_address IS NOT NULL;
```

---

この物理設計書に基づいてデータベースを構築することで、パフォーマンスとセキュリティを両立した堅牢なシステムを実現できます。