import type { ReactNode } from "react";

import { COPY } from "#/app/config/copy";

import { SectionTab } from "./section-tab";

const SectionTabs = (): ReactNode => (
  <nav className="flex gap-2">
    <SectionTab section="picker" label={COPY.back} />
    <SectionTab section="accounts" label={COPY.accounts} />
    <SectionTab section="global" label={COPY.global} />
  </nav>
);

export { SectionTabs };
