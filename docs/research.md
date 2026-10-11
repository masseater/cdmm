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

## 隠し運用と駆動

アカウントごとのDesktopを、ユーザーに見せず起動し、CDMMから送信と読み取りをする方式を選ぶまでに次を調べた。

公式の統合手段を探した。Desktopアプリのチャットへ外から送信したり読み取ったりする公式のCLIやAPIは見つからなかった。`claude`CLIとAgent SDKはClaude Code（別製品）であり、Desktopのチャット履歴は読み書きしない。Messages APIはDesktopの会話に触れない。SPEC.mdも独自のAPIクライアントや通信の中継を作らないと定める。CDPは`app.asar`が署名付きで塞いでいる。したがってDesktopの画面をそのまま読む以外に手段がない。

既存ライブラリを探した。FlaUI（.NET、NuGet）、pywinauto（Pythonランタイム）、WinAppDriver（別プロセスのHTTP）は、いずれもWindowsのUI Automationを薄く包んだものである。どれも難所の「隠しデスクトップ上で動かすこと」を肩代わりしない。クライアントは対象と同じデスクトップに居る必要があるため、FlaUIやpywinautoを使っても結局そのランタイムごと`lpDesktop`付きで隠しデスクトップに起動することになり、自作のランチャはそのまま要る。これらが包むのは要素検索の書き味だけで、本実装の読み取りは窓の子孫を一度なめるだけ、送信は入力欄1つに値を入れてEnterを送るだけなので、ラッパーの利点がほとんど効かない。ElectronアプリにPythonやNuGetの依存を足す代わりに、OS同梱のUIAutomationClientを、stopやバージョン取得と同じPowerShell経路から直接使う。

ブログ・issue・discussionの方針を探した（2026-10-11に確認）。

同じことをするツールも個別に評価した。lowlevel-computer-use のMCPサーバー（<https://glama.ai/mcp/servers/codingmachineedge/lowlevel-computer-use-mcp>）は、見えないWin32デスクトップを作ってGUIアプリを起動する点は同じだが、Python製の独立したMCPサーバーで、ライセンスの記載が無く、入力はAutoHotkey系（`ahk_control_send`、`win_send_keys`）で、画面の読み取りはUIAではなくPrintWindowのキャプチャである。Electronアプリに別ランタイム（Python）と別プロセスを足すうえ、本実装が要る「UIAでの本文読み取り」を備えない。trycua/cua（<https://github.com/trycua/cua>）とArdurAI/ardur-bot（<https://github.com/ArdurAI/ardur-bot>）は、ElectronのUIA露出に関する不具合報告（cua #1616、ardur-bot #213・#180）であって、組み込めるライブラリではない。これらは採らず、知見だけを引く。

隠しデスクトップ上でのUIAは、上記lowlevel-computer-useが同じ方式を採っていた。C++フォーラムには、アクティブなデスクトップを切り替えると自動化が続かないという報告があり、切り替えではなく対象と自動化を同じ隠しデスクトップに置く本方式の裏付けになる。`SetThreadDesktop`は、呼ぶスレッドが窓を持つと`ERROR_BUSY`（170）で失敗するため使わない。

ElectronのUIA露出が最大の落とし穴だった。Chromiumはレンダラのアクセシビリティツリーを、支援技術クライアントの要求を検知したときか、`--force-renderer-accessibility`付きで起動したときにしか構築しない（microsoft/vscode #84833）。これが無いと、UIAからはタイトルバーの数要素しか見えない（trycua/cua #1616 は VS Code で3要素のみと報告、本実装の初回読み取りも窓名と最小化・最大化・閉じるの4件だった）。そこで隠し起動の引数に`--force-renderer-accessibility`を付けた。付けた後は実測で、サインイン画面の本文（"Sign in - Claude"、"始める"、"Menu"、"Notifications"）まで読めた。加えてツリー構築には初回問い合わせ後に1〜2秒ほどの遅延があり、隠し・不可視の窓は`backgroundThrottling`で更新が止まり空に見えることがあるという報告がある（ArdurAI/ardur-bot #213、#180）。ログイン済みチャットの本文読み取りと送信先セレクタはここでしか最終確認できないため、公式UI変更で壊れる前提で追従する。

Electron向けの自動化手段も当たった。Playwrightの`_electron`は、Electronアプリを自分で`executablePath`付きで起動し、Chromium/Nodeのインスペクタ経由で駆動する。既に起動しているインスタンスへ後から接ぐのではなく自分の管理下で起動する前提で、しかも通信路はCDP/インスペクタなので、`app.asar`が署名付きで塞ぐデバッグ経路（`--remote-debugging-port`は起動直後に終了するのを本セッションで確認済み）と同じ壁に当たる。Electronの`--inspect`はメインプロセスのNodeインスペクタで、レンダラのチャットUIには届かない。Windows-MCP（CursorTouch）系はUIAを使うWindows自動化のMCPサーバーだが、lowlevel-computer-useと同じく独立プロセス・汎用で、UIAクライアントは対話デスクトップ側に居るため隠しデスクトップを見るには結局`lpDesktop`起動の自作が要る。いずれも採らない。

確認状況: WebFetchで実際に開いたのは lowlevel-computer-use の一覧ページ（glama）のみ。microsoft/vscode #84833、trycua/cua #1616、ArdurAI/ardur-bot #213・#180、Playwright `_electron`、Windows-MCP は検索結果の要約に基づく一次未確認で、実装前にリポジトリとドキュメントで裏取りする。

利用規約: 本アプリは利用者本人の複数のClaude Maxアカウントを、本人の端末で運用する前提である。公式クライアントを自動化すること、複数アカウントを同時に動かすことがAnthropicの規約に触れないかは、アカウント保有者である利用者が判断する事項で、本調査では未確認。UIAは署名付き制御（CDPブロック）を回避せず、OSのアクセシビリティAPIをそのまま使う。

起動の同期も要る。`PROCESS_INFORMATION`のドキュメントは、子ハンドルを閉じても親が生きていれば子は残ると述べるが、本方式では短命のランチャが先に終わると、作ったデスクトップが参照を失って壊れ、付いたばかりの子が落ちる。そこで公式アプリ起動後、`WaitForInputIdle`で子がデスクトップに付くまで待ってからランチャを終える（実測で生存プロセスが0、待つと7）。`WaitForInputIdle`は初期化してメッセージ待ちになるまで1回だけ待つ関数で、2回目以降は即座に返る。

| 依存                                             | 壊れた場合の影響 | 検知                                     |
| ------------------------------------------------ | ---------------- | ---------------------------------------- |
| 隠しデスクトップに起動してUIAで読めること        | 駆動そのもの     | 読み取りが空なら起動と窓の有無を確かめる |
| `--force-renderer-accessibility`で本文が露出する | 本文の読み取り   | 読み取りが窓枠だけなら露出を疑う         |
| 入力欄のUIA種別（Edit/Document）とEnter          | 送信             | ログイン済みのチャットでのみ最終確認する |
| トップ窓の名前が`Claude`であること               | 窓の特定         | 見つからなければ空を返す                 |
