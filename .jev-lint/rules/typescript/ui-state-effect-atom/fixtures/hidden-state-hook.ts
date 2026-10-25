import { useCallback, useState } from "react";

export const useField = (saved: string) => {
  const [edited, setEdited] = useState<string | undefined>(undefined);
  const reset = useCallback(() => setEdited(undefined), []);
  return { value: edited ?? saved, change: setEdited, reset };
};
