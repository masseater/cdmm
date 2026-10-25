import type { AccountView } from "@cdmm/core";
import { useAtom, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Atom } from "effect/reactivity";

const selectedAccountAtom = Atom.make("");

const armedDeleteAtom = Atom.make("");

const useSelectedAccount = (): string => useAtomValue(selectedAccountAtom);

const useSelectAccount = (): ((id: string) => void) => useAtomSet(selectedAccountAtom);

const useArmedDelete = (): readonly [string, (id: string) => void] => useAtom(armedDeleteAtom);

const FIRST = 0;

const shownAccount = ({
  accounts,
  selected,
}: Readonly<{ accounts: readonly AccountView[]; selected: string }>): AccountView | undefined =>
  accounts.find((each) => each.account.id === selected) ?? accounts.at(FIRST);

export { shownAccount, useArmedDelete, useSelectAccount, useSelectedAccount };
