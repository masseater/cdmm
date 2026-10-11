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

Electron公式の`app.setAsDefaultProtocolClient`も当たった（2026-10-11にWebで確認）。これはレジストリに書いて成否をbooleanで返すだけで、trueでもWindowsが使うとは限らない。Windows 10/11は既定を`...\UrlAssociations\<scheme>\UserChoice`のProgIdと改ざん検知Hashで保護し、Hashは設定アプリだけが計算するため、ProgIdだけ書いても無視される。つまり公式APIでも既定を強制できず、サポートされた唯一の道は候補登録＋設定アプリでユーザーに選ばせることである。本アプリの`RegisteredApplications`＋`Capabilities`登録と`ms-settings:defaultapps`誘導はこの結論に沿う。SetUserFTA等の第三者ツールはHashを計算できるが、非公式なので採らない。

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

Node側の既存ライブラリも探した（2026-10-11）。起動のP/Invoke（CreateDesktop・CreateProcess・WaitForInputIdle）は、koffi（<https://koffi.dev>、保守中でElectronでも再ビルド不要のプリビルド）からNodeで直接呼べ、win32-api（<https://www.npmjs.com/package/win32-api>）にFFI定義もあるので、埋め込みC#の代替になりうる。一方でUIAの読み取り・送信側は、古典のIUIAutomation（UIAutomationClient COM）を束ねた実用的なnpmが無い。NodeRTの`@nodert-win11/windows.ui.uiautomation.core`はWinRTの別APIで実験的、umbrielはBun向け、winaxは汎用のCOMブリッジである。しかもUIAクライアントは隠しデスクトップ上の別プロセスで動かす必要があるため、ここはOS同梱のSystem.Windows.Automationを使えば依存ゼロで済む。

ここでの選択は「自作のロジック」対「既存ライブラリ」ではない点に注意する。埋め込みC#のP/InvokeもkoffiもCreateDesktop/CreateProcessを再実装せず、同じOS APIに薄く束ねるFFIである。違いは束ね方だけで、koffiはElectronの配布物にネイティブのプリビルドモジュールを増やし（electron-builderでアーキ別に同梱・署名する対象が増える）、Add-Typeはどのwindowsにもある.NETに対してその場でコンパイルするので追加依存がない。UIAはPowerShell一本にならざるを得ないので、起動をkoffiに移すとPowerShellのUIA層とkoffiのネイティブ層の二本立てになり、ネイティブ依存を足してなお機構が増える。したがって起動も同じPowerShell+Add-Type層にまとめる。これは好みではなく、UIA側の制約とネイティブ依存の費用に基づく判断である。koffiへの一本化は、将来UIA側もNodeのネイティブaddonにできたときに一括で見直す。

ブログ・issue・discussionの方針を探した（2026-10-11に確認）。

同じことをするツールも個別に評価した。lowlevel-computer-use のMCPサーバー（<https://glama.ai/mcp/servers/codingmachineedge/lowlevel-computer-use-mcp>）は、見えないWin32デスクトップを作ってGUIアプリを起動する点は同じだが、Python製の独立したMCPサーバーで、ライセンスの記載が無く、入力はAutoHotkey系（`ahk_control_send`、`win_send_keys`）で、画面の読み取りはUIAではなくPrintWindowのキャプチャである。Electronアプリに別ランタイム（Python）と別プロセスを足すうえ、本実装が要る「UIAでの本文読み取り」を備えない。trycua/cua（<https://github.com/trycua/cua>）とArdurAI/ardur-bot（<https://github.com/ArdurAI/ardur-bot>）は、ElectronのUIA露出に関する不具合報告（cua #1616、ardur-bot #213・#180）であって、組み込めるライブラリではない。これらは採らず、知見だけを引く。

隠しデスクトップ上でのUIAは、上記lowlevel-computer-useが同じ方式を採っていた。UIAクライアントは自分のスレッドが属するデスクトップの窓しか見えないため、対象と読み取りヘルパーを同じ隠しデスクトップに置く。スレッドを後から切り替える`SetThreadDesktop`は、呼ぶスレッドが窓を持つと`ERROR_BUSY`（170、本実装で実測）で失敗したので使わず、ヘルパーを隠しデスクトップ上の別プロセスとして起動する。

ElectronのUIA露出が最大の落とし穴だった。Windows/UIAでこれを確かめたのは trycua/cua #1616（2026-10-11にWebFetchで確認）で、VS Code（Electron）がUIAにタイトルバーの3要素しか見せず、Chromiumのツリーは「`--force-renderer-accessibility`やUIAイベント購読でクライアントが要求したときだけ」構築されると報告する。microsoft/vscode #84833（同日確認）は、同じフラグがChromiumのアクセシビリティ構築を制御することを示すが、文脈はLinux/Orcaで、Windows/UIAには言及しない。よってWindowsでの根拠はcua #1616と本実装の実測に置く。実測では、隠し起動の引数に`--force-renderer-accessibility`を付けると、付ける前はタイトルバー相当の4件（窓名・最小化・最大化・閉じる）だったのが、サインイン画面の本文（"Sign in - Claude"、"始める"、"Menu"、"Notifications"）まで読めた。ツリー構築には初回問い合わせ後に遅延があり、隠し・不可視の窓は`backgroundThrottling`で更新が止まり空に見えることがあるという報告（ArdurAI/ardur-bot #213・#180、未確認）もあるため、ログイン済みチャットの本文読み取りと送信先セレクタは公式UI変更で壊れる前提で追従する。

Electron向けの自動化手段も当たった。Playwrightの`_electron`は、Electronアプリを自分で`executablePath`付きで起動し、Chromium/Nodeのインスペクタ経由で駆動する。既に起動しているインスタンスへ後から接ぐのではなく自分の管理下で起動する前提で、しかも通信路はCDP/インスペクタなので、`app.asar`が署名付きで塞ぐデバッグ経路（`--remote-debugging-port`は起動直後に終了するのを本セッションで確認済み）と同じ壁に当たる。Electronの`--inspect`はメインプロセスのNodeインスペクタで、レンダラのチャットUIには届かない。Windows-MCP（CursorTouch）系はUIAを使うWindows自動化のMCPサーバーだが、lowlevel-computer-useと同じく独立プロセス・汎用で、UIAクライアントは対話デスクトップ側に居るため隠しデスクトップを見るには結局`lpDesktop`起動の自作が要る。いずれも採らない。

確認状況（2026-10-11、WebFetchで一次確認したもの）:

- trycua/cua #1616 — 確認。VS CodeがUIAに3要素（タイトルバーのみ）しか見せず、Chromiumのツリーは`--force-renderer-accessibility`かUIAイベント購読でのみ構築される、と本文にある。Windows/UIAの根拠として採用。
- microsoft/vscode #84833 — 確認。フラグがChromiumのアクセシビリティ構築を制御する点は確かだが、文脈はLinux/Orcaで、Windows/UIAには言及しない。限定して引用する。
- Playwright `_electron` 公式ドキュメント — 確認。`executablePath`で自分で起動する前提で、既存インスタンスへの接続は記載がなく、Nodeのinspect系に依存する。本件（独立起動済みの隠しインスタンスを駆動）には合わないと判断。
- lowlevel-computer-use（glama一覧） — 確認済み（前述）。
- ArdurAI/ardur-bot #213・#180、Windows-MCP — 未確認。根拠としては使わず、補足情報としてのみ記す。

利用規約: 本アプリは利用者本人の複数のClaude Maxアカウントを、本人の端末で運用する前提である。公式クライアントを自動化すること、複数アカウントを同時に動かすことがAnthropicの規約に触れないかは、アカウント保有者である利用者が判断する事項で、本調査では未確認。UIAは署名付き制御（CDPブロック）を回避せず、OSのアクセシビリティAPIをそのまま使う。

起動の同期も要る。`PROCESS_INFORMATION`のドキュメントは、子ハンドルを閉じても親が生きていれば子は残ると述べるが、本方式では短命のランチャが先に終わると、作ったデスクトップが参照を失って壊れ、付いたばかりの子が落ちる。そこで公式アプリ起動後、`WaitForInputIdle`で子がデスクトップに付くまで待ってからランチャを終える（実測で生存プロセスが0、待つと7）。`WaitForInputIdle`は初期化してメッセージ待ちになるまで1回だけ待つ関数で、2回目以降は即座に返る。

| 依存                                             | 壊れた場合の影響 | 検知                                     |
| ------------------------------------------------ | ---------------- | ---------------------------------------- |
| 隠しデスクトップに起動してUIAで読めること        | 駆動そのもの     | 読み取りが空なら起動と窓の有無を確かめる |
| `--force-renderer-accessibility`で本文が露出する | 本文の読み取り   | 読み取りが窓枠だけなら露出を疑う         |
| 入力欄のUIA種別（Edit/Document）とEnter          | 送信             | ログイン済みのチャットでのみ最終確認する |
| トップ窓の名前が`Claude`であること               | 窓の特定         | 見つからなければ空を返す                 |
