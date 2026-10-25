import { Suspense } from "react";
import type { ReactNode, RefCallback } from "react";

import type { Section } from "#/app/model/section";

import { SectionPage } from "./section-page";

const focusOnMount: RefCallback<HTMLElement> = (node) => {
  if (node !== null) {
    node.focus({ preventScroll: true });
  }
};

const MainArea = ({ section }: Readonly<{ section: Section }>): ReactNode => (
  <main
    key={section}
    ref={focusOnMount}
    tabIndex={-1}
    className="flex flex-1 flex-col p-6 outline-none"
  >
    <Suspense>
      <SectionPage section={section} />
    </Suspense>
  </main>
);

export { MainArea };
