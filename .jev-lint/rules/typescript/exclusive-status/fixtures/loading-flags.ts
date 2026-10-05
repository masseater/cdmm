type Report = Readonly<{ rows: readonly string[] }>;

type ReportState = {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  report?: Report;
};

const initial: ReportState = { isLoading: false, isError: false };

const startLoading = (state: ReportState): ReportState => ({ ...state, isLoading: true });

const fail = (state: ReportState, message: string): ReportState => ({
  ...state,
  isError: true,
  errorMessage: message,
});

export { fail, initial, startLoading };
