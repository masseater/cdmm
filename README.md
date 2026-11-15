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
