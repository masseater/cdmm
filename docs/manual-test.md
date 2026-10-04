# 実機テスト

自動テストで確かめられない挙動を、Windowsの実機で確かめる手順である。
Claude Maxのアカウントを2つ（以下AとB）と、MSIX版のClaude Desktopを用意する。

## 準備

インストーラーでこのアプリを入れて起動し、ヘッダーにDesktopの版が出ることを確かめる。
「Route claude:// links here」を押すとWindowsが選択画面を出すので、Claude Max Managerを選ぶ。
ヘッダーの表示が「claude:// links routed」に変われば準備は終わりである。

## ログインと同時起動

Accountsでアカウント環境AとBを作る。
Aで「Sign in」を押してブラウザでアカウントAにログインし、Aが● Runningになり、IdentityにアカウントAが出ることを確かめる。
Bも同じ手順でアカウントBにログインする。
AとBのDesktopが同時に開き、それぞれ別のアカウントで会話できれば合格である。

## MCPのOAuth

Globalのプリセットに、OAuthが要るリモートMCPサーバーを足す。
AとBのDesktopを再起動し、それぞれでOAuthを済ませる。
Aのトークンを取り消してもBの接続が切れなければ、認証情報は分かれている。

## 切り替えとリンク

Aを停止してBだけを動かし、`claude://`のリンクを開く。
リンクがBに届いたことは、Bの`desktop\logs\main.log`で確かめる。
次にAとBの両方をログイン待ちにしてから、ログインの戻りを開く。
このときは渡し先を選ぶ画面が出て、推測で配送されないことを確かめる。

## 再起動とDesktopの更新

Windowsを再起動した後も、AとBがログイン済みのまま起動し、`claude://`のリンクがこのアプリへ届くことを確かめる。
Desktopを更新した後は、ヘッダーの版が新しくなり、AとBが起動してログイン状態が残っていることを確かめる。

## 設定の継承

Globalのプリセットに指示を足し、AとBの`claude-code\CLAUDE.md`に反映されることを確かめる。
AのOverrideでMCPサーバーを1つ無効にし、Aだけから消えることを確かめる。
Bの継承先を別のプリセットに替え、Bだけが新しいプリセットの内容になることを確かめる。
Desktopで直接足したMCPサーバーが、書き出しの後も残っていることも確かめる。

## 内蔵Claude Codeの分離

AのDesktopでClaude Codeを使い、Aの`claude-code`ディレクトリの更新日時が変わることを確かめる。
同時に`%USERPROFILE%\.claude`が変わらなければ、内蔵のClaude Codeも分離できている。
