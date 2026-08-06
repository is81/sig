// ================================================================
//  💊 吃药了 Service Worker — Web Push 通知
// ================================================================

const API_BASE = '/api';

// ---------- IndexedDB 存取 token ----------
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('sig_app', 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('auth')) {
        req.result.createObjectStore('auth');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getToken() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('auth', 'readonly');
      const req = tx.objectStore('auth').get('token');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// ---------- Push 事件 ----------
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: '💊 吃药提醒', body: event.data.text() };
  }

  const { title, body, reminderId, timeId } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: '/sig/icon-192.png',
      badge: '/sig/icon-72.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: `reminder-${reminderId}-${timeId}`,
      actions: [
        { action: 'taken', title: '✅ 已服用' },
        { action: 'dismiss', title: '稍后' },
      ],
      data: { reminderId, timeId },
    })
  );
});

// ---------- 通知点击 ----------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { reminderId, timeId } = event.notification.data || {};

  if (event.action === 'taken' && reminderId && timeId) {
    event.waitUntil(markTaken(reminderId, timeId));
  }

  // 打开/聚焦主页面
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/sig/')) {
          return client.focus();
        }
      }
      return clients.openWindow('/sig/');
    })
  );
});

// ---------- API 调用 ----------
async function markTaken(reminderId, timeId) {
  try {
    const token = await getToken();
    if (!token) { console.warn('[SW] 无 token，无法标记已服——请重新登录'); return; }
    await fetch(`${API_BASE}/reminders/${reminderId}/times/${timeId}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (e) {
    console.warn('标记已服失败:', e);
  }
}
