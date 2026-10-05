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
      {(id) => (
        <select
          id={id}
          name="preset"
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-3"
          value={draft.value}
          onChange={choose}
        >
          {data.presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      )}
    </LabeledField>
  );
};

export { PresetSelect };
