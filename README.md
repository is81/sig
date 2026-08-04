# 💊 Sig — Multi-User Medication Reminder

<p align="center">
  <a href="https://github.com/is81/sig/stargazers"><img src="https://img.shields.io/github/stars/is81/sig?style=flat-square&color=2A7DE1" alt="GitHub stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/is81/sig?style=flat-square&color=2EBB77" alt="License MIT"></a>
  <a href="#"><img src="https://img.shields.io/badge/PRs-welcome-2A7DE1?style=flat-square" alt="PRs Welcome"></a>
  <a href="#"><img src="https://img.shields.io/badge/i18n-4%20languages-8b5cf6?style=flat-square" alt="4 languages"></a>
</p>

Sig is a simple, caring medication reminder that lives on your phone. Set up your meds in seconds, get gentle nudges when it's time, and share it with family — each person's data stays private. No complex setup required. Just you, your health, and a little digital nudge.

**Live demo:** [is81.net/sig](https://is81.net/sig/)

📖 **Dev Story:** [中文](https://github.com/is81/sig/blob/master/docs/sig-dev-story.md) · [English](https://github.com/is81/sig/blob/master/docs/sig-dev-story-en.md)

> 📱 **iPhone users:** After opening in Safari, tap **Share → Add to Home Screen** to enable push notifications even when the browser is closed.

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

## Privacy

**Your data stays on your server.** All medication records, user accounts, and push subscription tokens are stored in your own SQLite database. No data is shared with the developer or any third party. If you use the hosted demo at is81.net/sig, data resides on that server only.

- 🔒 Passwords are hashed with bcrypt
- 🗄️ All data stored locally in SQLite — no cloud, no analytics, no tracking
- 🔔 Push notifications are sent via standard Web Push protocol (your browser vendor may route them through their servers)
- 📍 The live demo at [is81.net/sig](https://is81.net/sig/) is a personal instance — data is not shared or sold

## License

MIT
