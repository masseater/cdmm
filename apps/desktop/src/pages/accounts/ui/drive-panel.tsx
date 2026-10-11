import type { AccountView, Screen } from "@cdmm/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Option } from "effect";
import { useCallback, useId } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { managerApi, useAction } from "#/shared/api";
import { useDraftAtom, useDraftAtomChange } from "#/shared/lib/draft-atom";
import { Button } from "#/shared/ui/button";
import { OutcomeMessage } from "#/shared/ui/outcome-message";
import { Textarea } from "#/shared/ui/textarea";

const MESSAGE_ROWS = 3;
const SCREEN_REFRESH_MS = 4000;

const isRead = (screen: Screen | undefined): screen is Readonly<{ status: "read"; text: string }> =>
  screen?.status === "read";

const screenText = (screen: Screen | undefined): Option.Option<string> => {
  if (isRead(screen) && screen.text.trim().length > 0) {
    return Option.some(screen.text);
  }
  return Option.none();
};

const readError = (screen: Screen | undefined): string => {
  if (screen?.status === "failed") {
    return screen.message;
  }
  return "";
};

const readNote = (input: Readonly<{ screen: Screen | undefined; loading: boolean }>): string => {
  const { screen, loading } = input;
  if (isRead(screen)) {
    return screen.text.trim().length === 0 ? COPY.screenEmpty : "";
  }
  return loading ? COPY.reading : "";
};

const DrivePanel = ({ view }: Readonly<{ view: AccountView }>): ReactNode => {
  const { id } = view.account;
  const client = useQueryClient();
  const message = useDraftAtom({ key: `drive:${id}:message`, saved: "" });
  const edit = useDraftAtomChange(message);
  const screen = useQuery({
    queryKey: ["screen", id],
    queryFn: () => managerApi().readScreen(id),
    refetchInterval: SCREEN_REFRESH_MS,
  });
  const sendText = useCallback(
    (text: string) => managerApi().sendText({ accountId: id, text }),
    [id],
  );
  const send = useAction({ key: "send-text", run: sendText });
  const { mutate: sendMutate } = send;
  const { refetch } = screen;
  const submit = useCallback(() => {
    sendMutate(message.value, {
      onSuccess: (outcome) => {
        if (outcome.status === "done") {
          message.reset();
          void client.invalidateQueries({ queryKey: ["screen", id] });
        }
      },
    });
  }, [client, id, message, sendMutate]);
  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);
  const id0 = useId();
  const note = readNote({ screen: screen.data, loading: screen.isFetching });
  return (
    <section className="flex flex-col gap-2">
      <h3 id={`${id0}-title`} className="text-sm font-medium">
        {COPY.drive}
      </h3>
      <p id={`${id0}-hint`} className="text-muted-foreground text-xs">
        {COPY.driveHelp}
      </p>
      {screenText(screen.data).pipe(
        Option.match({
          onNone: () => "",
          onSome: (text) => (
            <pre
              role="region"
              aria-label={COPY.screen}
              className="border-input bg-muted/40 max-h-56 overflow-auto rounded-md border p-2 font-mono text-xs whitespace-pre-wrap"
            >
              {text}
            </pre>
          ),
        }),
      )}
      {note ? <p className="text-muted-foreground text-xs">{note}</p> : ""}
      {readError(screen.data) ? (
        <p role="alert" className="text-destructive text-sm">
          {readError(screen.data)}
        </p>
      ) : (
        ""
      )}
      <Textarea
        name="drive-message"
        aria-label={COPY.message}
        aria-describedby={`${id0}-hint`}
        placeholder={COPY.messagePlaceholder}
        rows={MESSAGE_ROWS}
        value={message.value}
        onChange={edit}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="default"
          disabled={send.isPending || message.value.trim().length === 0}
          onClick={submit}
        >
          {COPY.send}
        </Button>
        <Button size="sm" variant="outline" disabled={screen.isFetching} onClick={refresh}>
          {COPY.readScreen}
        </Button>
      </div>
      <OutcomeMessage outcome={Option.fromNullishOr(send.data)} />
    </section>
  );
};

export { DrivePanel };
