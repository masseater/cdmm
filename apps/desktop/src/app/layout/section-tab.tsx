import { useAtom } from "@effect/atom-react";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { sectionAtom } from "#/app/model/section";
import type { Section } from "#/app/model/section";
import { Button } from "#/shared/ui/button";

const variantOf = (selected: boolean): "default" | "ghost" => {
  if (selected) {
    return "default";
  }
  return "ghost";
};

const SectionTab = ({
  section,
  label,
}: Readonly<{ section: Section; label: string }>): ReactNode => {
  const [current, setCurrent] = useAtom(sectionAtom);
  const select = useCallback(() => {
    setCurrent(section);
  }, [section, setCurrent]);
  return (
    <Button size="sm" variant={variantOf(current === section)} onClick={select}>
      {label}
    </Button>
  );
};

export { SectionTab };
