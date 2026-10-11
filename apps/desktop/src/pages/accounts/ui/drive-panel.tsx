import type { AccountView, Screen } from "@cdmm/core";
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

const screenText = (screen: Screen | undefined): Option.Option<string> => {
  if (screen?.status === "read" && screen.text.trim().length > 0) {
    return Option.some(screen.text);
  }
  return Option.none();
};

const readStatus = (screen: Screen | undefined): string => {
  if (screen?.status !== "read") {
    return "";
  }
  return screen.text.trim().length > 0 ? COPY.screenRead : COPY.screenEmpty;
};

const readError = (screen: Screen | undefined): string => {
  if (screen?.status === "failed") {
    return screen.message;
  }
  return "";
};

const DrivePanel = ({ view }: Readonly<{ view: AccountView }>): ReactNode => {
  const { id } = view.account;
  const message = useDraftAtom({ key: `drive:${id}:message`, saved: "" });
  const edit = useDraftAtomChange(message);
  const sendText = useCallback(
    (text: string) => managerApi().sendText({ accountId: id, text }),
    [id],
  );
  const readScreen = useCallback(() => managerApi().readScreen(id), [id]);
  const send = useAction({ key: "send-text", run: sendText });
  const read = useAction({ key: "read-screen", run: readScreen });
  const { mutate: sendMutate } = send;
  const { mutate: readMutate } = read;
  const submit = useCallback(() => {
    sendMutate(message.value, {
      onSuccess: (outcome) => {
        if (outcome.status === "done") {
          message.reset();
        }
      },
    });
  }, [message, sendMutate]);
  const refresh = useCallback(() => {
    readMutate();
  }, [readMutate]);
  const id0 = useId();
  return (
    <section className="flex flex-col gap-2">
      <h3 id={`${id0}-title`} className="text-sm font-medium">
        {COPY.drive}
      </h3>
      <p id={`${id0}-hint`} className="text-muted-foreground text-xs">
        {COPY.driveHelp}
      </p>
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
        <Button size="sm" variant="outline" disabled={read.isPending} onClick={refresh}>
          {COPY.readScreen}
        </Button>
      </div>
      <OutcomeMessage outcome={Option.fromNullishOr(send.data)} />
      <p aria-live="polite" className="text-muted-foreground text-xs">
        {readStatus(read.data)}
      </p>
      {readError(read.data) ? (
        <p role="alert" className="text-destructive text-sm">
          {readError(read.data)}
        </p>
      ) : (
        ""
      )}
      {screenText(read.data).pipe(
        Option.match({
          onNone: () => "",
          onSome: (text) => (
            <pre
              role="region"
              aria-label={COPY.screen}
              className="border-input bg-muted/40 max-h-48 overflow-auto rounded-md border p-2 font-mono text-xs whitespace-pre-wrap"
            >
              {text}
            </pre>
          ),
        }),
      )}
    </section>
  );
};

export { DrivePanel };
