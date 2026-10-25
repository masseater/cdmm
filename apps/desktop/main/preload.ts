import { API_METHODS } from "@cdmm/core/methods";
import { contextBridge, ipcRenderer } from "electron";

const CHANGED = "cmm:changed";

const api = Object.fromEntries(
  API_METHODS.map((method) => [
    method,
    (argument: unknown): Promise<unknown> => ipcRenderer.invoke(`cmm:${method}`, argument),
  ]),
);

contextBridge.exposeInMainWorld("cdmm", {
  api,
  onChanged: (listener: () => void): (() => void) => {
    const handler = (): void => {
      listener();
    };
    ipcRenderer.on(CHANGED, handler);
    return () => {
      ipcRenderer.off(CHANGED, handler);
    };
  },
} satisfies Readonly<{ api: Readonly<Record<string, unknown>>; onChanged: unknown }>);
