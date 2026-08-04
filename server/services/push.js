import webpush from 'web-push';

let _vapidReady = false;

function ensureVapid() {
  if (_vapidReady) return true;
  const pub  = process.env.VAPID_PUBLIC_KEY  || '';
  const priv = process.env.VAPID_PRIVATE_KEY || '';
  if (pub && priv) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@is81.net', pub, priv);
    _vapidReady = true;
    return true;
  }
  return false;
}

export async function sendPush(sub, payload) {
  if (!ensureVapid()) {
    console.log('⚠️ VAPID keys 未配置，跳过推送');
    return false;
  }
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    // 410/404 表示 subscription 已失效
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { expired: true };
    }
    console.error('Web Push 发送失败:', err.statusCode, err.message);
    return false;
  }
}
