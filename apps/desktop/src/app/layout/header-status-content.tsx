import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { overviewQuery } from "#/shared/api";

import { DesktopStatus } from "./desktop-status";
import { RouterStatus } from "./router-status";

const HeaderStatusContent = (): ReactNode => {
  const { data } = useSuspenseQuery(overviewQuery);
  return (
    <>
      <DesktopStatus install={data.desktop} />
      <RouterStatus router={data.router} />
    </>
  );
};

export { HeaderStatusContent };
