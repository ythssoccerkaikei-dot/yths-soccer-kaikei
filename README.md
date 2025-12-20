# スポーツクラブ会計管理システム

Supabaseを使用した複数ユーザー対応の会計管理アプリです。

## ✨ 主な機能

- ✅ **データ共有**: 全ユーザーが同じデータを閲覧・編集
- ✅ 年度管理
- ✅ ユーザー管理（会計担当・コーチ・トレーナー）
- ✅ 会員管理・月次会費管理
- ✅ スタッフ在籍管理（会場ごとの距離設定）
- ✅ 活動記録（自動計算：コーチ代＋交通費＋ETC代）
- ✅ 報酬管理画面
- ✅ 収入・支出管理
- ✅ 年度決算レポート
- ✅ パスワード変更機能

## 🚀 デプロイ手順

### 1. GitHubにアップロード

1. GitHubで新しいリポジトリを作成
2. 以下のファイルをアップロード：
   - `.gitignore`
   - `next.config.js`
   - `package.json`
   - `README.md`
   - `pages/` フォルダ
   - `lib/` フォルダ
   
⚠️ **`.env.local` はアップロードしないでください**

### 2. Vercelでデプロイ

1. [Vercel](https://vercel.com) にログイン
2. 「New Project」→ GitHubリポジトリを選択
3. **環境変数を設定**:

```
NEXT_PUBLIC_SUPABASE_URL = https://qmpexkmdsqqpczqcsgub.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcGV4a21kc3FxcGN6cWNzZ3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzQ1OTYsImV4cCI6MjA4MTgxMDU5Nn0.XVpm40F2ZeVCpzC65sU8SEntOkW0xl11h8JE9aRT2Y0
```

4. 「Deploy」をクリック

## 🔐 初回ログイン

- **会計担当**: `accounting` / `pass123`
- **コーチ**: `coach` / `pass123`
- **トレーナー**: `trainer` / `pass123`

⚠️ ログイン後すぐにパスワードを変更してください！

## 📊 データ共有の仕組み

- Supabaseデータベースで全ユーザーのデータを一元管理
- 異なるパソコン・ブラウザでも同じデータが表示
- リアルタイム同期（数秒以内に反映）

## 🛠️ ローカル開発

```bash
npm install
npm run dev
```

http://localhost:3000 でアクセス

## 📝 ライセンス

自由に使用できます
