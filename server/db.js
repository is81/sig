import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, 'sig.db');

let db; // 单例

/** 初始化数据库 */
export async function initDB() {
  const SQL = await initSqlJs();

  // 尝试从磁盘加载
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('[DB] 从磁盘加载:', dbPath);
  } else {
    db = new SQL.Database();
    console.log('[DB] 新建内存数据库');
  }

  // ===== 建表 =====
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      display_name  TEXT    DEFAULT '',
      created_at    TEXT    DEFAULT (datetime('now','localtime'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT    NOT NULL,
      dosage     TEXT    DEFAULT '',
      note       TEXT    DEFAULT '',
      created_at TEXT    DEFAULT (datetime('now','localtime'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reminder_times (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      reminder_id INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
      time        TEXT    NOT NULL,
      taken       INTEGER DEFAULT 0,
      taken_date  TEXT    DEFAULT ''
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint   TEXT    NOT NULL,
      p256dh     TEXT    NOT NULL,
      auth       TEXT    NOT NULL,
      created_at TEXT    DEFAULT (datetime('now','localtime'))
    )
  `);

  // 索引
  db.run('CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id, created_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reminder_times_rid ON reminder_times(reminder_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id)');

  // 首次写入
  saveToDisk();
  return db;
}

/** 持久化到磁盘（防抖：1 秒内多次调用只写一次） */
let _saveTimer = null;
export function saveToDisk() {
  if (!db) return;
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(dbPath, Buffer.from(db.export()));
    } catch (e) {
      console.error('[DB] 保存失败:', e.message);
    }
  }, 1000);
}

/** 立即同步写盘（进程退出前调用） */
export function flushSync() {
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  if (!db) return;
  try {
    fs.writeFileSync(dbPath, Buffer.from(db.export()));
  } catch (e) {
    console.error('[DB] 同步写盘失败:', e.message);
  }
}

// ===== 查询辅助函数 =====

function getRow(stmt) {
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return row;
}

function getAll(stmt) {
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/** 获取最后插入的 rowid（sql.js 兼容写法） */
function lastInsertId() {
  const row = getRow(db.prepare('SELECT last_insert_rowid() AS id'));
  return row ? row.id : null;
}

// ===== 暴露数据库操作 =====

export const stmts = {
  // users
  user_findByUsername(username) {
    return getRow(db.prepare('SELECT * FROM users WHERE username = ?', [username]));
  },
  user_findById(id) {
    return getRow(db.prepare('SELECT id, username, display_name, created_at FROM users WHERE id = ?', [id]));
  },
  user_insert(username, password_hash, displayName) {
    db.run('INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)', [username, password_hash, displayName]);
    const id = lastInsertId();
    saveToDisk();
    return id;
  },
  user_count() {
    const row = getRow(db.prepare('SELECT COUNT(*) AS cnt FROM users'));
    return row ? row.cnt : 0;
  },

  // reminders
  rem_list(userId) {
    return getAll(db.prepare('SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at DESC', [userId]));
  },
  /** 一次 JOIN 查询提醒+时间，替代 N+1 */
  rem_listWithTimes(userId) {
    return getAll(db.prepare(`
      SELECT r.*, rt.id AS t_id, rt.time AS t_time, rt.taken AS t_taken, rt.taken_date AS t_taken_date
        FROM reminders r
        LEFT JOIN reminder_times rt ON rt.reminder_id = r.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC, rt.time
    `, [userId]));
  },
  rem_findById(id) {
    return getRow(db.prepare('SELECT * FROM reminders WHERE id = ?', [id]));
  },
  rem_insert(userId, name, dosage, note) {
    db.run('INSERT INTO reminders (user_id, name, dosage, note) VALUES (?, ?, ?, ?)', [userId, name, dosage, note]);
    const id = lastInsertId();
    saveToDisk();
    return id;
  },
  rem_update(name, dosage, note, id) {
    db.run('UPDATE reminders SET name = ?, dosage = ?, note = ? WHERE id = ?', [name, dosage, note, id]);
    saveToDisk();
  },
  rem_delete(id) {
    db.run('DELETE FROM reminders WHERE id = ?', [id]);
    saveToDisk();
  },

  // reminder_times
  time_listByRem(reminderId) {
    return getAll(db.prepare('SELECT * FROM reminder_times WHERE reminder_id = ? ORDER BY time', [reminderId]));
  },
  time_insert(reminderId, time) {
    db.run('INSERT INTO reminder_times (reminder_id, time) VALUES (?, ?)', [reminderId, time]);
    saveToDisk();
  },
  time_deleteByRem(reminderId) {
    db.run('DELETE FROM reminder_times WHERE reminder_id = ?', [reminderId]);
    saveToDisk();
  },
  time_findById(id) {
    return getRow(db.prepare('SELECT * FROM reminder_times WHERE id = ?', [id]));
  },
  time_toggle(taken, taken_date, id) {
    db.run('UPDATE reminder_times SET taken = ?, taken_date = ? WHERE id = ?', [taken, taken_date, id]);
    saveToDisk();
  },
  time_resetDaily(today) {
    db.run("UPDATE reminder_times SET taken = 0, taken_date = '' WHERE taken_date != ? AND taken = 1", [today]);
    saveToDisk();
  },
  time_matchNow(time) {
    return getAll(db.prepare(`SELECT rt.*, r.user_id, r.name, r.dosage, r.note
                               FROM reminder_times rt
                               JOIN reminders r ON r.id = rt.reminder_id
                              WHERE rt.time = ? AND rt.taken = 0`, [time]));
  },

  // push
  push_findByUser(userId) {
    return getAll(db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?', [userId]));
  },
  push_upsert(userId, endpoint, p256dh, auth) {
    // 先删除同 endpoint 的旧记录
    db.run('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    db.run('INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)', [userId, endpoint, p256dh, auth]);
    saveToDisk();
  },
  push_delete(endpoint) {
    db.run('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    saveToDisk();
  },
};
