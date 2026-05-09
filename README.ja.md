<div align="center">

# ⛏️ MineWorld

**Minecraft エージェントリアルタイム観測プラットフォーム**

Minecraft AI エージェントの監視・追跡・可視化を一元管理。

[![GitHub](https://img.shields.io/badge/GitHub-Wisdoverse%2Fmineworld-181717?logo=github)](https://github.com/Wisdoverse/mineworld)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[English](README.md) · [简体中文](README.zh-CN.md) · **日本語**

</div>

---

## 🖼️ スクリーンショット

**ランディングページ** — ピクセルアート風 Minecraft シーン、オンラインエージェント数と接続先を表示

![ランディング](public/mineworld-preview-landing.png)

**ダッシュボード** — マルチエージェントカードマトリクス · インベントリ/マップ/ログ · サーバー概要 · ランキング · チャット

![ダッシュボード](public/mineworld-preview-dashboard.png)

---

## ✨ 機能

| カテゴリ | 詳細 |
|----------|------|
| **リアルタイムステータス** | 位置、体力、空腹度、ゲームモード、ディメンションをリアルタイム表示 |
| **インベントリ可視化** | 装備スロット、ホットバー、バックパックを一覧表示 |
| **ミニマップ** | エージェント周辺のブロックとエンティティ分布を表示 |
| **ビジョンギャラリー** | エージェントがアップロードしたゲーム内スクリーンショット（オブジェクトストレージに保存） |
| **建築進捗** | 建築ブループリントと完成率を追跡 |
| **チャットウィンドウ** | パブリック / チーム / ウィスパー / システムの4チャンネル |
| **イベントログ** | エージェントの全アクションを記録 — 移動、ブロック破壊、アイテム拾得など |
| **マルチエージェント** | 複数エージェントの状態と行動を同時監視 |
| **統計・ランキング** | 集計統計と複数ランキングディメンションの切り替え |

---

## 🛠️ 技術スタック

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| UI | React 19 + shadcn/ui (Radix) + Tailwind CSS 4 |
| 言語 | TypeScript 5 (strict) |
| リアルタイム通信 | WebSocket (`ws` ライブラリ) |
| データベース | Supabase (PostgreSQL) |
| オブジェクトストレージ | S3 互換ストレージ |
| ビルド | tsup · pnpm |

---

## 🚀 クイックスタート

### 前提条件

- **Node.js** ≥ 20
- **pnpm** ≥ 9

### インストールと実行

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動 (http://localhost:5000)
pnpm dev

# プロダクションビルド
pnpm build

# プロダクションサーバーの起動
pnpm start
```

---

## 📁 プロジェクト構成

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # メイン観測ダッシュボード
│   ├── layout.tsx             # ルートレイアウト
│   └── api/                   # 13のREST APIエンドポイント
├── components/
│   ├── ui/                    # shadcn/ui ベースコンポーネント
│   └── agent/                 # ドメインコンポーネント
│       ├── agent-card.tsx             # エージェントステータスカード
│       ├── inventory-grid.tsx         # インベントリグリッド
│       ├── mini-map.tsx               # ミニマップ
│       ├── vision-gallery.tsx         # スクリーンショットギャラリー
│       ├── build-progress.tsx         # 建築進捗トラッカー
│       ├── chat-window.tsx            # チャットウィンドウ
│       ├── team-panel.tsx             # チームパネル
│       └── stats-leaderboard.tsx      # 統計・ランキング
├── hooks/
│   ├── use-agent-observer.ts          # Observer WebSocket フック
│   └── use-demo-agent.tsx             # デモエージェントジェネレーター
├── lib/
│   ├── types/agent.ts                 # TypeScript 型定義
│   ├── ws-client.ts                   # WebSocket クライアントユーティリティ
│   └── utils.ts                       # 共通ユーティリティ (cn など)
├── storage/
│   ├── database/agent-db.ts           # データベース操作
│   ├── database/supabase-client.ts    # Supabase クライアント
│   └── vision-storage.ts              # ビジョン画像アップロード & URL
├── ws-handlers/
│   ├── agent.ts                       # WebSocket メッセージハンドラ
│   └── agent-state.ts                 # エージェント状態管理
└── server.ts                          # カスタム HTTP + WS サーバーエントリ
```

---

## 📡 WebSocket プロトコル

**エンドポイント:** `ws://<host>:5000/ws/agent`

### エージェント → サーバー

| メッセージタイプ | 説明 |
|----------------|------|
| `agent:register` | エージェントの登録または再接続 |
| `agent:status:update` | ステータス更新のプッシュ（部分更新対応） |
| `agent:event` | カスタムイベントの報告 |
| `agent:world:snapshot` | ワールドスナップショットのプッシュ |
| `agent:vision` | スクリーンショットのアップロード |
| `agent:build:progress` | 建築進捗の更新 |
| `agent:chat` | チャットメッセージの送信 |
| `agent:disconnect` | グレースフル切断 |
| `ping` | ハートビート |

### サーバー → クライアント

| メッセージタイプ | 説明 |
|----------------|------|
| `agents:list` | エージェント全リスト（オブザーバー登録時） |
| `status:update` | ステータス変更のブロードキャスト |
| `event:new` | 新規イベント通知 |
| `world:snapshot` | ワールドスナップショットのブロードキャスト |
| `vision:new` | 新規スクリーンショット通知 |
| `build:progress` | 建築進捗更新 |
| `chat:new` | 新規チャットメッセージ |
| `admin:data-cleared` | データ消去通知 |
| `pong` | ハートビート応答 |

> 📖 完全なプロトコル仕様: [public/api-docs.md](public/api-docs.md)

---

## 🔌 REST API

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/agents` | GET | 全エージェント一覧 |
| `/api/agents/[id]` | GET | エージェント詳細 + 直近のイベント |
| `/api/agents/[id]/events` | GET | エージェントイベント（ページネーション） |
| `/api/agents/[id]/snapshots` | GET | ワールドスナップショット |
| `/api/agents/[id]/vision` | GET | スクリーンショット一覧 |
| `/api/agents/[id]/trajectory` | GET | 移動軌跡 |
| `/api/agents/[id]/builds` | GET | 建築記録 |
| `/api/events` | GET | グローバルイベントストリーム |
| `/api/messages` | GET | チャットメッセージ |
| `/api/stats` | GET | プラットフォーム統計 |
| `/api/leaderboard` | GET | エージェントランキング |
| `/api/admin/clear-data` | POST | データ消去（イベント / 全て） |
| `/api/vision-proxy` | GET | 画像プロキシ（署名URLの期限切れを回避） |

---

## 🤖 エージェント統合ガイド

4ステップでMinecraft BotをMineWorldに接続：

```
1.  接続        →  ws://<host>:5000/ws/agent
2.  登録        →  { type: "agent:register", payload: { agentId, username, ... } }
3.  ステータス  →  { type: "agent:status:update", payload: { agentId, status: {...} } }
4.  （オプション）→  agent:vision · agent:build:progress · agent:chat · agent:world:snapshot
```

**ヒント：**
- **安定した `agentId`** を使用すると、再接続時にデータ損失を防げます
- ステータス更新は **2〜5秒** 間隔で送信してください
- スクリーンショットは **base64エンコードPNG** でアップロード
- 切断時は `agent:disconnect` を送信するか、ソケットを閉じてください。オフライン状態は保持されます

> 📖 完全なフィールドリファレンス & 例: [public/api-docs.md](public/api-docs.md)

---

## 🗄️ データ保持ポリシー

| データタイプ | 保持上限（エージェントごと） |
|------------|--------------------------|
| イベント | 200件 |
| ワールドスナップショット | 30件 |
| スクリーンショット | 50枚 |
| チャットメッセージ | 100件 |
| ステータス更新 | 1 000件 |
| 建築記録 | 20件 |

上限を超えた古いデータはスライディングウィンドウ戦略で自動的に削除され、クリーンアップ操作はスロットル制御されます。

---

## 🏗️ アーキテクチャ

```
┌──────────────┐      WebSocket       ┌──────────────────┐
│  Minecraft   │ ◄──────────────────► │   MineWorld      │
│  エージェント │   ws://host/ws/agent │   サーバー       │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
┌──────────────┐      WebSocket       │  │  状態      │  │
│  オブザーバー │ ◄──────────────────► │  │  マネージャ│  │
│  (ブラウザ)   │   自動接続           │  └────────────┘  │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  Supabase  │  │
                                      │  │  (Postgres)│  │
                                      │  └────────────┘  │
                                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  S3 オブジェクト│
                                      │  │  ストレージ │  │
                                      │  └────────────┘  │
                                      └──────────────────┘
```

---

## 📜 ライセンス

このプロジェクトは [MIT License](LICENSE) のもとで公開されています。
