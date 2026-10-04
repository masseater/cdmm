import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { overviewQuery, pendingChoiceQuery } from "#/shared/api";

import { ChoiceRow } from "./choice-row";

const ChoiceBanner = (): ReactNode => {
  const pending = useSuspenseQuery(pendingChoiceQuery).data;
  const { accounts } = useSuspenseQuery(overviewQuery).data;
  return (
    <section aria-label="Waiting links" className="flex flex-col gap-2 px-6 empty:hidden">
      {pending.map((choice) => (
        <ChoiceRow key={choice.link} choice={choice} accounts={accounts} />
      ))}
    </section>
  );
};

export { ChoiceBanner };
