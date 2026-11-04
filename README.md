# cdmm

Windows の公式 Claude Desktop で、複数の Claude Max アカウントを使い分けられるようにする道具である。
まだテンプレートの雛形のままで、この機能は入っていない。

## 手元で動かす

前提は Vite+ の `vp` と Cloudflare のアカウントである。

```sh
vp install
vp exec --filter claude-harness alchemy profile edit --add Cloudflare
vp run verify
```

`.mcp.json` の Cloudflare MCP は、この Alchemy のプロファイルの認証情報を使う。

## GitHub の設定

リポジトリの Actions secrets に次を登録する。

| 名前                      | 用途                                       |
| ------------------------- | ------------------------------------------ |
| `CLAUDE_CODE_OAUTH_TOKEN` | verify 失敗時に Claude Code が自動修正する |

Settings → Actions → General で「Allow GitHub Actions to create and approve pull requests」を有効にする。
有効にしないと、release-please と自動修正が PR を作れない。
