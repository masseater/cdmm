import { McpMapSchema, SettingsSchema } from "@claude-max-manager/core";
import type { Preset, Saved } from "@claude-max-manager/core";
import { Result, Schema } from "effect";
import { useCallback } from "react";
import type { SubmitEventHandler } from "react";

import { COPY } from "#/pages/global/config/copy";
import { managerApi, useAction } from "#/shared/api";
import { useDraftAtom } from "#/shared/lib/draft-atom";
import type { DraftAtom } from "#/shared/lib/draft-atom";
import { formatJson } from "#/shared/lib/json";

type PresetDraftAtoms = Readonly<{
  name: DraftAtom;
  mcp: DraftAtom;
  codeSettings: DraftAtom;
  rules: DraftAtom;
  submit: SubmitEventHandler<HTMLFormElement>;
  outcome: Saved | undefined;
}>;

const parseMcp = Schema.decodeUnknownResult(Schema.fromJsonString(McpMapSchema));
const parseSettings = Schema.decodeUnknownResult(Schema.fromJsonString(SettingsSchema));

const failed = (message: string): Promise<Saved> => Promise.resolve({ status: "failed", message });

const saveFrom = (
  input: Readonly<{ id: string; name: string; mcp: string; codeSettings: string; rules: string }>,
): Promise<Saved> => {
  const mcp = parseMcp(input.mcp);
  if (Result.isFailure(mcp)) {
    return failed(COPY.invalid(COPY.mcp, mcp.failure.message));
  }
  const codeSettings = parseSettings(input.codeSettings);
  if (Result.isFailure(codeSettings)) {
    return failed(COPY.invalid(COPY.codeSettings, codeSettings.failure.message));
  }
  return managerApi().savePreset({
    id: input.id,
    name: input.name,
    rules: input.rules,
    mcp: mcp.success,
    codeSettings: codeSettings.success,
  });
};

const usePresetDraftAtoms = (preset: Preset): PresetDraftAtoms => {
  const prefix = `preset:${preset.id}`;
  const name = useDraftAtom({ key: `${prefix}:name`, saved: preset.name });
  const mcp = useDraftAtom({ key: `${prefix}:mcp`, saved: formatJson(preset.mcp) });
  const codeSettings = useDraftAtom({
    key: `${prefix}:settings`,
    saved: formatJson(preset.codeSettings),
  });
  const rules = useDraftAtom({ key: `${prefix}:rules`, saved: preset.rules });
  const action = useAction({ key: "save-preset", run: saveFrom });
  const { mutate } = action;
  const submit: SubmitEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();
      const input = {
        id: preset.id,
        name: name.value,
        mcp: mcp.value,
        codeSettings: codeSettings.value,
        rules: rules.value,
      };
      mutate(input, {
        onSuccess: (outcome) => {
          if (outcome.status === "saved") {
            for (const draft of [name, mcp, codeSettings, rules]) {
              draft.reset();
            }
          }
        },
      });
    },
    [codeSettings, mcp, mutate, name, preset.id, rules],
  );
  return { name, mcp, codeSettings, rules, submit, outcome: action.data };
};

export type { PresetDraftAtoms };
export { usePresetDraftAtoms };
