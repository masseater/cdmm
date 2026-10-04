import type { Done, Saved } from "@claude-max-manager/core";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

type Outcome = Done | Saved;

const useAction = <Input, Output extends Outcome>(
  input: Readonly<{ key: string; run: (value: Input) => Promise<Output> }>,
): UseMutationResult<Output, Error, Input> =>
  useMutation({ mutationKey: ["action", input.key], mutationFn: input.run });

export type { Outcome };
export { useAction };
