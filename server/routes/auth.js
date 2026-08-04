import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { stmts } from '../db.js';
import { signToken, authRequired } from '../middleware/auth.js';
import { validateRegister } from '../utils/validate.js';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { valid, errors, sanitized } = validateRegister(req.body);
  if (!valid) return res.status(400).json({ error: errors.join('；') });

  const { username, password, displayName } = sanitized;

  const existing = stmts.user_findByUsername(username);
  if (existing) return res.status(409).json({ error: '用户名已被注册' });

  const password_hash = bcrypt.hashSync(password, 10);
  const userId = stmts.user_insert(username, password_hash, displayName);

  const user = stmts.user_findById(userId);
  const token = signToken(user);

  res.status(201).json({ token, user, role: user.role || 'user' });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const user = stmts.user_findByUsername(username);
  if (!user) return res.status(401).json({ error: '用户名或密码错误' });

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = signToken(user);
  const { password_hash: _, ...safeUser } = user;

  res.json({ token, user: safeUser, role: user.role || 'user' });
});

// POST /api/auth/change-password — 修改密码（需登录）
router.post('/change-password', authRequired, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return res.status(400).json({ error: '请填写旧密码和新密码' });
  if (newPassword.length < 4) return res.status(400).json({ error: '新密码至少 4 个字符' });

  const fullUser = stmts.user_findByUsername(req.username);
  if (!fullUser) return res.status(404).json({ error: '用户不存在' });
  if (!bcrypt.compareSync(oldPassword, fullUser.password_hash)) {
    return res.status(400).json({ error: '旧密码错误' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  stmts.user_changePassword(fullUser.id, newHash);
  res.json({ ok: true });
});

export default router;
