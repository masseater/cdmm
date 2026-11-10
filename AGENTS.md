作業を始める前に `repo-conventions` と `vite-plus` の skill を読み、従う。どちらも masseater/skills にあり、`vp install` が `.agents/skills/` に入れる。このリポジトリのベースは https://github.com/masseater/typescript-template で、テンプレート由来の構成と方針はテンプレートに従う。

## 構成

- コードコメントは書かず、lint が落とす。必須技術のパッケージは pnpm の stack カタログから参照し、未参照のカタログ項目と未使用の依存は fallow が落とす。
- Claude Code では `.claude/settings.json` が pnpm・pnpx・pn・pnx の実行を拒否する。
- 不具合の調査は `systematic-debugging`、完了の確認は `verification-before-completion` スキルに従う。

## CI

- CI は main への push で走らせる。ワークフローは `.github/workflows/verify.yml` で、デプロイやリリースのジョブは `needs: verify` で main の必須 CI が通ってから動く。
- `pull_request` トリガーのワークフローを追加しない。マージ前の確認は手元の `vp run verify` で行う。
- Claude のクラウドセッションではプロキシが GitHub API を拒む。vpa は `CLAUDE_CODE_REMOTE` があると zizmor にオフライン監査だけを行わせ、オンライン監査は main の CI が担う。
