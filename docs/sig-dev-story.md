# 💊 Sig — 花半天做了个用药提醒APP

> *Built with Claude Code, one morning at a time.*

---

## 起点

2026 年 8 月 4 日早上，我想做个用药提醒——妈妈总忘记吃药。

第一个版本纯前端：localStorage 存数据，浏览器 Notification API 发通知。单文件搞定，CSS 暗色模式、手机适配、动画全都塞进去了。

![开始](sig-pic/0开始.png)

但单页应用有天花板——页面关了通知就没了；只能一个人用；数据清缓存就丢。

**所以决定重写：Node.js + SQLite 后端，多用户，Web Push 通知。**

---

## 搭建

Claude Code 先生成了一份详细的实施计划，然后把整个项目拆成了后端基础设施：

![计划](sig-pic/1计划.png)

- Express 服务入口
- SQLite 数据库（sql.js，纯 WebAssembly，零编译依赖）
- JWT 注册/登录
- 提醒 CRUD API
- Web Push 调度器

![开工](sig-pic/3开工.png)

依赖装好，服务器跑起来——

![装依赖](sig-pic/4装依赖.png)

一口气写完所有路由、中间件、服务层，前端从 localStorage 改成 fetch API。pm2 启动，IIS 反向代理配好。

![准备收尾](sig-pic/5准备收尾.png)

![做好了](sig-pic/6做好了.png)

一边试用一边修修bug

![修bug](sig-pic/8发现bug.png)

---

## 第一次部署

部署到 Windows Server + IIS 的生产环境：静态文件走 IIS，`/api/*` 反向代理到 Node.js 3001 端口，pm2 保活。

![部署到服务器](sig-pic/9部署到服务器.png)

部署成功，访问 `https://is81.net/sig/`，注册、添加提醒、标记已服——全部正常。

![部署总结](sig-pic/10部署总结.png)

---

## 代码审查 & 打磨

Claude Code 做了一次 7 角度全量代码审查，找出 10 个问题——从 `MAX(id)` 竞态到 PUT 操作丢失 taken 状态，从 XSS 到 N+1 查询。逐项修完，一会会十项清零。

![代码审查](sig-pic/11代码审查.png)

![修复汇总](sig-pic/14修复汇总.png)

---

## 国际化

"用药助手"的用户不只有中文用户。加上了四国语言：

| 🇨🇳 中文 | 🇬🇧 English | 🇯🇵 日本語 | 🇪🇸 Español |

40+ 条 UI 文案，`Intl.DateTimeFormat` 自动本地化日期格式，语言偏好存 localStorage，切换即时生效。

![增加语言](sig-pic/15增加语言支持.png)

![语言加好](sig-pic/16语言加好了.png)

---

## Web Push 调试

通知是整个项目最核心的功能。部署后测试——提醒到时间了，手机没反应。

排查过程一波三折：
1. 旧订阅密钥不匹配 → 清空重建
2. ES 模块 import 在 `.env` 加载前执行 → VAPID 密钥永远空值 → 改为懒加载
3. 最终加上 `/api/push/test` 调试端点，`sent: 1` 那一刻——

手机响了。

![修 bug](sig-pic/17修bug.png)

---

## 成品

iPhone 从 Safari 添加到主屏幕，就是一个原生 App 的体验。

![添加共享](sig-pic/22添加共享.png)

![添加到主屏幕](sig-pic/23.png)

![添加信息](sig-pic/24添加信息.jpg)

![开启提醒](sig-pic/25开启提醒.png)

![登录](sig-pic/18登录.jpg)

![添加药品](sig-pic/19添加药品.jpg)

![药品列表](sig-pic/20.jpg)

![提醒消息](sig-pic/21.jpg)
---

## 最终架构

```
sig/
├── index.html              # 原生 SPA 前端
├── sw.js                   # Service Worker（后台推送）
├── manifest.json           # PWA 清单
├── locales/                # 4 国语言包 + i18n 模块
└── server/
    ├── server.js           # Express 入口 (3001)
    ├── db.js               # SQLite via sql.js
    ├── middleware/auth.js   # JWT 认证
    ├── routes/             # auth, reminders, push, stats
    ├── services/           # scheduler (cron), push (web-push)
    └── utils/validate.js   # 输入校验
```

**技术栈：** Vanilla JS · Node.js · SQLite · JWT · Web Push · pm2 · IIS ARR

---

## 开源

项目以 MIT 协议开源在 [github.com/is81/sig](https://github.com/is81/sig)。

> *Sig is a simple, caring medication reminder that lives on your phone. Set up your meds in seconds, get gentle nudges when it's time, and share it with family — each person's data stays private. No complex setup required. Just you, your health, and a little digital nudge.*
