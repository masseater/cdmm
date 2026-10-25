import { useRef, useSyncExternalStore } from "react";

export const Collapsible = ({ title }: { title: string }) => {
  const open = useRef(false);
  const version = useSyncExternalStore(
    () => () => {},
    () => open.current,
  );
  return (
    <button type="button" onClick={() => (open.current = !open.current)}>
      {title}
      {String(version)}
    </button>
  );
};
