import { useState } from "react";
import type { ReactNode } from "react";

const Dialog = (): ReactNode => {
  const [isOpen, setOpen] = useState(false);
  const [isClosing, setClosing] = useState(false);
  const [isSubmitted, setSubmitted] = useState(false);
  return (
    <div data-open={isOpen} data-closing={isClosing} data-submitted={isSubmitted}>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <button type="button" onClick={() => setClosing(true)}>
        Close
      </button>
      <button type="button" onClick={() => setSubmitted(true)}>
        Send
      </button>
    </div>
  );
};

export { Dialog };
