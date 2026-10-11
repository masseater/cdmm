import type { Screen } from "@cdmm/core";
import { useQuery } from "@tanstack/react-query";
import { Effect, Option, String as Str } from "effect";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { screenQuery } from "#/pages/accounts/api/queries";
import { COPY } from "#/pages/accounts/config/copy";
import { Button } from "#/shared/ui/button";

const readText = (screen: Screen): Option.Option<string> => {
  if (screen.status === "read") {
    return Option.some(Str.trim(screen.text));
  }
  return Option.none();
};

const failureText = (screen: Screen): Option.Option<string> => {
  if (screen.status === "failed") {
    return Option.some(screen.message);
  }
  return Option.none();
};

const noteFor = (read: Option.Option<string>, loading: boolean): Option.Option<string> => {
  if (Option.isSome(read)) {
    if (Str.isEmpty(read.value)) {
      return Option.some(COPY.screenEmpty);
    }
    return Option.none();
  }
  if (loading) {
    return Option.some(COPY.reading);
  }
  return Option.none();
};

const transcriptView = (read: Option.Option<string>): ReactNode => (
  <div role="log" aria-label={COPY.screen}>
    {Option.match(read.pipe(Option.filter(Str.isNonEmpty)), {
      onNone: () => "",
      onSome: (text) => (
        <pre className="border-input bg-muted/40 max-h-56 overflow-auto rounded-md border p-2 font-mono text-xs whitespace-pre-wrap">
          {text}
        </pre>
      ),
    })}
  </div>
);

const noteView = (note: Option.Option<string>): ReactNode =>
  Option.match(note, {
    onNone: () => "",
    onSome: (text) => <p className="text-muted-foreground text-xs">{text}</p>,
  });

const failureView = (fail: Option.Option<string>): ReactNode =>
  Option.match(fail, {
    onNone: () => "",
    onSome: (message) => (
      <p role="alert" className="text-destructive text-sm">
        {message}
      </p>
    ),
  });

const DriveScreen = ({ accountId }: Readonly<{ accountId: string }>): ReactNode => {
  const screen = useQuery(screenQuery(accountId));
  const { refetch } = screen;
  const refresh = useCallback(() => {
    Effect.runFork(Effect.promise(() => refetch()));
  }, [refetch]);
  const data = Option.fromNullishOr(screen.data);
  const read = data.pipe(Option.flatMap(readText));
  return (
    <>
      {transcriptView(read)}
      {noteView(noteFor(read, screen.isFetching))}
      {failureView(data.pipe(Option.flatMap(failureText)))}
      <Button size="sm" variant="outline" disabled={screen.isFetching} onClick={refresh}>
        {COPY.readScreen}
      </Button>
    </>
  );
};

export { DriveScreen };
