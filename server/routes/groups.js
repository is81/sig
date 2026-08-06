import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { stmts } from '../db.js';

const router = Router();
router.use(authRequired);

// GET /api/groups
router.get('/', (req, res) => {
  const groups = stmts.group_list(req.userId);
  res.json({
    groups: groups.map(g => ({
      id: g.id,
      name: g.name,
      startDate: g.start_date,
      endDate: g.end_date,
      note: g.note,
      sortOrder: g.sort_order,
      medCount: g.med_count,
    })),
  });
});

// POST /api/groups
router.post('/', (req, res) => {
  const { name, startDate, endDate, note } = req.body || {};
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: '分组名称不能为空' });
  }
  if (name.trim().length > 30) {
    return res.status(400).json({ error: '分组名称最多 30 个字符' });
  }
  const id = stmts.group_create(req.userId, name.trim(), startDate || '', endDate || '', (note || '').slice(0, 60));
  res.status(201).json({ id });
});

// PUT /api/groups/:id
router.put('/:id', (req, res) => {
  const group = stmts.group_findById(req.params.id);
  if (!group || group.user_id !== req.userId) {
    return res.status(404).json({ error: '分组不存在' });
  }
  const { name, startDate, endDate, note } = req.body || {};
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: '分组名称不能为空' });
  }
  stmts.group_update(group.id, name.trim(), startDate || '', endDate || '', (note || '').slice(0, 60));
  res.json({ ok: true });
});

// DELETE /api/groups/:id
router.delete('/:id', (req, res) => {
  const group = stmts.group_findById(req.params.id);
  if (!group || group.user_id !== req.userId) {
    return res.status(404).json({ error: '分组不存在' });
  }
  stmts.group_delete(group.id);
  res.json({ ok: true });
});

export default router;
