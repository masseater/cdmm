const REACT_STATE_HOOKS: readonly string[] = [
  "useState",
  "useReducer",
  "createContext",
  "useContext",
];

const requiredStack: Readonly<Record<string, readonly string[]>> = {
  "UI 状態は effect-atom だけで扱う": [
    "zustand",
    "jotai",
    "valtio",
    "recoil",
    "mobx",
    "mobx-*",
    "redux",
    "@reduxjs/*",
    "react-redux",
    "xstate",
    "@xstate/*",
    "nanostores",
    "@nanostores/*",
    "@preact/signals*",
  ],
  "メインプロセスとの通信状態は TanStack Query だけで扱う": [
    "swr",
    "react-query",
    "@apollo/*",
    "urql",
    "@urql/*",
    "axios",
    "ky",
    "ofetch",
    "got",
    "node-fetch",
    "graphql-request",
    "@trpc/*",
  ],
  "UI は shadcn/ui と Tailwind CSS だけで組む": [
    "@mui/*",
    "antd",
    "@chakra-ui/*",
    "@mantine/*",
    "styled-components",
    "@emotion/*",
    "bootstrap",
    "react-bootstrap",
  ],
  "検証、日時、ログ、関数型ユーティリティは Effect だけで扱う": [
    "zod",
    "yup",
    "joi",
    "valibot",
    "arktype",
    "io-ts",
    "superstruct",
    "moment",
    "dayjs",
    "date-fns",
    "luxon",
    "winston",
    "pino",
    "bunyan",
    "loglevel",
    "lodash",
    "lodash-es",
    "ramda",
    "rxjs",
    "fp-ts",
    "neverthrow",
    "ts-results",
    "purify-ts",
  ],
  "計装は Effect のトレーシングだけで扱う": ["@opentelemetry/*", "dd-trace", "newrelic"],
};

const requiredStackEntries = Object.entries(requiredStack).flatMap(([message, modules]) =>
  modules.map((module) => ({ message, module })),
);

const requiredStackPaths: readonly Readonly<{ name: string; message: string }>[] =
  requiredStackEntries
    .filter(({ module }) => !module.includes("*"))
    .map(({ message, module }) => ({ name: module, message }));

const requiredStackPatterns: readonly Readonly<{ group: readonly string[]; message: string }>[] =
  requiredStackEntries.map(({ message, module }) => {
    if (module.includes("*")) {
      return { group: [module, `${module}/**`], message };
    }
    return { group: [`${module}/**`], message };
  });

const restrictedImports = {
  paths: [
    {
      name: "react",
      importNames: [...REACT_STATE_HOOKS],
      message: "UI 状態は effect-atom だけで扱う",
    },
    ...requiredStackPaths,
  ],
  patterns: [...requiredStackPatterns],
};

const generated = [
  "**/generated/**",
  ".claude/skills/**",
  ".claude/hooks/fallow-gate.sh",
  ".intent/**",
  "AGENTS.md",
  "skills-lock.json",
  "CHANGELOG.md",
];

export { generated, requiredStack, restrictedImports };
