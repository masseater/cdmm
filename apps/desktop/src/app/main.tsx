import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Effect } from "effect";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./layout/app";

const queryClient = new QueryClient();

const mount = (): void => {
  const container = document.querySelector("#root");
  if (container instanceof HTMLElement) {
    createRoot(container).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </StrictMode>,
    );
  }
};

if (import.meta.env.DEV) {
  Effect.runFork(
    Effect.andThen(
      Effect.promise(() => import("./dev-bridge")),
      () => Effect.sync(mount),
    ),
  );
} else {
  mount();
}
