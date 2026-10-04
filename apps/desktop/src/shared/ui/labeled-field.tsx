import type { ReactNode } from "react";

const LabeledField = ({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>): ReactNode => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="text-muted-foreground font-medium">{label}</span>
    {children}
  </label>
);

export { LabeledField };
