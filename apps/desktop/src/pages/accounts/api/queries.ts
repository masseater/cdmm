import type { Screen } from "@cdmm/core";
import { queryOptions } from "@tanstack/react-query";
import type { DataTag, UndefinedInitialDataOptions } from "@tanstack/react-query";

import { managerApi } from "#/shared/api";

const SCREEN_REFRESH_MS = 4000;

type ScreenKey = readonly ["screen", string];

type ScreenQuery = UndefinedInitialDataOptions<Screen, Error, Screen, ScreenKey> &
  Readonly<{ queryKey: DataTag<ScreenKey, Screen, Error> }>;

const screenQuery = (accountId: string): ScreenQuery => {
  const queryKey: ScreenKey = ["screen", accountId];
  return queryOptions({
    queryKey,
    queryFn: () => managerApi().readScreen(accountId),
    refetchInterval: SCREEN_REFRESH_MS,
  });
};

export { screenQuery };
