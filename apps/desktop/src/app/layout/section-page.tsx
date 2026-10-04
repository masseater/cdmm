import type { ReactNode } from "react";

import type { Section } from "#/app/model/section";
import { AccountsPage } from "#/pages/accounts";
import { GlobalPage } from "#/pages/global";

const SectionPage = ({ section }: Readonly<{ section: Section }>): ReactNode => {
  if (section === "global") {
    return <GlobalPage />;
  }
  return <AccountsPage />;
};

export { SectionPage };
