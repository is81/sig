# 💊 Sig — 花半天做了个用药提醒APP

> *Built with Claude Code, one afternoon at a time.*

---

## 起点

2026 年 8 月 4 日早上，我想做个用药提醒——妈妈总忘记吃药。

第一个版本就是 `sig/index.html`，纯前端：localStorage 存数据，浏览器 Notification API 发通知。单文件搞定，CSS 暗色模式、手机适配、动画全都塞进去了。

【图：开始】

但单页应用有天花板——页面关了通知就没了；只能一个人用；数据清缓存就丢。

**所以决定重写：Node.js + SQLite 后端，多用户，Web Push 通知。**

---

## 搭建

Claude Code 先生成了一份详细的实施计划，然后把整个项目拆成了后端基础设施：

【图：计划】

- Express 服务入口
- SQLite 数据库（sql.js，纯 WebAssembly，零编译依赖）
- JWT 注册/登录
- 提醒 CRUD API
- Web Push 调度器

【图：开工】

依赖装好，服务器跑起来——

【图：装依赖】

一口气写完所有路由、中间件、服务层，前端从 localStorage 改成 fetch API。pm2 启动，IIS 反向代理配好。

【图：准备收尾】

【图：做好了】

一边试用一边修修 bug

【图：发现bug】

---

## 第一次部署

部署到 Windows Server + IIS 的生产环境：静态文件走 IIS，`/api/*` 反向代理到 Node.js 3001 端口，pm2 保活。

【图：部署到服务器】

部署成功，访问 `https://is81.net/sig/`，注册、添加提醒、标记已服——全部正常。

【图：部署总结】

---

## 代码审查 & 打磨

Claude Code 做了一次 7 角度全量代码审查，找出 10 个问题——从 `MAX(id)` 竞态到 PUT 操作丢失 taken 状态，从 XSS 到 N+1 查询。逐项修完，一个下午十项清零。

【图：代码审查】

【图：修复汇总】

---

## 国际化

"用药助手"的用户不只有中文用户。加上了四国语言： 🇨🇳 中文 · 🇬🇧 English · 🇯🇵 日本語 · 🇪🇸 Español

40+ 条 UI 文案，`Intl.DateTimeFormat` 自动本地化日期格式，语言偏好存 localStorage，切换即时生效。

【图：增加语言】

【图：语言加好】

---

## Web Push 调试

通知是整个项目最核心的功能。部署后测试——提醒到时间了，手机没反应。

排查过程一波三折：

1. 旧订阅密钥不匹配 → 清空重建
2. ES 模块 import 在 `.env` 加载前执行 → VAPID 密钥永远空值 → 改为懒加载
3. 最终加上 `/api/push/test` 调试端点，`sent: 1` 那一刻——

手机响了。

【图：修bug】

---

## 成品

iPhone 从 Safari 添加到主屏幕，就是一个原生 App 的体验。

【图：添加共享】

【图：添加到主屏幕】

【图：添加信息】

【图：开启提醒】

【图：登录】

【图：添加药品】

【图：药品列表】

【图：提醒消息】

---

## 开源

项目以 MIT 协议开源在 [github.com/is81/sig](https://github.com/is81/sig)。

> *Sig is a simple, caring medication reminder that lives on your phone. Set up your meds in seconds, get gentle nudges when it's time, and share it with family — each person's data stays private. No complex setup required. Just you, your health, and a little digital nudge.*
