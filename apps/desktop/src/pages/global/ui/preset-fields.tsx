import type { ReactNode } from "react";

import { COPY } from "#/pages/global/config/copy";
import { useDraftAtomChange } from "#/shared/lib/draft-atom";
import { Button } from "#/shared/ui/button";
import { Input } from "#/shared/ui/input";
import { LabeledField } from "#/shared/ui/labeled-field";
import { Textarea } from "#/shared/ui/textarea";

import type { PresetDraftAtoms } from "./use-preset-draft-atoms";

const MCP_ROWS = 14;
const SETTINGS_ROWS = 8;
const RULES_ROWS = 6;

const PresetFields = ({ form }: Readonly<{ form: PresetDraftAtoms }>): ReactNode => {
  const typeName = useDraftAtomChange(form.name);
  const editMcp = useDraftAtomChange(form.mcp);
  const editSettings = useDraftAtomChange(form.codeSettings);
  const editRules = useDraftAtomChange(form.rules);
  return (
    <>
      <LabeledField label={COPY.name}>
        <Input value={form.name.value} onChange={typeName} />
      </LabeledField>
      <LabeledField label={COPY.mcp}>
        <Textarea rows={MCP_ROWS} title={COPY.mcpHelp} value={form.mcp.value} onChange={editMcp} />
      </LabeledField>
      <LabeledField label={COPY.codeSettings}>
        <Textarea rows={SETTINGS_ROWS} value={form.codeSettings.value} onChange={editSettings} />
      </LabeledField>
      <LabeledField label={COPY.rules}>
        <Textarea rows={RULES_ROWS} value={form.rules.value} onChange={editRules} />
      </LabeledField>
      <Button type="submit" size="sm">
        {COPY.save}
      </Button>
    </>
  );
};

export { PresetFields };
