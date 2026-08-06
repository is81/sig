import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { stmts } from '../db.js';
import { sendPush } from '../services/push.js';

const router = Router();

// GET /api/push/status — 检查当前用户的推送订阅状态
router.get('/status', authRequired, (req, res) => {
  const subs = stmts.push_findByUser(req.userId);
  res.json({
    subscribed: subs.length > 0,
    count: subs.length,
    vapidConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
  });
});

// POST /api/push/test — 发送测试推送
router.post('/test', authRequired, async (req, res) => {
  const subs = stmts.push_findByUser(req.userId);
  if (subs.length === 0) {
    return res.status(400).json({ error: '未找到推送订阅——请从主屏打开并允许通知' });
  }
  let sent = 0, expired = 0;
  for (const sub of subs) {
    const result = await sendPush(sub, {
      title: '💊 吃药了',
      body: '这是一条测试推送。如果你能看到这条消息，说明推送功能正常！',
      reminderId: '0',
      timeId: '0',
    });
    if (result === true) sent++;
    else if (result && result.expired) { stmts.push_delete(sub.endpoint); expired++; }
    else { console.error('[Push Test] 发送失败:', sub.endpoint.substring(0,60), result); }
  }
  res.json({ sent, expired, failed: subs.length - sent - expired, total: subs.length,
    vapidPublic: (process.env.VAPID_PUBLIC_KEY || '').substring(0,20) + '...' });
});

// POST /api/push/subscribe
router.post('/subscribe', authRequired, (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ error: '缺少 subscription 参数' });
  }
  stmts.push_upsert(req.userId, endpoint, keys.p256dh, keys.auth);
  res.json({ ok: true });
});

// DELETE /api/push/unsubscribe
router.delete('/unsubscribe', authRequired, (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: '缺少 endpoint' });
  stmts.push_delete(endpoint);
  res.json({ ok: true });
});

// DELETE /api/push/clear — 清除当前用户全部订阅
router.delete('/clear', authRequired, (req, res) => {
  const subs = stmts.push_findByUser(req.userId);
  for (const sub of subs) {
    stmts.push_delete(sub.endpoint);
  }
  res.json({ cleared: subs.length });
});

export default router;
