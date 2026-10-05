import { useAtomValue } from "@effect/atom-react";
import { useQueryClient } from "@tanstack/react-query";
import { Effect } from "effect";
import { Suspense, useEffect } from "react";
import type { ReactNode } from "react";

import { sectionAtom, titleOf, windowModeOf } from "#/app/model/section";
import { managerApi, onManagerChanged } from "#/shared/api";

import { ChoiceBanner } from "./choice-banner";
import { Header } from "./header";
import { MainArea } from "./main-area";

const App = (): ReactNode => {
  const queryClient = useQueryClient();
  const section = useAtomValue(sectionAtom);
  useEffect(
    () =>
      onManagerChanged(() => {
        Effect.runFork(Effect.promise(() => queryClient.invalidateQueries()));
      }),
    [queryClient],
  );
  useEffect(() => {
    document.title = titleOf(section);
    Effect.runFork(Effect.promise(() => managerApi().fitWindow(windowModeOf(section))));
  }, [section]);
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header section={section} />
      <Suspense>
        <ChoiceBanner />
      </Suspense>
      <MainArea section={section} />
    </div>
  );
};

export { App };
