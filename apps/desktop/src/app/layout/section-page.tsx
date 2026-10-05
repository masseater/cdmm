import { useAtomSet } from "@effect/atom-react";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { sectionAtom } from "#/app/model/section";
import type { Section } from "#/app/model/section";
import { AccountsPage } from "#/pages/accounts";
import { GlobalPage } from "#/pages/global";
import { PickerPage } from "#/pages/picker";

const SectionPage = ({ section }: Readonly<{ section: Section }>): ReactNode => {
  const setSection = useAtomSet(sectionAtom);
  const manage = useCallback(() => {
    setSection("accounts");
  }, [setSection]);
  if (section === "picker") {
    return <PickerPage onManage={manage} />;
  }
  if (section === "global") {
    return <GlobalPage />;
  }
  return <AccountsPage />;
};

export { SectionPage };
