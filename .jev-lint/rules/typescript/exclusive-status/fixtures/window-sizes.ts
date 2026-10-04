import { BrowserWindow } from "electron";

type Mode = "compact" | "full";

const SIZES: Readonly<Record<Mode, Readonly<{ width: number; height: number }>>> = {
  compact: { width: 560, height: 340 },
  full: { width: 820, height: 560 },
};

const fit = (mode: Mode): void => {
  const { width, height } = SIZES[mode];
  for (const window of BrowserWindow.getAllWindows()) {
    window.setSize(width, height, true);
  }
};

const reveal = (window: BrowserWindow): void => {
  if (window.isMinimized()) {
    window.restore();
  }
  window.show();
  window.focus();
};

export { fit, reveal };
