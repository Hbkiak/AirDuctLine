@echo off
setlocal

echo Adding Windows Firewall rule for Office MES on TCP port 8765...
netsh advfirewall firewall add rule name="Office MES 8765" dir=in action=allow protocol=TCP localport=8765 profile=domain,private,public

echo.
echo Current rule:
netsh advfirewall firewall show rule name="Office MES 8765"

echo.
echo If this says access denied, right-click this file and choose Run as administrator.
echo If LocalFirewallRules is controlled by GPO, ask IT/Admin to allow inbound TCP 8765 on this machine.
pause
