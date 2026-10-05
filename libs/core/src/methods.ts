import type { ApiMethod } from "./api.ts";

const API_METHODS: readonly ApiMethod[] = [
  "overview",
  "savePreset",
  "deletePreset",
  "createAccount",
  "saveAccount",
  "deleteAccount",
  "setSecret",
  "deleteSecret",
  "bindIdentity",
  "launchDesktop",
  "signIn",
  "stopDesktop",
  "launchCode",
  "openFolder",
  "registerRouter",
  "pendingChoice",
  "choose",
  "dismissChoice",
  "fitWindow",
];

export { API_METHODS };
