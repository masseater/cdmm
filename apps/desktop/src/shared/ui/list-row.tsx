import type { ReactNode } from "react";

const ListRow = ({
  title,
  pressed,
  onSelect,
  children,
}: Readonly<{
  title: string;
  pressed: boolean;
  onSelect: () => void;
  children: ReactNode;
}>): ReactNode => (
  <li>
    <button
      type="button"
      aria-pressed={pressed}
      className="hover:bg-muted aria-pressed:bg-secondary focus-visible:ring-ring/50 flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-sm font-medium outline-none focus-visible:ring-3"
      onClick={onSelect}
    >
      {title}
      {children}
    </button>
  </li>
);

export { ListRow };
