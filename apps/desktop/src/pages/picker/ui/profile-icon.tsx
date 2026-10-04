import type { ReactNode } from "react";

import { RunningDot } from "./running-dot";

const FIRST = 0;

const ProfileIcon = ({
  label,
  running,
}: Readonly<{ label: string; running: boolean }>): ReactNode => (
  <span className="bg-primary text-primary-foreground relative flex size-20 items-center justify-center rounded-2xl text-3xl font-semibold">
    {label.charAt(FIRST).toUpperCase()}
    <RunningDot running={running} />
  </span>
);

export { ProfileIcon };
