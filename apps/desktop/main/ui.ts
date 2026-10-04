import type { ApiInput } from "@cdmm/core";
import { Effect, Option } from "effect";
import { app, BrowserWindow, Menu, Tray } from "electron";

type Locations = Readonly<{
  preload: string;
  renderer: string;
  icon: string;
  tray: string;
}>;

type Ui = Readonly<{
  showWindow: () => void;
  notify: () => void;
  fit: (mode: ApiInput<"fitWindow">) => void;
}>;

const CHANGED = "cmm:changed";
const SIZES: Readonly<Record<ApiInput<"fitWindow">, Readonly<{ width: number; height: number }>>> =
  {
    picker: { width: 560, height: 340 },
    manage: { width: 820, height: 560 },
  };
const FIRST = 0;

const createWindow = (locations: Locations): void => {
  const window = new BrowserWindow({
    ...SIZES.picker,
    title: "Claude Max Desktop Manager",
    icon: locations.icon,
    autoHideMenuBar: true,
    webPreferences: {
      preload: locations.preload,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => {
    event.preventDefault();
  });
  Effect.runFork(Effect.promise(() => window.loadFile(locations.renderer)));
};

const notify = (): void => {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(CHANGED);
  }
};

const fit = (mode: ApiInput<"fitWindow">): void => {
  const { width, height } = SIZES[mode];
  for (const window of BrowserWindow.getAllWindows()) {
    window.setSize(width, height, true);
  }
};

const makeUi = (locations: Locations): Ui => {
  const showWindow = (): void => {
    const existing = Option.fromNullishOr(BrowserWindow.getAllWindows().at(FIRST));
    if (Option.isNone(existing)) {
      createWindow(locations);
      return;
    }
    if (existing.value.isMinimized()) {
      existing.value.restore();
    }
    existing.value.show();
    existing.value.focus();
  };
  return { showWindow, notify, fit };
};

const createTray = (input: Readonly<{ locations: Locations; ui: Ui }>): Tray => {
  const tray = new Tray(input.locations.tray);
  tray.setToolTip("Claude Max Desktop Manager");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open", click: input.ui.showWindow },
      { type: "separator" },
      {
        label: "Quit",
        click: (): void => {
          app.quit();
        },
      },
    ]),
  );
  tray.on("click", input.ui.showWindow);
  return tray;
};

export type { Locations, Ui };
export { createTray, makeUi };
