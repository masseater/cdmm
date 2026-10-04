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
}>;

const CHANGED = "cmm:changed";
const WINDOW_WIDTH = 1180;
const WINDOW_HEIGHT = 780;
const FIRST = 0;

const createWindow = (locations: Locations): void => {
  const window = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    title: "Claude Max Manager",
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
  return { showWindow, notify };
};

const createTray = (input: Readonly<{ locations: Locations; ui: Ui }>): Tray => {
  const tray = new Tray(input.locations.tray);
  tray.setToolTip("Claude Max Manager");
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
