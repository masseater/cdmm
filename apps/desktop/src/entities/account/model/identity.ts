import type { AccountView } from "@claude-max-manager/core";
import { String as Str } from "effect";

const isSignedIn = (view: AccountView): boolean => Str.isNonEmpty(view.identity.desktopAccountUuid);

const whoOf = (view: AccountView): string => {
  if (Str.isNonEmpty(view.identity.codeEmail)) {
    return view.identity.codeEmail;
  }
  return view.identity.desktopAccountUuid;
};

export { isSignedIn, whoOf };
