const NO_DIR_EXIT = 2;

const STOP_SCRIPT = [
  "$dir = $env:CMM_USER_DATA_DIR",
  `if (-not $dir) { exit ${String(NO_DIR_EXIT)} }`,
  [
    "Get-CimInstance Win32_Process -Filter \"Name='claude.exe'\" |",
    "Where-Object { $_.CommandLine -and $_.CommandLine.Contains($dir) -and -not $_.CommandLine.Contains('--type=') } |",
    "ForEach-Object { Stop-Process -Id $_.ProcessId -Force }",
  ].join(" "),
].join("; ");

export { NO_DIR_EXIT, STOP_SCRIPT };
