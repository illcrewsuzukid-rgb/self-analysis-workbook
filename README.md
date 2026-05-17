# 自己分析ワークブック (Next.js + Supabase)

メールマジックリンクでログインして、書いた内容が自動でクラウド保存される自己分析ワークブック。

---

## ローカルで動かす (5分)

### 1. Supabaseプロジェクトを作る
1. https://supabase.com にログイン → **New project**
2. プロジェクト名・パスワード・リージョン（Tokyo推奨）を入力 → **Create**
3. プロジェクトが立ち上がったら、左メニューの **SQL Editor** → **New query** を開く
4. `supabase/schema.sql` の中身を貼り付け → **Run**
5. 左メニューの **Project Settings** → **API** を開いて、以下をコピー:
   - **Project URL** (例: `https://abcdefgh.supabase.co`)
   - **anon public** キー (長い文字列)

### 2. ローカルにクローンして起動
```bash
cd ~/self-analysis-workbook
cp .env.local.example .env.local
# .env.local をエディタで開いて、上でコピーした2つの値を貼り付け
npm install
npm run dev
```

http://localhost:3000 を開く → メール入力 → 届いたリンクをクリック → ワークブックが使えるようになる。

---

## Vercelに公開する (誰でも使える状態にする)

### 1. GitHubにpush
```bash
cd ~/self-analysis-workbook
git init
git add .
git commit -m "Initial commit"
# GitHubで新しいリポジトリを作成（Privateで可）→ 表示されるURLで:
git remote add origin git@github.com:YOUR_USERNAME/self-analysis-workbook.git
git branch -M main
git push -u origin main
```

### 2. Vercelにimport
1. https://vercel.com/new を開く
2. 先ほど作ったGitHubリポジトリを選択 → **Import**
3. **Environment Variables** に以下を追加:
   - `NEXT_PUBLIC_SUPABASE_URL` = (Supabaseの Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Supabaseの anon public キー)
4. **Deploy** をクリック

数分でデプロイ完了。`https://xxxxx.vercel.app` のようなURLが発行される。

### 3. SupabaseにVercel URLを登録 (重要！)
マジックリンクのリダイレクト先として登録しないと、本番でログインできない。

1. Supabaseの **Authentication** → **URL Configuration** を開く
2. **Site URL** に `https://xxxxx.vercel.app` を入力
3. **Redirect URLs** に以下を追加:
   - `https://xxxxx.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (ローカル開発用、残しておく)
4. **Save**

これでVercel URLを共有すれば、誰でもメールアドレスだけでログインして使えます。

---

## 構成

```
self-analysis-workbook/
├── app/
│   ├── layout.js            # ルートレイアウト
│   ├── page.js              # ワークブック本体 (要ログイン)
│   ├── login/page.js        # マジックリンクログインページ
│   └── auth/callback/route.js  # 認証コールバック
├── components/
│   └── Workbook.js          # ワークブックUI + 自動保存ロジック
├── lib/
│   ├── supabase-browser.js  # クライアント側 Supabase
│   └── supabase-server.js   # サーバー側 Supabase
├── middleware.js            # 未ログイン時に /login へリダイレクト
└── supabase/
    └── schema.sql           # DBスキーマ + RLSポリシー
```

## 保存の仕組み

- ユーザーごとに `user_data` テーブルに1行 (`user_id` 主キー)
- データは全部 `data` カラム (JSONB) に丸ごと保存
- 編集すると **1秒のデバウンス** でクラウドにupsert
- RLS (Row Level Security) で、ログインユーザーは自分のデータしか読み書きできない
