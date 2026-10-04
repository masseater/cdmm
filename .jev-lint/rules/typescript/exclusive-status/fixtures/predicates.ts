const ID = /^[a-z0-9-]+$/u;

const isValidId = (id: string): boolean => ID.test(id);

const isRunningIn = (commandLine: string, dir: string): boolean =>
  commandLine.includes(dir) && !commandLine.includes("--type=");

export { isRunningIn, isValidId };
