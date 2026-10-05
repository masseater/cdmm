!macro customUnInstall
  ${ifNot} ${isUpdated}
    DeleteRegKey HKCU "Software\Classes\cdmm.Url"
    DeleteRegKey HKCU "Software\cdmm"
    DeleteRegValue HKCU "Software\RegisteredApplications" "cdmm"
  ${endIf}
!macroend
