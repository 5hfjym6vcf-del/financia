// ============================================================
// FINANCIA — i18n-core.js
// Moteur i18n partagé (index.html + histoire.html) : lecture des
// traductions (window.I18N, voir i18n.js), application au DOM via
// data-i18n / data-i18n-html / data-i18n-placeholder / data-i18n-aria,
// persistance localStorage, <html lang> dynamique, swap sans reload.
// Chargé de façon bloquante juste après i18n.js dans <head>.
// ============================================================
(function () {
  const SUPPORTED = ['fr', 'en', 'es', 'ru', 'de'];
  const STORAGE_KEY = 'financia_lang';

  function getLang() {
    let stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* storage disabled */ }
    return SUPPORTED.includes(stored) ? stored : 'fr';
  }

  function getDict(lang) {
    return (window.I18N && window.I18N[lang]) || (window.I18N && window.I18N.fr) || {};
  }

  function get(path, lang) {
    const dict = getDict(lang || getLang());
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), dict);
  }

  // t('some.key') → traduction ; t('some.key', {name:'x'}) → remplace {name} dans la chaîne.
  function t(path, vars) {
    let val = get(path);
    if (val === undefined) return path;
    if (vars && typeof val === 'string') {
      Object.keys(vars).forEach(k => {
        val = val.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return val;
  }

  function applyTranslations(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const val = t(el.getAttribute('data-i18n'));
      if (typeof val === 'string') el.textContent = val;
    });
    root.querySelectorAll('[data-i18n-html]').forEach(el => {
      const val = t(el.getAttribute('data-i18n-html'));
      if (typeof val === 'string') el.innerHTML = val;
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const val = t(el.getAttribute('data-i18n-placeholder'));
      if (typeof val === 'string') el.setAttribute('placeholder', val);
    });
    root.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const val = t(el.getAttribute('data-i18n-aria'));
      if (typeof val === 'string') el.setAttribute('aria-label', val);
    });
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
      const val = t(el.getAttribute('data-i18n-title'));
      if (typeof val === 'string') el.setAttribute('title', val);
    });
  }

  const listeners = [];
  function onLangChange(fn) { listeners.push(fn); }

  // Deux sélecteurs partagent l'état langue : celui de la nav desktop
  // (#langSelect) et celui du panneau mobile (#langSelectMobile).
  const SELECT_IDS = ['langSelect', 'langSelectMobile'];

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = 'fr';
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage disabled */ }
    document.documentElement.lang = lang;
    applyTranslations();
    SELECT_IDS.forEach(id => {
      const sel = document.getElementById(id);
      if (sel) sel.value = lang;
    });
    listeners.forEach(fn => { try { fn(lang); } catch (e) { console.error('[i18n] listener error', e); } });
  }

  // Appelé au tout début de script.js / histoire.js — traduit tout le
  // HTML statique déjà présent, branche les sélecteurs, révèle la page.
  function initLang() {
    const lang = getLang();
    document.documentElement.lang = lang;
    applyTranslations();
    SELECT_IDS.forEach(id => {
      const sel = document.getElementById(id);
      if (sel) {
        sel.value = lang;
        sel.addEventListener('change', () => setLang(sel.value));
      }
    });
    document.documentElement.classList.add('i18n-ready');
    return lang;
  }

  window.FinanciaI18N = { t, get, getLang, setLang, initLang, applyTranslations, onLangChange, SUPPORTED };
})();
