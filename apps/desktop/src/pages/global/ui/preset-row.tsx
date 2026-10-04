import type { AccountView, Preset } from "@claude-max-manager/core";
import { useAtom } from "@effect/atom-react";
import { Array as Arr } from "effect";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/pages/global/config/copy";
import { selectedPresetAtom } from "#/pages/global/model/selection";
import { ListRow } from "#/shared/ui/list-row";

const usersOf = (accounts: readonly AccountView[], presetId: string): string => {
  const users = accounts.filter((view) => view.account.presetId === presetId);
  if (Arr.isReadonlyArrayNonEmpty(users)) {
    return users.map((view) => view.account.label).join(", ");
  }
  return COPY.unused;
};

const PresetRow = ({
  preset,
  accounts,
}: Readonly<{ preset: Preset; accounts: readonly AccountView[] }>): ReactNode => {
  const [selected, setSelected] = useAtom(selectedPresetAtom);
  const select = useCallback(() => {
    setSelected(preset.id);
  }, [preset.id, setSelected]);
  return (
    <ListRow title={preset.name} pressed={selected === preset.id} onSelect={select}>
      <span className="text-muted-foreground truncate text-xs">{usersOf(accounts, preset.id)}</span>
    </ListRow>
  );
};

export { PresetRow };
