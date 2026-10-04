import type { ReactNode } from "react";

import { initialsOf, toneOf } from "#/pages/picker/model/look";
import { cn } from "#/shared/lib/utils";

import { RunningDot } from "./running-dot";

const ProfileIcon = ({
  label,
  index,
  running,
}: Readonly<{ label: string; index: number; running: boolean }>): ReactNode => (
  <span
    className={cn(
      "relative flex size-28 items-center justify-center rounded-3xl text-4xl font-semibold text-white",
      toneOf(index),
    )}
  >
    {initialsOf(label)}
    <RunningDot running={running} />
  </span>
);

export { ProfileIcon };
