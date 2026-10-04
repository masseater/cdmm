import type { SyncStatus } from "@claude-max-manager/core";
import { Array as Arr } from "effect";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";

const messageOf = (sync: SyncStatus): string => {
  if (sync.status === "failed") {
    return COPY.syncFailed(sync.message);
  }
  if (sync.status === "missing-secrets") {
    return COPY.missingSecrets(sync.names.join(", "));
  }
  if (Arr.isReadonlyArrayNonEmpty(sync.skipped)) {
    return COPY.skipped(sync.skipped.join(", "));
  }
  return COPY.synced;
};

const SyncNote = ({ sync }: Readonly<{ sync: SyncStatus }>): ReactNode => (
  <output className="text-muted-foreground text-sm">{messageOf(sync)}</output>
);

export { SyncNote };
