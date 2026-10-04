import type { SyncStatus } from "@claude-max-manager/core";
import { Context, Effect, Layer, Ref } from "effect";

type SessionShape = Readonly<{
  syncResults: Ref.Ref<ReadonlyMap<string, SyncStatus>>;
  choices: Ref.Ref<ReadonlyMap<string, readonly string[]>>;
}>;

class Session extends Context.Service<Session, SessionShape>()(
  "@claude-max-manager/desktop/main/session",
) {}

const sessionLayer = Layer.effect(
  Session,
  Effect.gen(function* makeSession() {
    const syncResults = yield* Ref.make<ReadonlyMap<string, SyncStatus>>(new Map());
    const choices = yield* Ref.make<ReadonlyMap<string, readonly string[]>>(new Map());
    return Session.of({ syncResults, choices });
  }),
);

export { Session, sessionLayer };
