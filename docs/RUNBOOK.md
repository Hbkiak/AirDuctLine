# Office MES Runbook

คู่มือนี้ใช้เพื่อให้ทีมกลับมาทำงานต่อได้เร็ว แม้บทสนทนาหรือ preview จะสะดุด

## URLs

- Main app: `http://127.0.0.1:8765/`
- LINE pilot: `http://127.0.0.1:8765/line.html`
- LINE mobile preview: `http://127.0.0.1:8765/line-mobile-preview.html`
- Health check: `http://127.0.0.1:8765/api/health`

## Daily Check

เปิด PowerShell ใน `C:\Codex Testing` แล้วรัน:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\ops\status-office-mes.ps1
```

ถ้า health ไม่ตอบ ให้รัน:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\ops\start-office-mes.ps1
```

## Keepalive

ระบบมี watchdog script:

```text
ops/watch-office-mes.ps1
```

และ startup command:

```text
C:\Users\chokepisit\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Office MES Watchdog.cmd
```

หน้าที่ของ watchdog:

- ตรวจ `http://127.0.0.1:8765/api/health`
- ถ้า server หยุด จะเรียก `ops/start-office-mes.ps1`
- เขียน log ที่ `logs/office-mes-watchdog.log`

## Temporary Mobile LINE Testing

เปิด tunnel:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\ops\start-cloudflare-tunnel.ps1 -CloudflaredPath .\ops\cloudflared.exe -Port 8765
```

ดู URL ใน:

```text
logs/cloudflared-tunnel.err.log
```

ตัวอย่างลิงก์ทดสอบ:

```text
https://<trycloudflare-url>/line.html?lineUserId=kiak.
https://<trycloudflare-url>/line.html?lineUserId=premsukhouse
```

หมายเหตุ: `trycloudflare` เป็น URL ชั่วคราว ปิด tunnel หรือ restart เครื่องแล้วอาจเปลี่ยน

## GitHub Safety

ก่อน push:

```powershell
git status --short --ignored
```

ควร push เฉพาะ code/docs เช่น:

- `server.js`
- `app.js`
- `index.html`
- `styles.css`
- `line*.html/css/js`
- `ops/*.ps1`
- `docs/*.md`

ห้าม push:

- `.env.line`
- `data/state.json`
- `uploads/`
- `logs/`
- `backups/`
- `exports/`

