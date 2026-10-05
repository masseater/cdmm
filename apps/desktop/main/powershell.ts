const NO_DIR_EXIT = 2;
const EXIT_WAIT_SECONDS = 15;

const STOP_SCRIPT = [
  "$dir = $env:CMM_USER_DATA_DIR",
  `if (-not $dir) { exit ${String(NO_DIR_EXIT)} }`,
  [
    "$procs = @(Get-CimInstance Win32_Process -Filter \"Name='claude.exe'\" |",
    "Where-Object { $_.CommandLine -and $_.CommandLine.Contains($dir) })",
  ].join(" "),
  "$procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }",
  `$procs | ForEach-Object { Wait-Process -Id $_.ProcessId -Timeout ${String(EXIT_WAIT_SECONDS)} -ErrorAction SilentlyContinue }`,
].join("; ");

export { NO_DIR_EXIT, STOP_SCRIPT };
