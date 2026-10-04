import type { Done, Saved, SecretFinding } from "@claude-max-manager/core";
import { Array as Arr, Effect } from "effect";

import { ManagerError } from "./errors.ts";

type Failable = Readonly<{ message: string }>;

const ensure = (
  input: Readonly<{ holds: boolean; message: string }>,
): Effect.Effect<void, ManagerError> => {
  if (input.holds) {
    return Effect.void;
  }
  return Effect.fail(new ManagerError({ message: input.message }));
};
const DONE: Done = { status: "done" };
const SAVED: Saved = { status: "saved" };

const settle = <Failure extends Failable, Services>(
  effect: Effect.Effect<unknown, Failure, Services>,
): Effect.Effect<Done, never, Services> =>
  effect.pipe(
    Effect.match({
      onSuccess: (): Done => DONE,
      onFailure: (error): Done => ({ status: "failed", message: error.message }),
    }),
  );

const saveChecked = <Failure extends Failable, Services>(
  input: Readonly<{
    findings: readonly SecretFinding[];
    action: Effect.Effect<unknown, Failure, Services>;
  }>,
): Effect.Effect<Saved, never, Services> => {
  if (Arr.isReadonlyArrayNonEmpty(input.findings)) {
    return Effect.succeed({ status: "rejected", findings: input.findings } satisfies Saved);
  }
  return input.action.pipe(
    Effect.match({
      onSuccess: (): Saved => SAVED,
      onFailure: (error): Saved => ({ status: "failed", message: error.message }),
    }),
  );
};

export type { Failable };
export { ensure, saveChecked, settle };
