import { Router } from 'express';
import { stmts } from '../db.js';

const router = Router();

// GET /api/stats — 公开接口，返回注册用户数
router.get('/', (_req, res) => {
  const count = stmts.user_count();
  res.json({ userCount: count });
});

export default router;
