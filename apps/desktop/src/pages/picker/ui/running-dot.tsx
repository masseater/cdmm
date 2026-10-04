import type { ReactNode } from "react";

const RunningDot = ({ running }: Readonly<{ running: boolean }>): ReactNode => {
  if (!running) {
    return "";
  }
  return (
    <span className="border-background bg-running absolute -right-1 -bottom-1 size-6 rounded-full border-4" />
  );
};

export { RunningDot };
