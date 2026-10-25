import { useState } from "react";

export const RenameForm = ({ onSave }: { onSave: (name: string) => void }) => {
  const [name, setName] = useState("");
  return (
    <form onSubmit={() => onSave(name)}>
      <input value={name} onChange={(event) => setName(event.target.value)} />
    </form>
  );
};
