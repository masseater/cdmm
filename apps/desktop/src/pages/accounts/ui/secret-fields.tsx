import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { useDraftAtomChange } from "#/shared/lib/draft-atom";
import type { DraftAtom } from "#/shared/lib/draft-atom";
import { Input } from "#/shared/ui/input";
import { LabeledField } from "#/shared/ui/labeled-field";

const SecretFields = ({
  name,
  value,
}: Readonly<{ name: DraftAtom; value: DraftAtom }>): ReactNode => {
  const typeName = useDraftAtomChange(name);
  const typeValue = useDraftAtomChange(value);
  return (
    <>
      <LabeledField label={COPY.secretName}>
        {(id) => (
          <Input
            id={id}
            name="name"
            required
            spellCheck={false}
            placeholder="GITHUB_TOKEN"
            value={name.value}
            onChange={typeName}
          />
        )}
      </LabeledField>
      <LabeledField label={COPY.secretValue}>
        {(id) => (
          <Input
            id={id}
            name="value"
            type="password"
            required
            autoComplete="off"
            value={value.value}
            onChange={typeValue}
          />
        )}
      </LabeledField>
    </>
  );
};

export { SecretFields };
