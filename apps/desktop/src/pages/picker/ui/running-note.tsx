import type { ReactNode } from "react";

import { COPY } from "#/pages/picker/config/copy";

const RunningNote = ({ running }: Readonly<{ running: boolean }>): ReactNode => {
  if (!running) {
    return "";
  }
  return <span className="sr-only">{COPY.running}</span>;
};

export { RunningNote };
