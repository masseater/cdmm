# cdmm

複数の Claude Max アカウントを、公式の Claude Desktop でアカウントごとに分けて同時に使うための Windows アプリである。
仕様は SPEC.md、根拠となる観測は docs/research.md にある。

## セットアップ

```sh
vp install
cp .env.example .env
vp run verify
```

## 環境変数

ルートの `.env` に書く。

| 名前                 | 用途                          |
| -------------------- | ----------------------------- |
| `OPENROUTER_API_KEY` | push 前に走る jev-lint の判定 |

## GitHub の設定

リポジトリの Actions secrets に次を登録する。

| 名前                      | 用途                                       |
| ------------------------- | ------------------------------------------ |
| `OPENROUTER_API_KEY`      | verify ワークフローの jev-lint             |
| `CLAUDE_CODE_OAUTH_TOKEN` | verify 失敗時に Claude Code が自動修正する |

Settings → Actions → General で「Allow GitHub Actions to create and approve pull requests」を有効にする。
release-please と自動修正が PR を作るためである。

## 起動とビルド

Windows で実行する。

```sh
cd apps/desktop
vp run start
vp run dist
```
