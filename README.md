# Office MES Prototype

Internal browser-based MES workflow prototype for sales, production, warehouse,
planning, logistics, and admin handoffs.

## Project Structure

- `server.js` - Node.js backend and static file server
- `index.html`, `app.js`, `styles.css` - main Office MES web app
- `line-mes-starter.*` - LINE/LIFF-oriented workflow prototype
- `line-mobile-preview.*` - mobile preview prototype
- `ops/` - Windows PowerShell helper scripts for running, stopping, backing up,
  and checking the local service
- `scripts/` - utility scripts
- `data/` - runtime JSON data directory
- `uploads/` - runtime uploaded document directory

Runtime data, uploaded documents, logs, generated exports, and backups are not
committed to Git.

## Run Locally

From PowerShell in the project folder:

```powershell
.\ops\start-office-mes.ps1
```

Default URL:

```text
http://localhost:8765/
```

To stop the service:

```powershell
.\ops\stop-office-mes.ps1
```

To check service status:

```powershell
.\ops\status-office-mes.ps1
```

## Backup

Back up runtime data and uploads with:

```powershell
.\ops\backup-office-mes.ps1
```

Back up the full project folder with:

```powershell
.\ops\backup-project.ps1
```
