import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { stmts } from '../db.js';

const router = Router();
router.use(authRequired);

// POST /api/feedback
router.post('/', (req, res) => {
  const { reminderId, type, value } = req.body || {};
  if (!reminderId || !type || !value) {
    return res.status(400).json({ error: '缺少参数' });
  }
  if (!['miss_reason', 'side_effect', 'symptom'].includes(type)) {
    return res.status(400).json({ error: '无效的反馈类型' });
  }
  stmts.feedback_insert(req.userId, reminderId, type, String(value).slice(0, 200));
  res.status(201).json({ ok: true });
});

// DELETE /api/feedback/:reminderId — 删除该提醒的漏服原因（撤销没吃时调用）
router.delete('/:reminderId', (req, res) => {
  stmts.feedback_deleteByReminder(req.userId, req.params.reminderId, 'miss_reason');
  res.json({ ok: true });
});

export default router;
