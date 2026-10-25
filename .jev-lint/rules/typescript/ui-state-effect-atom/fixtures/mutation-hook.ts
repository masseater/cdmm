import { useMutation } from "@tanstack/react-query";

export const useSaveAccount = (save: (name: string) => Promise<{ status: "saved" }>) =>
  useMutation({ mutationKey: ["save-account"], mutationFn: save });
