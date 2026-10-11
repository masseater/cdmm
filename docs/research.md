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

Electron公式の`app.setAsDefaultProtocolClient`も当たった（2026-10-11にWebで確認）。
これはレジストリに書いて成否をbooleanで返すだけである。
trueでもWindowsが使うとは限らない。
Windows 10/11は既定を`...\UrlAssociations\<scheme>\UserChoice`のProgIdと改ざん検知Hashで守る。
Hashは設定アプリだけが計算する。
そのためProgIdだけ書いても無視される。
公式APIでも既定は強制できない。
サポートされた唯一の道は、候補登録のうえ設定アプリでユーザーに選ばせることである。
本アプリの`RegisteredApplications`＋`Capabilities`登録と`ms-settings:defaultapps`誘導はこの結論に沿う。
SetUserFTA等の第三者ツールはHashを計算できるが、非公式なので採らない。

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

アカウントごとのDesktopを、ユーザーに見せず起動する。
そのうえでCDMMから送信と読み取りをする。
この方式を選ぶまでに次を調べた。

公式の統合手段を探した。
Desktopのチャットへ外から送受信する公式のCLIやAPIは見つからない。
`claude`CLIとAgent SDKはClaude Code（別製品）である。
どちらもDesktopのチャット履歴は読み書きしない。
Messages APIもDesktopの会話には触れない。
SPEC.mdも独自のAPIクライアントや中継を作らないと定める。
CDPは`app.asar`が署名付きで塞ぐ。
したがってDesktopの画面をそのまま読むしかない。

既存ライブラリを探した。
候補はFlaUI（.NET、NuGet）、pywinauto（Pythonランタイム）、WinAppDriver（別プロセスのHTTP）である。
いずれもWindowsのUI Automationを薄く包む。
難所の「隠しデスクトップ上で動かすこと」はどれも肩代わりしない。
UIAクライアントは対象と同じデスクトップに置く必要がある。
FlaUIやpywinautoでも、結局そのランタイムを`lpDesktop`付きで隠しデスクトップへ起動する。
自作のランチャはそのまま要る。
これらが包むのは要素検索の書き味だけである。
本実装の読み取りは窓の子孫を一度なめるだけで済む。
送信は入力欄へ値を入れてEnterを送るだけである。
どちらも単純なのでラッパーの利点は小さい。
ElectronにPythonやNuGetの依存は足さない。
OS同梱のUIAutomationClientを、stopやバージョン取得と同じPowerShell経路から使う。

Node側の既存ライブラリも探した（2026-10-11）。
起動のP/Invoke（CreateDesktop・CreateProcess・WaitForInputIdle）はkoffi（<https://koffi.dev>）からNodeで直接呼べる。
koffiは保守中で、Electronでも再ビルドが要らないプリビルドを配る。
win32-api（<https://www.npmjs.com/package/win32-api>）にもFFI定義がある。
どちらも埋め込みC#の代替になりうる。
一方でUIAの読み取り・送信側は事情が違う。
古典のIUIAutomation（UIAutomationClient COM）を束ねた実用的なnpmが無い。
NodeRTの`@nodert-win11/windows.ui.uiautomation.core`はWinRTの別APIで、実験的な位置づけにとどまる。
umbrielはBun向けに作られている。
winaxは汎用のCOMブリッジにすぎない。
しかもUIAクライアントは隠しデスクトップ上の別プロセスで動かす必要がある。
ここはOS同梱のSystem.Windows.Automationを使えば依存ゼロで済む。

koffiを実際に採用した（2026-10-11）。
起動とUIAヘルパーの生成は`main/win32.ts`へ移した。
処理はCreateDesktopW→CreateProcessW→WaitForInputIdle/WaitForSingleObjectの順である。
`STARTUPINFOW.lpDesktop`で隠しデスクトップを指定する。
Unicode環境ブロックでCLAUDE_CONFIG_DIRやCMM_OUTを子へ渡す。
これらをkoffiの非同期呼び出し（`func.async`、ワーカースレッド）で呼ぶ。
非同期なのでElectronメインのイベントループを止めない。
`setTimeout(0)`が飛行中に発火し、WaitForInputIdleが約585msで非同期に完了するのを実測した。
埋め込みC#（旧DESKTOP_CSHARP）とそのAdd-Type起動経路は削除した。
UIAの本文はPowerShell（System.Windows.Automation）のまま残す。
Nodeに実用的なUIAバインドが無いためである。
その本文スクリプトをwin32.ts経由で隠しデスクトップ上に起動する。

検証した。
`win32.ts`のロジックをNodeハーネスで実機確認した。
本物のClaude Desktopを隠しデスクトップに起動し、UIAヘルパーで本文まで読み取れた。
Effectで包んだ`desktop.ts`のwindowsLayer経由でも起動と読み取りが通った。
ビルドではkoffiを`vp pack`のexternalにした。
`createRequire(import.meta.url)("koffi")`で実行時に解決できることを確認した（dist/mainから解決成功）。
配布物ではkoffi 3.3.2がネイティブ本体を別パッケージ`@koromix/koffi-<platform>`に持つ。
そこでelectron-builderの`files`と`asarUnpack`にkoffiと`@koromix`の両方を含めた。
pnpmの`allowBuilds`でkoffiのビルドを許可した（未許可は`ERR_PNPM_IGNORED_BUILDS`で入らない）。
梱包後の`app.asar.unpacked`に`@koromix/koffi-win32-x64/win32_x64/koffi.node`が入る。
梱包版koffiがそのバイナリを読み込めることを確認した。
完全なインストーラー生成はEXDEVで止まる。
これはelectron-builderのアイコン変換がキャッシュのrenameで起こす環境問題である。
koffiやこの変更とは無関係の、アイコン周りの既存問題である。

ブログ・issue・discussionの方針を探した（2026-10-11に確認）。

同じことをするツールも個別に評価した。
lowlevel-computer-useのMCPサーバー（<https://glama.ai/mcp/servers/codingmachineedge/lowlevel-computer-use-mcp>）を見た。
見えないWin32デスクトップを作ってGUIアプリを起動する点は同じである。
ただしPython製の独立したMCPサーバーである。
ライセンスの記載が無い。
入力はAutoHotkey系（`ahk_control_send`、`win_send_keys`）である。
画面の読み取りはUIAではなくPrintWindowのキャプチャである。
ElectronにPythonと別プロセスを足すうえ、本実装が要る「UIAでの本文読み取り」を備えない。
trycua/cua（<https://github.com/trycua/cua>）とArdurAI/ardur-bot（<https://github.com/ArdurAI/ardur-bot>）も見た。
どちらもElectronのUIA露出に関する不具合報告である（cua #1616、ardur-bot #213・#180）。
組み込めるライブラリではない。
これらは採らず、知見だけを引く。

隠しデスクトップ上でのUIAは、上記lowlevel-computer-useが同じ方式を採る。
UIAクライアントは自分のスレッドが属するデスクトップの窓しか見えない。
そこで対象と読み取りヘルパーを同じ隠しデスクトップに置く。
スレッドを後から切り替える`SetThreadDesktop`は使わない。
呼ぶスレッドが窓を持つと`ERROR_BUSY`（170、本実装で実測）で失敗したためである。
代わりにヘルパーを隠しデスクトップ上の別プロセスとして起動する。

ElectronのUIA露出が最大の落とし穴だった。
Windows/UIAでこれを確かめたのはtrycua/cua #1616である（2026-10-11にWebFetchで確認）。
VS Code（Electron）はUIAにタイトルバーの3要素しか見せない。
Chromiumのツリーは、ATがツリーを要求したときに構築されると報告する。典型的な契機は`--force-renderer-accessibility`やUIAイベント購読である。
microsoft/vscode #84833（同日確認）は、VS CodeがLinuxで同じフラグを受け付けるようにした変更である。フラグの扱いはElectron/Chromium側の前提とされ、仕組み自体は実証していない。
ただし文脈はLinux/Orcaで、Windows/UIAには言及しない。
よってWindowsでの根拠はcua #1616と本実装の実測に置く。
実測では、隠し起動の引数に`--force-renderer-accessibility`を付けると結果が変わった。
付ける前はタイトルバー相当の4件（窓名・最小化・最大化・閉じる）だった。
付けた後はサインイン画面の本文（"Sign in - Claude"、"始める"、"Menu"、"Notifications"）まで読めた。
ツリー構築には初回問い合わせ後に遅延がある。
隠し・不可視の窓は`backgroundThrottling`で更新が止まり、空に見えることがあるという報告もある（ArdurAI/ardur-bot #213・#180、未確認）。
そのためログイン済みチャットの本文読み取りと送信先セレクタは、公式UIの変更で壊れる前提に立って追従する。

Electron向けの自動化手段も当たった。
Playwrightの`_electron`は、Electronアプリを`executablePath`付きで自分から起動する。
駆動はChromium/Nodeのインスペクタを経由する。
既に起動したインスタンスへ後から接ぐのではなく、自分の管理下で起動する前提に立つ。
しかも通信路はCDP/インスペクタに限られる。
`app.asar`が署名付きで塞ぐデバッグ経路と同じ壁に当たる。
`--remote-debugging-port`は起動直後に終了するのを本セッションで確認した。
Electronの`--inspect`はメインプロセスのNodeインスペクタである。
レンダラのチャットUIには届かない。
Windows-MCP（CursorTouch）系はUIAを使うWindows自動化のMCPサーバーである。
lowlevel-computer-useと同じく独立プロセスで汎用である。
UIAクライアントは対話デスクトップ側に居る。
隠しデスクトップを見るには結局`lpDesktop`起動の自作が要る。
いずれも採らない。

確認状況は次のとおりである（2026-10-11、WebFetchで一次確認したもの）。

- trycua/cua #1616 — 確認。VS CodeがUIAに3要素（タイトルバーのみ）しか見せないと本文にある。Chromiumのツリーは`--force-renderer-accessibility`かUIAイベント購読でのみ構築されるとある。Windows/UIAの根拠として採用する。
- microsoft/vscode #84833 — 確認。内容はVS CodeがLinuxで`--force-renderer-accessibility`を受け付けるようにした変更である。フラグの扱いはChromium側の前提にとどまる。文脈はLinux/Orcaなので、Windows/UIAには言及しない。根拠としては補助的に扱う。
- Playwright `_electron` 公式ドキュメント — 確認。`executablePath`を指定して自分から起動する前提である。既存インスタンスへの接続は記載がない。Nodeのinspect系に依存する。本件には合わないと判断する。
- lowlevel-computer-use（glama一覧） — 確認済み（前述）。
- ArdurAI/ardur-bot #213・#180、Windows-MCP — 未確認。根拠としては使わず、補足情報としてのみ記す。

利用規約について記す。
本アプリは利用者本人の複数のClaude Maxアカウントを、本人の端末で運用する前提である。
公式クライアントの自動化や複数アカウントの同時運用がAnthropicの規約に触れないかは、アカウント保有者である利用者が判断する。
本調査では未確認である。
UIAは署名付き制御（CDPブロック）を回避しない。
OSのアクセシビリティAPIをそのまま使う。

起動後は`WaitForInputIdle`で待つ。
子が初期化してメッセージ待ちになるまで待つ関数である（1回だけ待ち、2回目以降は即座に返る）。
koffiはElectronのメインプロセス（常駐）から呼ぶ。
そのため作ったデスクトップは親が生きている間は壊れない。
これは以前のPowerShell+Add-Type方式と異なる。
旧方式では短命のランチャプロセスが子の接続前に終わった。
すると作ったデスクトップが参照を失って壊れ、付いたばかりの子が落ちた。
旧方式の実測では、待たないと生存プロセスは0、`WaitForInputIdle`を待つと7だった。
現方式でも、子がUIを出す前には読み書きしない。
非同期の`WaitForInputIdle`を待ってから次へ進む。

| 依存                                             | 壊れた場合の影響 | 検知                                     |
| ------------------------------------------------ | ---------------- | ---------------------------------------- |
| 隠しデスクトップに起動してUIAで読めること        | 駆動そのもの     | 読み取りが空なら起動と窓の有無を確かめる |
| `--force-renderer-accessibility`で本文が露出する | 本文の読み取り   | 読み取りが窓枠だけなら露出を疑う         |
| 入力欄のUIA種別（Edit/Document）とEnter          | 送信             | ログイン済みのチャットでのみ最終確認する |
| トップ窓の名前が`Claude`であること               | 窓の特定         | 見つからなければ空を返す                 |

## 開発用ブリッジ（dev-bridge）の調査（2026-10-11）

レンダラーは`globalThis.cdmm`を読む。
本番ではElectronのpreloadが`contextBridge`でIPC越しに注入する。
UIを素のブラウザ（`vp dev`）で描画・確認するには、この注入を代替する必要がある。
公式手段と既存ライブラリを探した。

- `electron-mock-ipc` / `electron-ipc-mock` — 確認。`ipcMain`↔`ipcRenderer`のモックである。用途はJest/Mochaの単体テストである。本件のレンダラーは生IPCを直接触らない。`globalThis.cdmm`（contextBridgeで公開されたオブジェクト）を読むだけである。IPCトランスポートのモックは噛み合わない。
- Storybook — 確認。レンダラー単体の開発環境である。preload相当のグローバルは「同じオブジェクトをデコレータで定義する」運用になり、結局は手書きのモックである。加えて本リポジトリに未導入で、導入は大掛かりである。
- Vite `define` — 静的な置換のみである。ブリッジは呼び出しにデータで応答する必要があり合わない。MSWはHTTPを横取りする仕組みなので、HTTPではないブリッジは対象外である。

結論を記す。
「preload注入のグローバルを、素のブラウザでのdev描画のために代替する」既存の公式手段やライブラリは見当たらない。
そこで`import.meta.env.DEV`で分岐する。
実ブリッジが無いときだけ`globalThis.cdmm`を差すdev専用モジュールを採る（動的importで本番バンドルから除外）。
preload/contextBridgeの公式ドキュメントが示す注入の仕組みに沿う。
ただし、そのグローバルを素のブラウザで代替する専用ガイドはWeb検索でも見つからなかった。
本番バンドルに混入しないことはビルド成果物で確認済みである。
