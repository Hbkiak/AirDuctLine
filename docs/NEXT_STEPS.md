# Office MES Next Steps

## Priority 1: Real LINE Integration

1. Create LINE Official Account for company MES
2. Enable Messaging API
3. Create LINE Login channel and LIFF app
4. Configure:
   - `LIFF_ID`
   - `LINE_APP_URL`
   - `CHANNEL_ACCESS_TOKEN`
   - `CHANNEL_SECRET`
5. Replace pilot IDs with real LINE User IDs
6. Add backend LINE push module
7. Push messages for workflow events:
   - Sales creates design job -> production
   - Production replies design result -> sales
   - Sales creates SO -> planning
   - Planning starts WO -> production
   - Production completes -> sales/logistics

## Priority 2: Server Stability

1. Keep watchdog active for local pilot
2. Move project to a stable office server
3. Use a real Windows Service or named Cloudflare Tunnel for production
4. Schedule daily backup of:
   - `data/state.json`
   - `uploads/`

## Priority 3: System Analysis Documents

Create or maintain:

- `docs/requirements.md`
- `docs/workflow.md`
- `docs/permissions.md`
- `docs/line-integration.md`
- `docs/data-model.md`

## Priority 4: Production Readiness

- Replace JSON storage with a database when concurrent users increase
- Add real authentication/authorization for web users
- Add audit export
- Add document numbering rules
- Add attachment support in LINE pilot
- Add search/filter by customer, INQ, SO, WO

