# Office MES Project Status

อัปเดตล่าสุด: 2026-06-29

## Current State

- Backend local server ทำงานที่ port `8765`
- Data เก็บที่ `data/state.json`
- File upload เก็บที่ `uploads/`
- Main app ใช้งานได้ผ่าน browser
- LINE pilot ใช้งานได้ผ่าน `line.html`
- LINE mobile preview ใช้งานได้ผ่าน `line-mobile-preview.html`
- Watchdog มีหน้าที่ restart server ถ้า health check ล้มเหลว

## Implemented

- Sales creates inquiry/jobs
- Multiple line items with quantities
- File uploads on main web app
- Role-aware users: sales, production, warehouse, logistics, planning, admin
- Read tracking and activity log
- Dashboard status and routing display
- Production/design reply back to sales
- Stock reply back to sales
- LINE pilot session by simulated `lineUserId`
- LINE pilot sales job creation
- Mobile LINE-style preview from live backend data
- Cloudflare Tunnel script for mobile testing

## Current Pilot Users

- `kiak.` -> คุณ โชคพิสิฐ / ฝ่ายขาย
- `thana-sales` -> คุณ ธนา / ฝ่ายขาย
- `premsukhouse` -> คุณ โรง / ฝ่ายผลิต

These are pilot identifiers only. Real LINE integration should use LINE User IDs that start with `U...`.

## Important Gap

The system does not yet push real LINE notifications.

Current behavior:

- Backend records notification text in state
- User can open LINE pilot link manually

Target behavior:

- System sends push message from LINE Official Account
- Recipient taps the message
- LIFF opens the exact job
- LINE identity is automatic

