import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { overviewQuery } from "#/shared/api";

import { PresetList } from "./preset-list";
import { PresetPanel } from "./preset-panel";

const GlobalPage = (): ReactNode => {
  const { data } = useSuspenseQuery(overviewQuery);
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <PresetList presets={data.presets} />
      <PresetPanel presets={data.presets} accounts={data.accounts} />
    </div>
  );
};

export { GlobalPage };
