import { useMutation } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

const useAction = <Input, Output>(
  input: Readonly<{ key: string; run: (value: Input) => Promise<Output> }>,
): UseMutationResult<Output, Error, Input> =>
  useMutation({ mutationKey: ["action", input.key], mutationFn: input.run });

export { useAction };
