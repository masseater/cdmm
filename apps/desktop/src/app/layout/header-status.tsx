import { Suspense } from "react";
import type { ReactNode } from "react";

import { HeaderStatusContent } from "./header-status-content";

const HeaderStatus = (): ReactNode => (
  <Suspense>
    <HeaderStatusContent />
  </Suspense>
);

export { HeaderStatus };
