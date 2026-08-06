import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { validateReminder } from '../utils/validate.js';
import { stmts } from '../db.js';

const router = Router();
router.use(authRequired);

/** 格式化 reminder + times 为 API 响应 */
function formatReminder(reminder, timeRows) {
  return {
    id: reminder.id,
    name: reminder.name,
    dosage: reminder.dosage,
    note: reminder.note,
    groupId: reminder.group_id || null,
    startDate: reminder.start_date || '',
    endDate: reminder.end_date || '',
    times: timeRows.map(t => ({
      id: t.id,
      time: t.time,
      taken: t.taken === 1,
      takenDate: t.taken_date,
    })),
    createdAt: reminder.created_at,
  };
}

function today() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// GET /api/reminders（JOIN 查询，一次取回所有提醒+时间）
router.get('/', (req, res) => {
  const rows = stmts.rem_listWithTimes(req.userId);

  // 将扁平 JOIN 结果按 reminder 分组
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, { reminder: row, times: [] });
    }
    if (row.t_id !== null) {
      map.get(row.id).times.push({ id: row.t_id, time: row.t_time, taken: row.t_taken, taken_date: row.t_taken_date });
    }
  }

  res.json({ reminders: [...map.values()].map(({ reminder, times }) => formatReminder(reminder, times)) });
});

// POST /api/reminders
router.post('/', (req, res) => {
  const { valid, errors, sanitized } = validateReminder(req.body);
  if (!valid) return res.status(400).json({ error: errors.join('；') });

  const { name, dosage, times, note, groupId, startDate, endDate } = req.body;
  const reminderId = stmts.rem_insert(req.userId, name, dosage, note, groupId, startDate, endDate);
  if (!reminderId) return res.status(500).json({ error: '创建提醒失败' });

  for (const t of times) {
    stmts.time_insert(reminderId, t);
  }

  const reminder = stmts.rem_findById(reminderId);
  const timeRows = stmts.time_listByRem(reminderId);

  res.status(201).json({ reminder: formatReminder(reminder, timeRows) });
});

// PUT /api/reminders/:id
router.put('/:id', (req, res) => {
  const reminder = stmts.rem_findById(req.params.id);
  if (!reminder || reminder.user_id !== req.userId) {
    return res.status(404).json({ error: '提醒不存在' });
  }

  const { valid, errors, sanitized } = validateReminder(req.body);
  if (!valid) return res.status(400).json({ error: errors.join('；') });

  const { name, dosage, times, note } = sanitized;
  const { groupId, startDate, endDate } = req.body;

  // 保留已有时间记录的 taken 状态
  const oldTimes = stmts.time_listByRem(reminder.id);
  const oldMap = new Map(oldTimes.map(t => [t.time, t]));

  stmts.rem_update(name, dosage, note, groupId, startDate, endDate, reminder.id);
  stmts.time_deleteByRem(reminder.id);
  for (const t of times) {
    const old = oldMap.get(t);
    stmts.time_insert(reminder.id, t);
    // 如果旧记录中该时间点已服用，恢复状态
    if (old && old.taken) {
      const newTime = stmts.time_listByRem(reminder.id).slice(-1)[0];
      if (newTime) stmts.time_toggle(1, old.taken_date, newTime.id);
    }
  }

  const updated = stmts.rem_findById(reminder.id);
  const timeRows = stmts.time_listByRem(reminder.id);

  res.json({ reminder: formatReminder(updated, timeRows) });
});

// DELETE /api/reminders/:id
router.delete('/:id', (req, res) => {
  const reminder = stmts.rem_findById(req.params.id);
  if (!reminder || reminder.user_id !== req.userId) {
    return res.status(404).json({ error: '提醒不存在' });
  }
  stmts.rem_delete(reminder.id);
  res.json({ ok: true });
});

// PATCH /api/reminders/:id/times/:timeId/toggle
router.patch('/:id/times/:timeId/toggle', (req, res) => {
  const reminder = stmts.rem_findById(req.params.id);
  if (!reminder || reminder.user_id !== req.userId) {
    return res.status(404).json({ error: '提醒不存在' });
  }

  const time = stmts.time_findById(req.params.timeId);
  if (!time || time.reminder_id !== reminder.id) {
    return res.status(404).json({ error: '时间点不存在' });
  }

  const newTaken = time.taken === 1 ? 0 : 1;
  const newDate = newTaken ? today() : '';

  stmts.time_toggle(newTaken, newDate, time.id);

  res.json({
    time: {
      id: time.id,
      time: time.time,
      taken: newTaken === 1,
      takenDate: newDate,
    },
  });
});

export default router;
