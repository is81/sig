import { Router } from 'express';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { stmts } from '../db.js';

const router = Router();

// 所有路由需管理员
router.use(authRequired, adminRequired);

// GET /api/admin/users
router.get('/users', (_req, res) => {
  const users = stmts.admin_listUsers();
  res.json({ users });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: '无效的用户ID' });
  if (id === req.userId) return res.status(400).json({ error: '不能删除自己' });
  stmts.admin_deleteUser(id);
  res.json({ ok: true });
});

// GET /api/admin/stats
router.get('/stats', (_req, res) => {
  const stats = stmts.admin_getStats();
  res.json(stats);
});

export default router;
