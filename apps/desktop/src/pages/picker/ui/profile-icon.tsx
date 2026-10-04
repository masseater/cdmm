import type { ReactNode } from "react";

import { RunningDot } from "./running-dot";

const FIRST = 0;

const ProfileIcon = ({
  label,
  running,
}: Readonly<{ label: string; running: boolean }>): ReactNode => (
  <span className="bg-primary text-primary-foreground relative flex size-28 items-center justify-center rounded-3xl text-5xl font-semibold">
    {label.charAt(FIRST).toUpperCase()}
    <RunningDot running={running} />
  </span>
);

export { ProfileIcon };
