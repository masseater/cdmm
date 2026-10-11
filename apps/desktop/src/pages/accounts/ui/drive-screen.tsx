import type { Screen } from "@cdmm/core";
import { useQuery } from "@tanstack/react-query";
import { Effect, Option, String as Str } from "effect";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { screenQuery } from "#/pages/accounts/api/queries";
import { COPY } from "#/pages/accounts/config/copy";
import { Button } from "#/shared/ui/button";

const readValue = (screen: Screen): Option.Option<string> => {
  if (screen.status === "read") {
    return Option.some(screen.text);
  }
  return Option.none();
};

const failure = (screen: Screen): Option.Option<string> => {
  if (screen.status === "failed") {
    return Option.some(screen.message);
  }
  return Option.none();
};

const trimmedRead = (data: Option.Option<Screen>): Option.Option<string> =>
  data.pipe(Option.flatMap(readValue), Option.map(Str.trim));

const blankNote = (text: string): Option.Option<string> => {
  if (Str.isEmpty(text)) {
    return Option.some(COPY.screenEmpty);
  }
  return Option.none();
};

const noteText = (data: Option.Option<Screen>, loading: boolean): Option.Option<string> => {
  const read = trimmedRead(data);
  if (Option.isSome(read)) {
    return blankNote(read.value);
  }
  if (loading) {
    return Option.some(COPY.reading);
  }
  return Option.none();
};

const transcriptView = (data: Option.Option<Screen>): ReactNode => (
  <div role="log" aria-label={COPY.screen}>
    {Option.match(trimmedRead(data).pipe(Option.filter(Str.isNonEmpty)), {
      onNone: () => "",
      onSome: (text) => (
        <pre className="border-input bg-muted/40 max-h-56 overflow-auto rounded-md border p-2 font-mono text-xs whitespace-pre-wrap">
          {text}
        </pre>
      ),
    })}
  </div>
);

const noteView = (data: Option.Option<Screen>, loading: boolean): ReactNode =>
  Option.match(noteText(data, loading), {
    onNone: () => "",
    onSome: (text) => <p className="text-muted-foreground text-xs">{text}</p>,
  });

const failureView = (data: Option.Option<Screen>): ReactNode =>
  Option.match(data.pipe(Option.flatMap(failure)), {
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
  return (
    <>
      {transcriptView(data)}
      {noteView(data, screen.isFetching)}
      {failureView(data)}
      <Button size="sm" variant="outline" disabled={screen.isFetching} onClick={refresh}>
        {COPY.readScreen}
      </Button>
    </>
  );
};

export { DriveScreen };
