type Upload = {
  progress?: number;
  url?: string;
  error?: string;
  cancelled?: boolean;
};

const finish = (upload: Upload, url: string): Upload => ({ ...upload, url });

const cancel = (upload: Upload): Upload => ({ ...upload, cancelled: true });

export type { Upload };
export { cancel, finish };
