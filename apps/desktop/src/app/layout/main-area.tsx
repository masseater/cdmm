import { Suspense } from "react";
import type { ReactNode } from "react";

import type { Section } from "#/app/model/section";

import { SectionPage } from "./section-page";

const MainArea = ({ section }: Readonly<{ section: Section }>): ReactNode => (
  <main className="flex flex-1 flex-col p-6">
    <Suspense>
      <SectionPage section={section} />
    </Suspense>
  </main>
);

export { MainArea };
