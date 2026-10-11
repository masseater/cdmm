import type { Screen } from "@cdmm/core";
import { Option } from "effect";

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

export { isRead, readError, screenText };
