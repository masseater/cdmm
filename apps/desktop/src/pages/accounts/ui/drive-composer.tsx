import { useQueryClient } from "@tanstack/react-query";
import { Effect, Option, String as Str } from "effect";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { screenQuery } from "#/pages/accounts/api/queries";
import { COPY } from "#/pages/accounts/config/copy";
import { managerApi, useAction } from "#/shared/api";
import { useDraftAtom, useDraftAtomChange } from "#/shared/lib/draft-atom";
import { Button } from "#/shared/ui/button";
import { OutcomeMessage } from "#/shared/ui/outcome-message";
import { Textarea } from "#/shared/ui/textarea";

const MESSAGE_ROWS = 3;

const DriveComposer = ({
  accountId,
  hintId,
}: Readonly<{ accountId: string; hintId: string }>): ReactNode => {
  const client = useQueryClient();
  const message = useDraftAtom({ key: `drive:${accountId}:message`, saved: "" });
  const edit = useDraftAtomChange(message);
  const sendText = useCallback(
    (text: string) => managerApi().sendText({ accountId, text }),
    [accountId],
  );
  const send = useAction({ key: "send-text", run: sendText });
  const { mutate: sendMutate } = send;
  const submit = useCallback(() => {
    sendMutate(message.value, {
      onSuccess: (outcome) => {
        if (outcome.status === "done") {
          message.reset();
          Effect.runFork(
            Effect.promise(() =>
              client.invalidateQueries({ queryKey: screenQuery(accountId).queryKey }),
            ),
          );
        }
      },
    });
  }, [accountId, client, message, sendMutate]);
  return (
    <>
      <Textarea
        name="drive-message"
        aria-label={COPY.message}
        aria-describedby={hintId}
        placeholder={COPY.messagePlaceholder}
        rows={MESSAGE_ROWS}
        value={message.value}
        onChange={edit}
      />
      <Button
        size="sm"
        variant="default"
        disabled={send.isPending || Str.isEmpty(message.value.trim())}
        onClick={submit}
      >
        {COPY.send}
      </Button>
      <OutcomeMessage outcome={Option.fromNullishOr(send.data)} />
    </>
  );
};

export { DriveComposer };
