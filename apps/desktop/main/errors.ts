import { Data } from "effect";

class ManagerError extends Data.TaggedError("ManagerError")<{ readonly message: string }> {}

export { ManagerError };
