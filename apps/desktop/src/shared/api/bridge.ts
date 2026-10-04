import type { ManagerApi } from "@claude-max-manager/core";

type Bridge = Readonly<{
  api: ManagerApi;
  onChanged: (listener: () => void) => () => void;
}>;

declare global {
  var claudeMaxManager: Bridge;
}

const managerApi = (): ManagerApi => globalThis.claudeMaxManager.api;

const onManagerChanged = (listener: () => void): (() => void) =>
  globalThis.claudeMaxManager.onChanged(listener);

export { managerApi, onManagerChanged };
