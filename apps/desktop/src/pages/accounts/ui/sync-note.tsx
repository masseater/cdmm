import type { SyncStatus } from "@cdmm/core";
import { Array as Arr, Option } from "effect";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";

const skippedOf = (skipped: readonly string[]): Option.Option<string> => {
  if (Arr.isReadonlyArrayNonEmpty(skipped)) {
    return Option.some(COPY.skipped(skipped.join(", ")));
  }
  return Option.none();
};

const problemOf = (sync: SyncStatus): Option.Option<string> => {
  if (sync.status === "failed") {
    return Option.some(COPY.syncFailed(sync.message));
  }
  if (sync.status === "missing-secrets") {
    return Option.some(COPY.missingSecrets(sync.names.join(", ")));
  }
  if (sync.status === "synced") {
    return skippedOf(sync.skipped);
  }
  return Option.none();
};

const SyncNote = ({ sync }: Readonly<{ sync: SyncStatus }>): ReactNode =>
  Option.match(problemOf(sync), {
    onNone: () => "",
    onSome: (message) => <output className="text-destructive text-sm">{message}</output>,
  });

export { SyncNote };
