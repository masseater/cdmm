import type { AccountView } from "@cdmm/core";
import { Atom } from "effect/reactivity";

const selectedAccountAtom = Atom.make("");

const armedDeleteAtom = Atom.make("");

const FIRST = 0;

const shownAccount = ({
  accounts,
  selected,
}: Readonly<{ accounts: readonly AccountView[]; selected: string }>): AccountView | undefined =>
  accounts.find((each) => each.account.id === selected) ?? accounts.at(FIRST);

export { armedDeleteAtom, selectedAccountAtom, shownAccount };
