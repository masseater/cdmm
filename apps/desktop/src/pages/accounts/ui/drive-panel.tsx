import type { AccountView } from "@cdmm/core";
import { useId } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";

import { DriveComposer } from "./drive-composer";
import { DriveScreen } from "./drive-screen";

const DrivePanel = ({ view }: Readonly<{ view: AccountView }>): ReactNode => {
  const { id } = view.account;
  const titleId = useId();
  if (!view.running) {
    return "";
  }
  return (
    <section className="flex flex-col gap-2">
      <h3 id={`${titleId}-title`} className="text-sm font-medium">
        {COPY.drive}
      </h3>
      <p id={`${titleId}-hint`} className="text-muted-foreground text-xs">
        {COPY.driveHelp}
      </p>
      <DriveScreen accountId={id} />
      <DriveComposer accountId={id} hintId={`${titleId}-hint`} />
    </section>
  );
};

export { DrivePanel };
