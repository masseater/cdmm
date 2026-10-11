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

export { READ_BODY, SEND_BODY };
