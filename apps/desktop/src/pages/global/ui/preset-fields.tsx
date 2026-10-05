import type { ReactNode } from "react";

import { COPY } from "#/pages/global/config/copy";
import { useDraftAtomChange } from "#/shared/lib/draft-atom";
import { Input } from "#/shared/ui/input";
import { LabeledField } from "#/shared/ui/labeled-field";
import { Textarea } from "#/shared/ui/textarea";

import { McpField } from "./mcp-field";
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
        {(id) => <Input id={id} name="name" required value={form.name.value} onChange={typeName} />}
      </LabeledField>
      <LabeledField label={COPY.mcp}>
        {(id) => <McpField id={id} draft={form.mcp} onChange={editMcp} rows={MCP_ROWS} />}
      </LabeledField>
      <LabeledField label={COPY.codeSettings}>
        {(id) => (
          <Textarea
            id={id}
            name="codeSettings"
            spellCheck={false}
            rows={SETTINGS_ROWS}
            value={form.codeSettings.value}
            onChange={editSettings}
          />
        )}
      </LabeledField>
      <LabeledField label={COPY.rules}>
        {(id) => (
          <Textarea
            id={id}
            name="rules"
            rows={RULES_ROWS}
            value={form.rules.value}
            onChange={editRules}
          />
        )}
      </LabeledField>
    </>
  );
};

export { PresetFields };
