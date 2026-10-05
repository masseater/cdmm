import type { AccountView } from "@cdmm/core";
import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { selectedAccountAtom, shownAccount } from "#/pages/accounts/model/selection";

import { AccountDetail } from "./account-detail";

const AccountPanel = ({ accounts }: Readonly<{ accounts: readonly AccountView[] }>): ReactNode => {
  const selected = useAtomValue(selectedAccountAtom);
  const view = Option.fromNullishOr(shownAccount({ accounts, selected }));
  return Option.match(view, {
    onNone: () => <p className="text-muted-foreground text-sm md:col-span-2">{COPY.noAccount}</p>,
    onSome: (found) => <AccountDetail key={found.account.id} view={found} />,
  });
};

export { AccountPanel };
