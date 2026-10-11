import { DESKTOP_CSHARP, NO_DESKTOP_EXIT } from "./powershell.ts";

const DRIVE_TIMEOUT_MS = "40000";

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

export { READ_SCRIPT, SEND_SCRIPT };
