import { useId } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { useDraftAtomChange } from "#/shared/lib/draft-atom";
import type { DraftAtom } from "#/shared/lib/draft-atom";
import { Textarea } from "#/shared/ui/textarea";

const OVERRIDE_ROWS = 8;

const OverrideField = ({ draft }: Readonly<{ draft: DraftAtom }>): ReactNode => {
  const edit = useDraftAtomChange(draft);
  const id = useId();
  return (
    <>
      <h3 id={`${id}-title`} className="text-sm font-medium">
        {COPY.override}
      </h3>
      <p id={`${id}-hint`} className="text-muted-foreground text-xs">
        {COPY.overrideHelp}
      </p>
      <Textarea
        name="override"
        spellCheck={false}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-hint`}
        rows={OVERRIDE_ROWS}
        value={draft.value}
        onChange={edit}
      />
    </>
  );
};

export { OverrideField };
