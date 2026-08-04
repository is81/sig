/**
 * 用药助手 — 多语言模块
 * 用法: t('auth.loginTitle') → 翻译后的字符串
 *       t('stats.users', { n: 42 }) → "已有 42 位用户..."
 *       setLang('en') → 切换到英文
 */

const I18N = (() => {
  'use strict';

  const SUPPORTED = ['zh-CN', 'en', 'ja', 'es'];
  let _current = 'zh-CN';
  let _strings = {};

  /** 检测最佳语言 */
  function detect() {
    const saved = localStorage.getItem('sig_lang');
    if (saved && SUPPORTED.includes(saved)) return saved;
    const nav = navigator.language;
    if (nav && SUPPORTED.includes(nav)) return nav;
    if (nav && nav.startsWith('zh')) return 'zh-CN';
    if (nav && nav.startsWith('ja')) return 'ja';
    if (nav && nav.startsWith('es')) return 'es';
    return 'zh-CN';
  }

  /** 加载语言包 */
  async function load(lang) {
    try {
      const res = await fetch(`locales/${lang}.json`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      _strings = await res.json();
      _current = lang;
      localStorage.setItem('sig_lang', lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.warn('[i18n] 加载失败:', lang, e.message);
    }
  }

  /** 获取翻译 */
  function t(key, args) {
    let s = _strings[key];
    if (s === undefined) {
      console.warn('[i18n] 缺少:', key);
      return key;
    }
    if (args) {
      for (const [k, v] of Object.entries(args)) {
        s = s.replace(`{${k}}`, v);
      }
    }
    return s;
  }

  /** 切换语言 */
  async function setLang(lang) {
    await load(lang);
    // 触发自定义事件，让页面重新渲染
    window.dispatchEvent(new CustomEvent('langchange'));
  }

  /** 获取当前语言 */
  function current() { return _current; }

  /** 获取支持的语言列表 */
  function list() { return SUPPORTED; }

  // 启动时自动检测加载
  const init = (async () => {
    await load(detect());
  })();

  return { t, setLang, current, list, init };
})();

window.t = I18N.t;
window.setLang = I18N.setLang;
window.i18nCurrent = I18N.current;
window.i18nList = I18N.list;
window.i18nReady = I18N.init;
