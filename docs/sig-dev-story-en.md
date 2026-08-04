# 💊 Sig — Building a Medication Reminder in Half a Day

> *Built with Claude Code, one morning at a time.*

---

## The Spark

August 4, 2026. My mom keeps forgetting to take her pills. I built a single-file medication reminder. Pure frontend: localStorage, browser Notification API, dark mode, mobile-first. Done in one file.

![Plan](sig-pic/1%E8%AE%A1%E5%88%92.png)

But a single-page app has limits — notifications die when the tab closes, only one person can use it, and clearing the browser cache wipes all data.

**Time for a rewrite: Node.js + SQLite backend, multi-user, Web Push.**

---

## Building It

Claude Code kicked out a detailed plan, then built the full backend:

- Express server skeleton
- SQLite via sql.js (WebAssembly, zero native compilation)
- JWT auth with bcrypt
- Full CRUD API for reminders
- Web Push scheduler with node-cron

![Building](sig-pic/3%E5%BC%80%E5%B7%A5.png)

Dependencies installed, server running:

![Dependencies](sig-pic/4%E8%A3%85%E4%BE%9D%E8%B5%96.png)

All routes, middleware, services, and frontend refactored from localStorage to fetch API in one pass. pm2 for process management, IIS ARR for reverse proxy.

![Almost done](sig-pic/5%E5%87%86%E5%A4%87%E6%94%B6%E5%B0%BE.png)

---

## First Deployment

Deployed to Windows Server + IIS: static files served by IIS, `/api/*` reverse-proxied to Node.js on port 3001, pm2 keeping it alive.

![Deploy](sig-pic/9%E9%83%A8%E7%BD%B2%E5%88%B0%E6%9C%8D%E5%8A%A1%E5%99%A8.png)

`https://is81.net/sig/` was live — register, add reminders, mark as taken. Everything worked.

![Deploy summary](sig-pic/10%E9%83%A8%E7%BD%B2%E6%80%BB%E7%BB%93.png)

---

## Code Review & Polish

Claude Code ran a 7-angle code review, surfaced 10 issues — `MAX(id)` race conditions, PUT losing taken status, XSS vectors, N+1 queries. Fixed them all in no time.

![Code review](sig-pic/11%E4%BB%A3%E7%A0%81%E5%AE%A1%E6%9F%A5.png)

![Fixes](sig-pic/14%E4%BF%AE%E5%A4%8D%E6%B1%87%E6%80%BB.png)

---

## Internationalization

Medication reminders aren't just for Chinese speakers. Added 4 languages:

| 🇨🇳 Chinese | 🇬🇧 English | 🇯🇵 Japanese | 🇪🇸 Spanish |

40+ UI strings per locale, `Intl.DateTimeFormat` for automatic date localization, language preference saved to localStorage, instant switching.

![i18n](sig-pic/15%E5%A2%9E%E5%8A%A0%E8%AF%AD%E8%A8%80%E6%94%AF%E6%8C%81.png)

![i18n done](sig-pic/16%E8%AF%AD%E8%A8%80%E5%8A%A0%E5%A5%BD%E4%BA%86.png)

---

## The Web Push Debugging Saga

Push notifications are the whole point of the app. Tested after deployment — reminder time came, phone stayed silent.

The debugging trail:
1. Stale subscriptions with mismatched VAPID keys → cleared and rebuilt
2. ES module imports executing before `.env` loads → VAPID private key was always empty → switched to lazy loading
3. Added `/api/push/test` debug endpoint. The moment `sent: 1` appeared—

The phone buzzed.

![Bug fix](sig-pic/17%E4%BF%AEbug.png)

---

## The Result

Add to Home Screen on iPhone, and it feels like a native app.

![Login](sig-pic/18%E7%99%BB%E5%BD%95.jpg)

![Add meds](sig-pic/19%E6%B7%BB%E5%8A%A0%E8%8D%AF%E5%93%81.jpg)

![Add info](sig-pic/24%E6%B7%BB%E5%8A%A0%E4%BF%A1%E6%81%AF.jpg)

![Add to Home Screen](sig-pic/22%E6%B7%BB%E5%8A%A0%E5%85%B1%E4%BA%AB.png)

![Enable notifications](sig-pic/25%E5%BC%80%E5%90%AF%E6%8F%90%E9%86%92.png)

---

## Architecture

```
sig/
├── index.html              # Vanilla SPA frontend
├── sw.js                   # Service Worker (background push)
├── manifest.json           # PWA manifest
├── locales/                # 4 language packs + i18n module
└── server/
    ├── server.js           # Express entry (port 3001)
    ├── db.js               # SQLite via sql.js
    ├── middleware/auth.js   # JWT middleware
    ├── routes/             # auth, reminders, push, stats
    ├── services/           # scheduler (cron), push (web-push)
    └── utils/validate.js   # Input validation
```

**Stack:** Vanilla JS · Node.js · SQLite · JWT · Web Push · pm2 · IIS ARR

---

## Open Source

Released under MIT at [github.com/is81/sig](https://github.com/is81/sig).

> *Sig is a simple, caring medication reminder that lives on your phone. Set up your meds in seconds, get gentle nudges when it's time, and share it with family — each person's data stays private. No complex setup required. Just you, your health, and a little digital nudge.*
