import { emptyOverride } from "@cdmm/core";
import type { ManagerApi, Overview, Preset } from "@cdmm/core";

type Listener = () => void;

const PRESETS: Preset[] = [
  {
    id: "p-default",
    name: "Default",
    mcp: {},
    codeSettings: {},
    rules: "Be concise and act first.",
  },
];

const SCREEN_TEXT = ["Claude", "How can I help you today?", "Ask Claude anything", "Send"].join(
  "\n",
);

const makeOverview = (): Overview => ({
  desktop: { status: "found", version: "0.13.0", testedVersion: true },
  router: { status: "active" },
  presets: PRESETS,
  accounts: [
    {
      account: {
        id: "work",
        label: "Work",
        color: "#4f46e5",
        presetId: "p-default",
        override: emptyOverride,
      },
      running: true,
      waitingForLogin: false,
      identity: {
        desktopAccountUuid: "d-work",
        codeAccountUuid: "c-work",
        codeEmail: "work@example.com",
      },
      identityCheck: { status: "matching" },
      secretNames: ["ANTHROPIC_API_KEY"],
      sync: { status: "synced", skipped: [] },
      paths: { desktop: "C:\\cdmm\\work\\desktop", code: "C:\\cdmm\\work\\code" },
    },
    {
      account: {
        id: "personal",
        label: "Personal",
        color: "#16a34a",
        presetId: "p-default",
        override: emptyOverride,
      },
      running: false,
      waitingForLogin: false,
      identity: {
        desktopAccountUuid: "d-personal",
        codeAccountUuid: "c-personal",
        codeEmail: "me@example.com",
      },
      identityCheck: { status: "unbound" },
      secretNames: [],
      sync: { status: "pending" },
      paths: { desktop: "C:\\cdmm\\personal\\desktop", code: "C:\\cdmm\\personal\\code" },
    },
  ],
});

const devApi = (): ManagerApi => {
  const api: ManagerApi = {
    overview: () => Promise.resolve(makeOverview()),
    savePreset: () => Promise.resolve({ status: "saved" }),
    deletePreset: () => Promise.resolve({ status: "done" }),
    createAccount: () => Promise.resolve({ status: "done" }),
    saveAccount: () => Promise.resolve({ status: "saved" }),
    deleteAccount: () => Promise.resolve({ status: "done" }),
    setSecret: () => Promise.resolve({ status: "done" }),
    deleteSecret: () => Promise.resolve({ status: "done" }),
    bindIdentity: () => Promise.resolve({ status: "done" }),
    launchDesktop: () => Promise.resolve({ status: "done" }),
    signIn: () => Promise.resolve({ status: "done" }),
    stopDesktop: () => Promise.resolve({ status: "done" }),
    readScreen: () => Promise.resolve({ status: "read", text: SCREEN_TEXT }),
    sendText: () => Promise.resolve({ status: "done" }),
    launchCode: () => Promise.resolve({ status: "done" }),
    openFolder: () => Promise.resolve({ status: "done" }),
    registerRouter: () => Promise.resolve({ status: "done" }),
    pendingChoice: () => Promise.resolve([]),
    choose: () => Promise.resolve({ status: "done" }),
    dismissChoice: () => Promise.resolve({ status: "done" }),
    fitWindow: () => Promise.resolve({ status: "done" }),
  };
  return api;
};

const installDevBridge = (): void => {
  if ("cdmm" in globalThis) {
    return;
  }
  const listeners = new Set<Listener>();
  globalThis.cdmm = {
    api: devApi(),
    onChanged: (listener: Listener): (() => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export { installDevBridge };
