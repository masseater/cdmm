import type { ChangeEventHandler, ReactNode } from "react";

import { COPY } from "#/pages/global/config/copy";
import type { DraftAtom, Field } from "#/shared/lib/draft-atom";
import { Textarea } from "#/shared/ui/textarea";

const McpField = ({
  id,
  draft,
  rows,
  onChange,
}: Readonly<{
  id: string;
  draft: DraftAtom;
  rows: number;
  onChange: ChangeEventHandler<Field>;
}>): ReactNode => {
  const hintId = `${id}-hint`;
  return (
    <>
      <p id={hintId} className="text-muted-foreground text-xs">
        {COPY.mcpHelp}
      </p>
      <Textarea
        id={id}
        name="mcp"
        spellCheck={false}
        aria-describedby={hintId}
        rows={rows}
        value={draft.value}
        onChange={onChange}
      />
    </>
  );
};

export { McpField };
