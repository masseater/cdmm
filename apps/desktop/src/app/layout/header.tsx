import type { ReactNode } from "react";

import { COPY } from "#/app/config/copy";
import type { Section } from "#/app/model/section";

import { HeaderStatus } from "./header-status";
import { SectionTabs } from "./section-tabs";

const Header = ({ section }: Readonly<{ section: Section }>): ReactNode => {
  if (section === "picker") {
    return (
      <header className="flex justify-end gap-3 px-6 pt-3">
        <HeaderStatus />
      </header>
    );
  }
  return (
    <header className="flex flex-wrap items-center gap-4 border-b px-6 py-3">
      <h1 className="text-lg font-semibold">{COPY.title}</h1>
      <SectionTabs />
      <div className="ml-auto flex items-center gap-3">
        <HeaderStatus />
      </div>
    </header>
  );
};

export { Header };
