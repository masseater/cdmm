import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { useDraftAtomChange } from "#/shared/lib/draft-atom";
import type { DraftAtom } from "#/shared/lib/draft-atom";
import { Input } from "#/shared/ui/input";
import { LabeledField } from "#/shared/ui/labeled-field";

const LabelField = ({ draft }: Readonly<{ draft: DraftAtom }>): ReactNode => {
  const typeLabel = useDraftAtomChange(draft);
  return (
    <LabeledField label={COPY.label}>
      <Input value={draft.value} onChange={typeLabel} />
    </LabeledField>
  );
};

export { LabelField };
