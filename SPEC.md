# SPEC.md

Claude Maxを複数契約している人が、公式のClaude Desktopをアカウントごとに分けて同時に使うためのWindowsアプリである。
共通の設定は1か所で管理し、各アカウントへ書き出す。
根拠となる観測はdocs/research.mdにある。

## 要求

公式のClaude Desktopをそのまま起動する。独自のチャット画面、APIクライアント、通信の中継、Desktopの改変は作らない。
Desktopのインストール先は起動のたびに解決し、パスを保存しない。
アカウントを切り替えるときに、ログアウトやログインをさせない。
アカウント間で認証情報が見えることを最大のリスクとして扱う。
内部の仕組み（プロセス、データディレクトリ、リンクの配送）をユーザーに意識させない。
Claude以外のAIサービスやAPIプロバイダーには対応しない。

## 用語

アカウント環境は、1つのClaude Maxアカウントのために分けた状態一式である。
DesktopとClaude Codeは同じアカウント環境を使う。
Globalは全アカウント環境に共通する設定で、複数のプリセットとして持つ。
各アカウント環境は1つのプリセットを継承し、Overrideで部分的に変更する。

## 境界

### Global

認証情報を含まない設定だけを置く。

- MCPサーバーの定義（コマンド、引数、URL、秘密でない環境変数）
- Claude Codeの`settings.json`の値
- 共通の指示（`CLAUDE.md`に書き出す）
- 起動設定

秘密に見える値はGlobalに保存できない。
キー名と値の形で判定し、環境変数・ヘッダー・引数・URLのすべてを検査する。
秘密が要る箇所には`{{secret:NAME}}`と書き、値はアカウント側に置く。

### Account

アカウント環境ごとに分ける。

- 表示名、色、継承するプリセット、Override
- `{{secret:NAME}}`の値（WindowsのDPAPIで暗号化して保存する）
- Desktopのデータディレクトリ（ログイン状態、Cookie、MCP設定、ログ）
- Claude Codeの設定ディレクトリ（ログイン情報、MCPのOAuthトークン、会話履歴）
- ローカルMCPサーバー用のホームディレクトリ

Overrideでは、プリセットのMCPサーバーの無効化、追加、差し替え、Claude Codeの設定値の上書き、指示の追記ができる。

### OAuth

ログイン情報とMCPのOAuthトークンは、DesktopとClaude Code自身が各アカウント環境のディレクトリに保存する。
このアプリはそれを読まず、複製せず、共有領域へ移さない。
`claude://`リンクはこのアプリが受け取り、正しいアカウント環境のDesktopへ渡す。
ログインの戻りは、ログイン待ちのアカウント環境が1つに決まるときだけ自動で渡す。
決まらないときは、ユーザーに渡し先を選ばせる。推測では渡さない。

### Runtime

アカウント環境の起動、停止、稼働状態の判定、書き出しはこのアプリが行う。
書き出しは、このアプリが前回書いたキーだけを置き換える。
ユーザーがDesktopやClaude Codeで直接足したMCPサーバーや設定は消さない。

## データの配置

```text
%APPDATA%\ClaudeMaxManager\
├── global\presets\<id>.json
├── settings.json
└── accounts\<id>\
    ├── account.json
    ├── secrets.bin
    ├── managed.json
    ├── desktop\        Desktopの--user-data-dir
    ├── claude-code\    CLAUDE_CONFIG_DIR
    └── mcp-home\       ローカルMCPサーバーのホーム
```

## 技術

言語はTypeScript 7で、effectと@effect/tsgoを使う。
リポジトリはVite+によるモノレポである。
アプリはElectronで組む。UIはReact、shadcn/ui、Tailwind CSSで作り、構成はFeature-Sliced Designに従う。
UI状態はeffect-atom、メインプロセスとの通信はTanStack Queryで扱う。
検査にはoxlint、oxfmt、fallow、steiger、textlint、yomiyasuを使う。
アカウント間の分離、書き出し、リンクの配送判定は自動テストで確かめる。
実機でしか確かめられない手順はdocs/manual-test.mdに書く。
依存の更新はRenovateで行い、CIが通ったものだけを自動でマージする。
