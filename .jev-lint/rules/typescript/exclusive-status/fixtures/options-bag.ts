type SpawnOptions = Readonly<{
  detached?: boolean;
  windowsHide?: boolean;
  extendEnv?: boolean;
  env?: Readonly<Record<string, string>>;
}>;

const background: SpawnOptions = { detached: true, windowsHide: true };

const withEnv = (env: Readonly<Record<string, string>>): SpawnOptions => ({
  extendEnv: true,
  env,
});

export type { SpawnOptions };
export { background, withEnv };
