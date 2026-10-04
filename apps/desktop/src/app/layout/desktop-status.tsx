import type { DesktopInstall } from "@claude-max-manager/core";
import type { ReactNode } from "react";

import { COPY } from "#/app/config/copy";
import { Badge } from "#/shared/ui/badge";

const DesktopStatus = ({ install }: Readonly<{ install: DesktopInstall }>): ReactNode => {
  if (install.status === "missing") {
    return <Badge variant="destructive">{COPY.desktopMissing}</Badge>;
  }
  if (install.status === "unsupported-platform") {
    return <Badge variant="outline">{COPY.windowsOnly}</Badge>;
  }
  if (install.testedVersion) {
    return "";
  }
  return <Badge variant="outline">{COPY.desktopUntested(install.version)}</Badge>;
};

export { DesktopStatus };
