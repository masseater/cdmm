import { useReducer } from "react";

type Step = { status: "intro" } | { status: "details" } | { status: "done" };

const next = (step: Step): Step => {
  switch (step.status) {
    case "intro":
      return { status: "details" };
    default:
      return { status: "done" };
  }
};

export const Wizard = () => {
  const [step, advance] = useReducer(next, { status: "intro" });
  return <button onClick={advance}>{step.status}</button>;
};
