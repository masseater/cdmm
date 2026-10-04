# 調査結果

2026年10月4日に、Windows 11（build 26200）とClaude Desktop 2.19675（MSIX版、Electron 44）で確かめた。
Anthropicのコードは複製せず、引数・ファイル・レジストリ・ログから観測できる挙動だけを記す。
推定にとどまる項目は「推定」と明記する。

## Claude Desktopの実体

MSIXパッケージ`Claude_pzs8sxrjxfjjc`として入る。
本体のexeは`C:\Program Files\WindowsApps\Claude_<version>_x64__pzs8sxrjxfjjc\app\Claude.exe`にあり、更新のたびにパスが変わる。
パッケージはApp Execution Alias`claude-desktop.exe`を公開している。
`%LOCALAPPDATA%\Microsoft\WindowsApps\claude-desktop.exe`は版に依存せず、引数もそのまま本体へ渡る。
このアプリはエイリアス経由で起動し、本体のパスを保存しない。
版の確認には`Get-AppxPackage -Name Claude`を使う。

## 状態の置き場所

アカウントに紐づく状態は、すべてユーザーデータディレクトリにある。
既定は`%APPDATA%\Claude`で、Chromium標準の`--user-data-dir`で移せる。

- Cookieなどブラウザセッションは`Network`以下にある
- 暗号鍵は`Local State`にあり、WindowsのDPAPIで保護される
- ログイン用のトークンキャッシュは`config.json`に暗号化して置かれる
- 最後にログインしたアカウントのUUIDも`config.json`に平文で残る
- ローカルMCPの定義は`claude_desktop_config.json`にある
- ログは、既定のディレクトリなら`%LOCALAPPDATA%\Claude\logs`、それ以外ならデータディレクトリの`logs`に出る

Windowsの資格情報マネージャーには何も保存しない。
したがってデータディレクトリを分ければ、Desktopのログイン状態は分かれる。

## 多重起動

Desktopの単一インスタンス制御はデータディレクトリ単位で働く。
ディレクトリが違えば同時に動き、同じなら後から起動した側が引数を先行プロセスへ渡して終わる。
起動中はデータディレクトリに`lockfile`があり、排他で開けない。終了すると消える。
この性質で、プロセスを列挙せずに稼働状態を判定できる。

先行事例によると、Desktopはデータディレクトリにあるシンボリックリンクやジャンクションをたどらず、書き込みを黙って止める。
共通設定をリンクで共有する方式は使えないため、このアプリは各ディレクトリへ実ファイルを書き出す。
CoworkのVMは、データディレクトリが`%APPDATA%`以下にないと起動せず、同時に1つの環境でしか動かない（先行事例の報告）。

## claude://リンク

`claude`スキームはMSIXパッケージが登録している。
`HKCU\Software\Classes\claude\shell\open\command`を書いても使われなかった。
リンクは`--user-data-dir`なしでDesktopを起動するため、既定のディレクトリのインスタンスへ届く。

Googleログインはシステムブラウザで行い、`claude://`で戻る。
戻りのリンクには、ログインを始めたインスタンスの発行した値が入る。自分が発行していない値のリンクは、インスタンスが無視する。
誤配送されても別アカウントでログインされることはなく、ログインが失敗するだけである。
実際に、既定のインスタンスが別環境のログイン戻りを無視した記録が残っていた。
メールのマジックリンクとSSOの戻りでは同じ照合を確認できていない。誤配送を許してはならない。

Windowsの既定のアプリ機構は、パッケージの登録より優先される。
自作のハンドラーを`RegisteredApplications`と`Capabilities\URLAssociations`で候補に登録すると、次のリンクでWindowsが選択画面を出した。
ユーザーが一度選ぶと`UserChoiceLatest`に記録され、以後のリンクは自作ハンドラーへ届いた。
ハンドラーが`claude-desktop.exe --user-data-dir=<dir> <url>`を実行すると、そのディレクトリで動くインスタンスへリンクが渡った。
これがcallback routerの根拠である。
Desktopは起動のたびに自分をプロトコルの既定に登録し直そうとするが、ユーザーの選択は書き換えない（推定、統合テストで確かめる）。

## Claude Code

Claude Codeは`CLAUDE_CONFIG_DIR`を設定ディレクトリとして使い、未指定なら`~/.claude`を使う。
Windowsではログイン情報とMCPのOAuthトークンを、そのディレクトリの`.credentials.json`に置く。
`.claude.json`にはMCP定義とログイン中のアカウント情報が入る。
Desktop内蔵のClaude Codeも、Desktopプロセスの`CLAUDE_CONFIG_DIR`に従う。
未指定のままだと、すべてのDesktop環境が`~/.claude`の会話履歴と設定を共有する。

`ccs`は、アカウントごとの`CLAUDE_CONFIG_DIR`を`~/.ccs/instances/<name>`に作る。
`settings.json`、`CLAUDE.md`、`skills`などは共有ディレクトリへのリンクにし、`.claude.json`は`mcpServers`だけを同期する。
認証情報には触れない。この方針をそのまま引き継ぐ。

## MCP

claude.aiのコネクタ（リモートMCP）は、claude.aiのアカウントに紐づく（推定）。
Desktopのデータを分ければ、コネクタの認証もアカウントごとに分かれる。

ローカルのstdio MCPサーバーは、自分のトークンをユーザーのホームに保存することが多い。
たとえば`mcp-remote`は`~/.mcp-auth`を使う。
データディレクトリを分けても、ここは全環境で共有される。
このアプリは、サーバーごとに`USERPROFILE`、`HOME`、`APPDATA`、`LOCALAPPDATA`をアカウント専用のディレクトリへ向ける。

## 壊れやすい箇所

Anthropicが仕様として公開していないものに依存するのは次の箇所である。

| 依存                                                  | 壊れた場合の影響         | 検知                                   |
| ----------------------------------------------------- | ------------------------ | -------------------------------------- |
| `--user-data-dir`でデータが移ること                   | 環境の分離そのもの       | 起動後にlockfileの位置を確かめる       |
| `lockfile`の有無と排他                                | 稼働表示                 | 起動後に現れなければ警告する           |
| `config.json`のアカウントUUID                         | アカウントの取り違え検知 | 読めなければ照合を省き、表示で知らせる |
| リンクのパスによるログイン戻りの判定                  | 誤配送                   | 判定できないリンクは確認画面を出す     |
| Desktop内蔵Claude Codeが`CLAUDE_CONFIG_DIR`に従うこと | Code側の分離             | 起動後に設定ディレクトリの更新を見る   |

`claude_desktop_config.json`はMCPの設定ファイルとしてAnthropicが公開している。
