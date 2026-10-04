import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { overviewQuery } from "#/shared/api";
import { useDraftAtomChange } from "#/shared/lib/draft-atom";
import type { DraftAtom } from "#/shared/lib/draft-atom";
import { LabeledField } from "#/shared/ui/labeled-field";

const PresetSelect = ({ draft }: Readonly<{ draft: DraftAtom }>): ReactNode => {
  const { data } = useSuspenseQuery(overviewQuery);
  const choose = useDraftAtomChange(draft);
  return (
    <LabeledField label={COPY.preset}>
      <select
        className="border-input h-9 rounded-md border bg-transparent px-2 text-sm"
        value={draft.value}
        onChange={choose}
      >
        {data.presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
    </LabeledField>
  );
};

export { PresetSelect };
