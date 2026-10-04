import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { overviewQuery } from "#/shared/api";
import { useDraftAtomChange } from "#/shared/lib/draft-atom";
import type { DraftAtom } from "#/shared/lib/draft-atom";

const PresetSelect = ({ draft }: Readonly<{ draft: DraftAtom }>): ReactNode => {
  const { data } = useSuspenseQuery(overviewQuery);
  const choose = useDraftAtomChange(draft);
  return (
    <select
      aria-label={COPY.preset}
      title={COPY.preset}
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
  );
};

export { PresetSelect };
