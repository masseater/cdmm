import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./layout/app";
import { installDevBridge } from "./dev-bridge";

if (import.meta.env.DEV) installDevBridge();

const queryClient = new QueryClient();
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
