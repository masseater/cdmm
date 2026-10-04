import type { Done, Saved } from "@cdmm/core";
import { Option } from "effect";
import type { ReactNode } from "react";

const messageOf = (outcome: Done | Saved): Option.Option<string> => {
  if (outcome.status === "failed") {
    return Option.some(outcome.message);
  }
  if (outcome.status === "rejected") {
    const where = outcome.findings.map((finding) => finding.path).join(", ");
    return Option.some(`Looks like a credential, use {{secret:NAME}} instead: ${where}`);
  }
  return Option.none();
};

const OutcomeMessage = ({
  outcome,
}: Readonly<{ outcome: Option.Option<Done | Saved> }>): ReactNode =>
  outcome.pipe(
    Option.flatMap(messageOf),
    Option.match({
      onNone: () => "",
      onSome: (message) => (
        <p role="alert" className="text-destructive text-sm">
          {message}
        </p>
      ),
    }),
  );

export { OutcomeMessage };
