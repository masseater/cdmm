import { useSyncExternalStore } from "react";

let open = false;
const listeners = new Set<() => void>();

export const toggleSidebar = () => {
  open = !open;
  listeners.forEach((listener) => listener());
};

export const useSidebarOpen = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => open,
  );
