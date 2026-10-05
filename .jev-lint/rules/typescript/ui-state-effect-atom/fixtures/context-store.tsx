import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

const Selection = createContext<{ id: string; select: (id: string) => void }>({
  id: "",
  select: () => {},
});

export const SelectionProvider = ({ children }: { children: ReactNode }) => {
  const [id, select] = useState("");
  return <Selection.Provider value={{ id, select }}>{children}</Selection.Provider>;
};

export const useSelection = () => useContext(Selection);
