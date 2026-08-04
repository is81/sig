import cron from 'node-cron';
import { stmts } from '../db.js';
import { sendPush } from './push.js';

function timeNow() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' +
         String(d.getMinutes()).padStart(2, '0');
}

function today() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

/** 发送提醒 */
async function checkAndNotify() {
  const now = timeNow();
  console.log(`[调度] 检查提醒: ${now}`);

  const matches = stmts.time_matchNow(now);

  if (matches.length === 0) return;

  console.log(`[调度] 发现 ${matches.length} 条待提醒`);

  for (const m of matches) {
    const subs = stmts.push_findByUser(m.user_id);

    const payload = {
      title: `💊 ${m.name}`,
      body: `${m.dosage ? m.dosage + ' · ' : ''}用药时间到了${m.note ? ' — ' + m.note : ''}`,
      reminderId: String(m.reminder_id),
      timeId: String(m.id),
    };

    for (const sub of subs) {
      const result = await sendPush(sub, payload);
      // 清理过期 subscription
      if (result && result.expired) {
        stmts.push_delete(sub.endpoint);
      }
    }
  }
}

/** 每日重置 */
function resetDaily() {
  const tod = today();
  // time_resetDaily 会调用 saveToDisk 所以 OK
  stmts.time_resetDaily(tod);
  console.log(`[调度] 每日重置完成 (${tod})`);
}

let _tasks = [];

/** 启动定时器 */
export function initScheduler() {
  _tasks.push(cron.schedule('*/30 * * * * *', checkAndNotify));
  _tasks.push(cron.schedule('1 0 * * *', resetDaily));

  // 启动时也执行一次每日重置
  resetDaily();

  console.log('[调度] 定时器已启动 (30s 提醒检查 + 每日0:01重置)');
}

/** 停止定时器 */
export function stopScheduler() {
  _tasks.forEach(t => t.stop());
  _tasks = [];
  console.log('[调度] 定时器已停止');
}
