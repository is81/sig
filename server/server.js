import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 手动加载 .env（避免引入 dotenv 依赖）
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .forEach(line => {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    });
}

import express from 'express';
import cors from 'cors';
import { initDB, flushSync } from './db.js';
import { initScheduler, stopScheduler } from './services/scheduler.js';
import authRoutes    from './routes/auth.js';
import reminderRoutes from './routes/reminders.js';
import pushRoutes    from './routes/push.js';
import statsRoutes   from './routes/stats.js';
import adminRoutes   from './routes/admin.js';
import groupRoutes   from './routes/groups.js';

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

// ===== 安全头 =====
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '0'); // 现代浏览器已内置，显式关闭旧版
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ===== 简易速率限制（内存，单进程适用） =====
const rateLimitStore = new Map();
function rateLimit(maxRequests, windowMs, keyFn) {
  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    const entry = rateLimitStore.get(key);
    if (entry && now < entry.resetAt) {
      entry.count++;
      if (entry.count > maxRequests) {
        return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
      }
    } else {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    }
    next();
  };
}
// 清理过期条目（每分钟）
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitStore) {
    if (now >= v.resetAt) rateLimitStore.delete(k);
  }
}, 60000);

// 中间件
app.use(cors({ origin: true }));
app.use(express.json());

// 认证接口限流：每 IP 每分钟 20 次
app.use('/api/auth', rateLimit(20, 60000, req => req.ip));
app.use('/api/reminders', rateLimit(60, 60000, req => req.ip));

// 静态文件（前端）
const publicDir = path.join(__dirname, '..');
app.use(express.static(publicDir));

// API 路由
app.use('/api/auth',      authRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/groups',    groupRoutes);
app.use('/api/push',      pushRoutes);
app.use('/api/stats',     statsRoutes);
app.use('/api/admin',     adminRoutes);

// 健康检查
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// 启动：先初始化数据库
initDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`💊 吃药了服务已启动 → http://localhost:${PORT}`);
    initScheduler();
  });

  // 优雅关闭
  const shutdown = (signal) => {
    console.log(`\n[${signal}] 正在关闭...`);
    stopScheduler();
    flushSync();
    server.close(() => {
      console.log('服务已停止');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
});
