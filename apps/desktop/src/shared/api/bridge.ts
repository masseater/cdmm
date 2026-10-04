import type { ManagerApi } from "@cdmm/core";

type Bridge = Readonly<{
  api: ManagerApi;
  onChanged: (listener: () => void) => () => void;
}>;

declare global {
  var cdmm: Bridge;
}

const managerApi = (): ManagerApi => globalThis.cdmm.api;

const onManagerChanged = (listener: () => void): (() => void) =>
  globalThis.cdmm.onChanged(listener);

export { managerApi, onManagerChanged };
