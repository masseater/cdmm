# cdmm

Windows の公式 Claude Desktop で、複数の Claude Max アカウントを使い分けられるようにする道具である。
まだテンプレートの雛形のままで、この機能は入っていない。

## 手元で動かす

前提は Vite+ の `vp` と Cloudflare のアカウントである。

```sh
vp install
vp run verify
```

`.mcp.json` 内の Cloudflare MCP サーバーは、環境変数 `CLOUDFLARE_API_TOKEN` から API トークンを読み取る。
