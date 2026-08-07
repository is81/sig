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

export default router;
