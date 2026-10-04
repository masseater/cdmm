import type { Preset } from "@claude-max-manager/core";
import { useAtom } from "@effect/atom-react";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { selectedPresetAtom } from "#/pages/global/model/selection";
import { Button } from "#/shared/ui/button";

const variantOf = (selected: boolean): "secondary" | "ghost" => {
  if (selected) {
    return "secondary";
  }
  return "ghost";
};

const PresetRow = ({ preset }: Readonly<{ preset: Preset }>): ReactNode => {
  const [selected, setSelected] = useAtom(selectedPresetAtom);
  const select = useCallback(() => {
    setSelected(preset.id);
  }, [preset.id, setSelected]);
  return (
    <li>
      <Button variant={variantOf(selected === preset.id)} onClick={select}>
        {preset.name}
      </Button>
    </li>
  );
};

export { PresetRow };
