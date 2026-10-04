import type { AccountView } from "@claude-max-manager/core";
import { Option } from "effect";
import { useCallback } from "react";
import type { ReactNode, SubmitEventHandler } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { managerApi, useAction } from "#/shared/api";
import { useDraftAtom } from "#/shared/lib/draft-atom";
import { Button } from "#/shared/ui/button";
import { OutcomeMessage } from "#/shared/ui/outcome-message";

import { LabelField } from "./label-field";
import { PresetSelect } from "./preset-select";

const SettingsForm = ({ view }: Readonly<{ view: AccountView }>): ReactNode => {
  const { account } = view;
  const label = useDraftAtom({ key: `account:${account.id}:label`, saved: account.label });
  const preset = useDraftAtom({ key: `account:${account.id}:preset`, saved: account.presetId });
  const action = useAction({ key: "save-account", run: managerApi().saveAccount });
  const { mutate } = action;
  const submit: SubmitEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();
      mutate(
        { ...account, label: label.value, presetId: preset.value },
        {
          onSuccess: () => {
            label.reset();
            preset.reset();
          },
        },
      );
    },
    [account, label, mutate, preset],
  );
  return (
    <form className="mt-4 flex flex-col gap-3" onSubmit={submit}>
      <LabelField draft={label} />
      <PresetSelect draft={preset} />
      <div>
        <Button type="submit" size="sm">
          {COPY.save}
        </Button>
      </div>
      <OutcomeMessage outcome={Option.fromNullishOr(action.data)} />
    </form>
  );
};

export { SettingsForm };
