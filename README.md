# 吃药啦 — Multi-User Medication Reminder

<p align="center">
  <a href="https://is81.net/sig/"><img src="https://img.shields.io/badge/demo-is81.net%2Fsig-2A7DE1?style=flat-square" alt="Demo"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/is81/sig?style=flat-square&color=2EBB77" alt="License MIT"></a>
  <a href="#"><img src="https://img.shields.io/badge/i18n-4%20languages-8b5cf6?style=flat-square" alt="4 languages"></a>
  <a href="#"><img src="https://img.shields.io/badge/version-2.0-2A7DE1?style=flat-square" alt="v2.0"></a>
</p>

吃药啦 (Pill Time) is a simple, caring medication reminder. Set up your meds in seconds, get gentle nudges when it's time, and share it with family — each person's data stays private.

**Try it now:** [is81.net/sig](https://is81.net/sig/)

📖 **Dev Story:** [中文](https://github.com/is81/sig/blob/master/docs/sig-dev-story.md) · [English](https://github.com/is81/sig/blob/master/docs/sig-dev-story-en.md)

> 📱 **iPhone users:** After opening in Safari, tap **Share → Add to Home Screen** to enable push notifications even when the browser is closed.

## Features

- 👥 **Multi-user** — Register / login with JWT authentication, admin role
- 💊 **Medication CRUD** — Add drug name, structured dosage (value + unit × quantity), time slots, notes
- 📂 **Medicine Groups** — Organize meds into groups with date ranges and notes
- 😕 **Miss Tracking** — Mark as not-taken with reason (forgot / sick / no meds / no longer needed / other)
- 💬 **Side Effect Feedback** — Optional symptom reporting after taking medication
- 📊 **Admin Dashboard** — User demographics and monthly feedback analytics
- 🔔 **Web Push** — System notifications even when browser is closed (iOS PWA supported)
- 🌐 **i18n** — 中文 / English / 日本語 / Español
- 📱 **PWA** — Add to home screen for native app experience
- 🗄️ **SQLite** — Zero-config database via sql.js (WebAssembly)
- 🌙 **Dark mode** — Auto-detected via `prefers-color-scheme`
- ⏰ **Daily auto-reset** — `taken` status resets at midnight
- 🛡️ **Rate limiting & security headers** — Built-in protection

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
├── logo.png                 # App logo
├── index.html               # SPA frontend
├── style.css                # Stylesheet (extracted CSS)
├── sw.js                    # Service Worker (push receiver)
├── manifest.json            # PWA manifest
├── README.md                # This file
├── TODO.md                  # Roadmap & pending issues
├── locales/
│   ├── zh-CN.json / en.json / ja.json / es.json
│   └── i18n.js              # i18n module
├── docs/                    # Dev story & screenshots
└── server/
    ├── server.js            # Express entry (port 3001)
    ├── db.js                # SQLite init & queries
    ├── .env.example         # Config template
    ├── middleware/auth.js    # JWT middleware
    ├── routes/
    │   ├── auth.js          # Register / login / change password
    │   ├── reminders.js     # CRUD + mark taken/missed
    │   ├── groups.js        # Medicine groups CRUD
    │   ├── feedback.js      # Miss reasons & side effects
    │   ├── push.js          # Push subscription & test
    │   ├── stats.js         # Public user count
    │   └── admin.js         # Admin: users + data dashboard
    ├── services/
    │   ├── scheduler.js     # node-cron: 30s check + daily reset
    │   └── push.js          # web-push sender
    └── utils/validate.js    # Input validation
```

## Quick Start

```bash
cd sig/server
cp .env.example .env         # Edit .env with your config
npm install
npm start                    # http://localhost:3001
```

Generate VAPID keys for Web Push:
```bash
npx web-push generate-vapid-keys
# Copy to VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in .env
# Also update applicationServerKey in index.html
```

## Deployment

See `CLAUDE.md` in repo root for IIS + pm2 deployment guide.

## Privacy

**Your data stays on your server.** All medication records, user accounts, and push subscription tokens are stored in your own SQLite database. No data is shared or sold.

- 🔒 Passwords hashed with bcrypt, JWT tokens expire after 7 days
- 🔐 HTTPS required in production
- 🗄️ SQLite — no cloud database, your data stays local
- 🔔 Push via standard Web Push protocol
- 📍 [is81.net/sig](https://is81.net/sig/) is the official hosted instance — feel free to use it

## License

MIT
