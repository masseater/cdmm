import { useId } from "react";
import type { ReactNode } from "react";

const LabeledField = ({
  label,
  children,
}: Readonly<{ label: string; children: (id: string) => ReactNode }>): ReactNode => {
  const id = useId();
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id} className="text-muted-foreground font-medium">
        {label}
      </label>
      {children(id)}
    </div>
  );
};

export { LabeledField };
