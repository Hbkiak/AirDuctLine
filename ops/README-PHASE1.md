# Office MES Phase 1 - Internal Browser Server

เป้าหมายของ Phase 1 คือให้ระบบรันเป็น Web App กลางในองค์กร ไม่ใช่ preview ชั่วคราวบน localhost ของเครื่องเดียว

## โครงสร้างที่ใช้ตอนนี้

- `server.js` เป็น backend และ static web server
- `index.html`, `app.js`, `styles.css` เป็นหน้า Web App
- `data/state.json` เป็นฐานข้อมูลเริ่มต้นแบบไฟล์
- `uploads/` เก็บไฟล์แนบ
- `logs/` เก็บ log และ PID เมื่อ start ด้วย script
- `backups/` เก็บไฟล์สำรองข้อมูล

## วิธี start บนเครื่องกลาง

เปิด PowerShell ที่โฟลเดอร์โปรเจค แล้วรัน:

```powershell
.\ops\start-office-mes.ps1
```

ค่าเริ่มต้น:

- Port: `8765`
- Host: `0.0.0.0` เพื่อให้เครื่องอื่นในวง LAN เข้าได้
- Local URL: `http://localhost:8765/`
- LAN URL: `http://<server-ip>:8765/`

ถ้าต้องการเปลี่ยน port:

```powershell
$env:PORT="9000"; .\ops\start-office-mes.ps1
```

## วิธีดูสถานะ

```powershell
.\ops\status-office-mes.ps1
```

## วิธี stop

```powershell
.\ops\stop-office-mes.ps1
```

## วิธี backup

```powershell
.\ops\backup-office-mes.ps1
```

ควร backup อย่างน้อยวันละครั้ง โดยสำรองทั้ง `data/` และ `uploads/`

ถ้าต้องการ backup ทั้ง project รวม code, data, uploads, ops:

```powershell
.\ops\backup-project.ps1
```

## หา URL สำหรับเครื่องอื่นในวง LAN

บนเครื่องกลางให้รัน:

```powershell
.\ops\get-lan-url.ps1
```

ระบบจะแสดง URL เช่น:

```text
http://192.168.1.50:8765/
```

ให้ฝ่ายขาย/ผลิต/คลังเปิด URL นี้จาก browser ในวง network เดียวกัน

## ตั้งค่าเครื่องกลาง

1. เลือกเครื่อง PC หรือ mini server ที่เปิดไว้ตลอดเวลาทำงาน
2. ตั้ง static IP เช่น `192.168.1.50`
3. Start ระบบด้วย `.\ops\start-office-mes.ps1`
4. ให้ผู้ใช้เปิด `http://192.168.1.50:8765/`
5. ถ้า Windows Firewall บล็อก ให้ allow inbound TCP port `8765`

## เปิดระบบอัตโนมัติเมื่อ Windows login

บนเครื่องกลางให้รัน:

```powershell
.\ops\install-startup-task.ps1
```

ถ้าต้องการยกเลิก:

```powershell
.\ops\uninstall-startup-task.ps1
```

## งานถัดไป

- เพิ่ม login/user จริง
- ย้ายฐานข้อมูลจาก JSON เป็น SQLite หรือ PostgreSQL
- เพิ่ม HTTPS เพื่อเตรียมต่อ LINE LIFF
