作業を始める前に `repo-conventions` と `vite-plus` の skill を読み、従う。どちらも masseater/skills にあり、`vp install` が `.agents/skills/` に入れる。このリポジトリのベースは https://github.com/masseater/typescript-template で、テンプレート由来の構成と方針はテンプレートに従う。

## スキル

- 不具合の調査は `systematic-debugging`、完了の確認は `verification-before-completion` スキルに従う。

## CI

- `pull_request` トリガーのワークフローを追加しない。マージ前の確認は手元の `vp run verify` で行う。
