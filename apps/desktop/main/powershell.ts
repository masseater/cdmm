const NO_DIR_EXIT = 2;
const NO_DESKTOP_EXIT = 3;
const EXIT_WAIT_SECONDS = 15;
const DRIVE_TIMEOUT_MS = "40000";

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

const DESKTOP_CSHARP = String.raw`
using System;
using System.Runtime.InteropServices;
public static class CdmmDesktop {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  struct StartupInfo { public int cb; public string reserved0; public string desktop; public string title; public int x, y, xSize, ySize, xCount, yCount, fill, flags; public short show, reserved2; public IntPtr reserved3, stdInput, stdOutput, stdError; }
  [StructLayout(LayoutKind.Sequential)] struct ProcessInfo { public IntPtr process, thread; public int processId, threadId; }
  [DllImport("user32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern IntPtr CreateDesktop(string name, IntPtr device, IntPtr mode, int flags, uint access, IntPtr security);
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern bool CreateProcess(string app, string cmd, IntPtr processAttrs, IntPtr threadAttrs, bool inherit, uint flags, IntPtr env, string cwd, ref StartupInfo startup, out ProcessInfo info);
  [DllImport("kernel32.dll", SetLastError=true)] static extern uint WaitForSingleObject(IntPtr handle, uint ms);
  [DllImport("user32.dll", SetLastError=true)] static extern uint WaitForInputIdle(IntPtr handle, uint ms);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool CloseHandle(IntPtr handle);
  static ProcessInfo Spawn(string desktop, string app, string cmd) {
    IntPtr station = CreateDesktop(desktop, IntPtr.Zero, IntPtr.Zero, 0, 0x10000000, IntPtr.Zero);
    if (station == IntPtr.Zero) throw new Exception("CreateDesktop failed: " + Marshal.GetLastWin32Error());
    StartupInfo startup = new StartupInfo();
    startup.cb = Marshal.SizeOf(typeof(StartupInfo));
    startup.desktop = "WinSta0\\" + desktop;
    ProcessInfo info;
    if (!CreateProcess(app, cmd, IntPtr.Zero, IntPtr.Zero, false, 0, IntPtr.Zero, null, ref startup, out info))
      throw new Exception("CreateProcess failed: " + Marshal.GetLastWin32Error());
    return info;
  }
  public static void Launch(string desktop, string app, string cmd) {
    ProcessInfo info = Spawn(desktop, app, cmd);
    WaitForInputIdle(info.process, 20000);
    CloseHandle(info.thread);
    CloseHandle(info.process);
  }
  public static void Run(string desktop, string app, string cmd, uint timeoutMs) {
    ProcessInfo info = Spawn(desktop, app, cmd);
    CloseHandle(info.thread);
    WaitForSingleObject(info.process, timeoutMs);
    CloseHandle(info.process);
  }
}
`;

const HIDDEN_LAUNCH_SCRIPT = `
$ErrorActionPreference = 'Stop'
$desk = $env:CMM_DESKTOP_NAME
if (-not $desk) { exit ${String(NO_DESKTOP_EXIT)} }
$app = $env:CMM_LAUNCH_APP
$dir = $env:CMM_USER_DATA_DIR
if (-not $app -or -not $dir) { exit ${String(NO_DIR_EXIT)} }
$link = $env:CMM_LINK
Add-Type @"${DESKTOP_CSHARP}"@
$cmd = '"' + $app + '" --user-data-dir="' + $dir + '" --force-renderer-accessibility'
if ($link) { $cmd = $cmd + ' "' + $link + '"' }
[CdmmDesktop]::Launch($desk, $app, $cmd)
`;

const READ_BODY = String.raw`
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
$root = [Windows.Automation.AutomationElement]::RootElement
$all = [Windows.Automation.Condition]::TrueCondition
$scope = [Windows.Automation.TreeScope]::Descendants
$walker = [Windows.Automation.TreeWalker]::RawViewWalker
$child = $walker.GetFirstChild($root)
$window = $null
while ($child) { if ($child.Current.Name -eq 'Claude') { $window = $child; break }; $child = $walker.GetNextSibling($child) }
if (-not $window) { Set-Content -Path $env:CMM_OUT -Value '' -Encoding UTF8; exit }
$texts = @($window.FindAll($scope, $all) | ForEach-Object { $_.Current.Name } | Where-Object { $_ -and $_.Trim() })
Set-Content -Path $env:CMM_OUT -Value ($texts -join [Environment]::NewLine) -Encoding UTF8
`;

const SEND_BODY = String.raw`
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes,System.Windows.Forms
$root = [Windows.Automation.AutomationElement]::RootElement
$all = [Windows.Automation.Condition]::TrueCondition
$scope = [Windows.Automation.TreeScope]::Descendants
$walker = [Windows.Automation.TreeWalker]::RawViewWalker
$child = $walker.GetFirstChild($root)
$window = $null
while ($child) { if ($child.Current.Name -eq 'Claude') { $window = $child; break }; $child = $walker.GetNextSibling($child) }
if (-not $window) { Set-Content -Path $env:CMM_OUT -Value 'NO_WINDOW' -Encoding UTF8; exit }
$input = $window.FindAll($scope, $all) | Where-Object { $_.Current.IsKeyboardFocusable -and ($_.Current.ControlType -eq [Windows.Automation.ControlType]::Edit -or $_.Current.ControlType -eq [Windows.Automation.ControlType]::Document) } | Select-Object -First 1
if (-not $input) { Set-Content -Path $env:CMM_OUT -Value 'NO_INPUT' -Encoding UTF8; exit }
$input.SetFocus()
$pattern = $null
if ($input.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern, [ref]$pattern)) { $pattern.SetValue($env:CMM_TEXT) }
else { [Windows.Forms.SendKeys]::SendWait($env:CMM_TEXT) }
Start-Sleep -Milliseconds 500
[Windows.Forms.SendKeys]::SendWait('{ENTER}')
Set-Content -Path $env:CMM_OUT -Value 'SENT' -Encoding UTF8
`;

const driveScript = (body: string): string => `
$ErrorActionPreference = 'Stop'
$desk = $env:CMM_DESKTOP_NAME
if (-not $desk) { exit ${String(NO_DESKTOP_EXIT)} }
$self = (Get-Process -Id $PID).Path
$out = Join-Path $env:TEMP ('cdmm-' + [guid]::NewGuid().ToString('N') + '.txt')
$bodyFile = [System.IO.Path]::ChangeExtension($out, '.ps1')
Add-Type @"${DESKTOP_CSHARP}"@
Set-Content -Path $bodyFile -Value @'${body}'@ -Encoding UTF8
$env:CMM_OUT = $out
$cmd = '"' + $self + '" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + $bodyFile + '"'
[CdmmDesktop]::Run($desk, $self, $cmd, ${DRIVE_TIMEOUT_MS})
if (Test-Path $out) { Get-Content -Path $out -Raw -Encoding UTF8 }
Remove-Item $bodyFile, $out -ErrorAction SilentlyContinue
`;

const READ_SCRIPT = driveScript(READ_BODY);
const SEND_SCRIPT = driveScript(SEND_BODY);

export {
  HIDDEN_LAUNCH_SCRIPT,
  NO_DESKTOP_EXIT,
  NO_DIR_EXIT,
  READ_SCRIPT,
  SEND_SCRIPT,
  STOP_SCRIPT,
};
