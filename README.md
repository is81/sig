# 💊 Sig — Multi-User Medication Reminder

A lightweight, multi-language medication reminder web app with Web Push notifications. Built with vanilla JS frontend + Node.js + SQLite backend.

**Live demo:** [is81.net/sig](https://is81.net/sig/)

## Features

- 👥 **Multi-user** — Register / login with JWT authentication
- 💊 **Medication CRUD** — Add drug name, dosage, time slots, notes
- 🔔 **Web Push** — Receive system notifications even when the browser is closed (iOS PWA supported)
- 🌐 **i18n** — 中文 / English / 日本語 / Español
- 📱 **PWA** — Add to home screen for native app experience
- 🗄️ **SQLite** — Zero-config database via sql.js (WebAssembly)
- 🌙 **Dark mode** — Auto-detected via `prefers-color-scheme`
- ⏰ **Daily auto-reset** — `taken` status resets at midnight

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (SPA, no framework) |
| Backend | Node.js + Express (ESM) |
| Database | SQLite via sql.js (WebAssembly, no native deps) |
| Auth | bcryptjs + jsonwebtoken (JWT) |
| Push | Web Push API + Service Worker + web-push (VAPID) |
| Scheduling | node-cron |
| Process | pm2 |

## Project Structure

```
sig/
├── index.html              # SPA frontend
├── sw.js                   # Service Worker (push receiver)
├── manifest.json           # PWA manifest
├── locales/
│   ├── zh-CN.json / en.json / ja.json / es.json
│   └── i18n.js             # i18n module
└── server/
    ├── server.js           # Express entry (port 3001)
    ├── db.js               # SQLite init & queries
    ├── .env.example        # Config template
    ├── middleware/auth.js   # JWT middleware
    ├── routes/
    │   ├── auth.js         # Register / login
    │   ├── reminders.js    # CRUD + toggle
    │   ├── push.js         # Push subscription & test
    │   └── stats.js        # Public stats
    ├── services/
    │   ├── scheduler.js    # node-cron: 30s check + daily reset
    │   └── push.js         # web-push sender
    └── utils/validate.js   # Input validation
```

## Quick Start

```bash
cd sig/server
cp .env.example .env        # Edit .env with your config
npm install
npm start                   # http://localhost:3001
```

Generate VAPID keys for Web Push:
```bash
npx web-push generate-vapid-keys
# Copy the output to VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in .env
# Also update the public key in index.html (search for applicationServerKey)
```

## Deployment

See `CLAUDE.md` in the repo root for full IIS + pm2 deployment guide.

## License

MIT
