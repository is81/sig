import jwt from 'jsonwebtoken';

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    console.error('[FATAL] JWT_SECRET 未设置');
    throw new Error('JWT_SECRET not configured');
  }
  return s;
}

/** Express 中间件：验证 JWT，将 userId/username/role 注入 req */
export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }
  try {
    const payload = jwt.verify(header.slice(7), getSecret());
    req.userId = payload.userId;
    req.username = payload.username;
    req.userRole = payload.role || 'user';
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

/** Express 中间件：仅管理员 */
export function adminRequired(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

/** 生成 JWT（含 role） */
export function signToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role || 'user' },
    getSecret(),
    { expiresIn: '7d' }
  );
}
