@echo off
set all_port= %1
echo all port: %all_port%
set PATH=%PATH%;%SystemRoot%\system32

:GOON
for /f "tokens=1,*" %%i in (%all_port%) do (
    call:disableFirewallPort %%i
    set all_port="%%j"
    goto GOON
)
exit /b 0

:disableFirewallPort
set port= %1
echo delete port: %port%
netsh advfirewall firewall delete rule name=all protocol=tcp localport=%port%
goto:eof
