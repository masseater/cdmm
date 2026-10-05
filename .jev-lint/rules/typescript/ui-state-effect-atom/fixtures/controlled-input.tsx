import type { ComponentProps } from "react";

export const Input = ({ className, ...props }: ComponentProps<"input">) => (
  <input className={["rounded-md border px-3", className].join(" ")} {...props} />
);
