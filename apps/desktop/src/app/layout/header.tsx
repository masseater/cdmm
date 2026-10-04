import type { ReactNode } from "react";

import { COPY } from "#/app/config/copy";

import { HeaderStatus } from "./header-status";
import { SectionTabs } from "./section-tabs";

const Header = (): ReactNode => (
  <header className="flex flex-wrap items-center gap-4 border-b px-6 py-3">
    <h1 className="text-lg font-semibold">{COPY.title}</h1>
    <SectionTabs />
    <div className="ml-auto flex items-center gap-3">
      <HeaderStatus />
    </div>
  </header>
);

export { Header };
