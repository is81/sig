/**
 * 简易输入校验
 */

export function validateRegister(body) {
  const errors = [];
  const { username, password, displayName } = body || {};

  if (!username || typeof username !== 'string' || username.trim().length < 2) {
    errors.push('用户名至少 2 个字符');
  }
  if (username && username.trim().length > 30) {
    errors.push('用户名最多 30 个字符');
  }
  if (!password || typeof password !== 'string' || password.length < 4) {
    errors.push('密码至少 4 个字符');
  }
  if (password && password.length > 64) {
    errors.push('密码最多 64 个字符');
  }
  return {
    valid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? {
      username: username.trim(),
      password,
      displayName: (displayName || '').trim().slice(0, 30),
    } : null,
  };
}

export function validateReminder(body) {
  const errors = [];
  const { name, dosage, times, note } = body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('药品名称不能为空');
  }
  if (name && name.trim().length > 30) {
    errors.push('药品名称最多 30 个字符');
  }
  if (dosage && dosage.length > 20) {
    errors.push('剂量最多 20 个字符');
  }
  if (note && note.length > 60) {
    errors.push('备注最多 60 个字符');
  }
  if (!Array.isArray(times) || times.length === 0) {
    errors.push('至少需要一个用药时间');
  } else {
    const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const t of times) {
      if (!timeRe.test(t)) errors.push(`时间格式无效: ${t}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? {
      name: name.trim(),
      dosage: (dosage || '').trim().slice(0, 20),
      times: [...new Set(times)].sort(),
      note: (note || '').trim().slice(0, 60),
    } : null,
  };
}
