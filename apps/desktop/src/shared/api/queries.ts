import { queryOptions } from "@tanstack/react-query";

import { managerApi } from "./bridge";

const REFRESH_MS = 3000;

const overviewQuery = queryOptions({
  queryKey: ["overview"],
  queryFn: () => managerApi().overview(),
  refetchInterval: REFRESH_MS,
});

const pendingChoiceQuery = queryOptions({
  queryKey: ["pending-choice"],
  queryFn: () => managerApi().pendingChoice(),
});

export { overviewQuery, pendingChoiceQuery };
