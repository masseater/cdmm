type Report = Readonly<{ rows: readonly string[] }>;

type ReportState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "failed"; message: string }>
  | Readonly<{ status: "loaded"; report: Report }>;

const initial: ReportState = { status: "idle" };

const fail = (message: string): ReportState => ({ status: "failed", message });

export type { ReportState };
export { fail, initial };
