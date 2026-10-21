/* ===========================================================
 * VocaBridge · 核心层
 * 状态管理 / localStorage 持久化 / SM-2 间隔重复 / 每日统计
 * =========================================================== */
(function (root) {
  'use strict';

  /* ---------------- 工具函数 ---------------- */
  var util = {
    qs: function (s, el) { return (el || document).querySelector(s); },
    qsa: function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); },
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
    shuffle: function (arr) {
      var a = arr.slice(), i, j, t;
      for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    },
    sample: function (arr, n) { return util.shuffle(arr).slice(0, n); },
    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    dateKey: function (d) {
      d = d || new Date();
      var m = d.getMonth() + 1, dd = d.getDate();
      return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd;
    },
    today: function () { return util.dateKey(new Date()); },
    daysBetween: function (a, b) {
      var d1 = new Date(a + 'T00:00:00'), d2 = new Date(b + 'T00:00:00');
      return Math.round((d2 - d1) / 86400000);
    },
    addDays: function (key, n) {
      var d = new Date(key + 'T00:00:00');
      d.setDate(d.getDate() + n);
      return util.dateKey(d);
    },
    uid: function () { return Math.random().toString(36).slice(2, 9); },
    round1: function (n) { return Math.round(n * 10) / 10; },
    toHalf: function (n) { return Math.round(n * 2) / 2; },
    // 分词：保留撇号
    tokenize: function (text) {
      return String(text || '').toLowerCase()
        .replace(/[^a-z0-9'’\s-]/g, ' ')
        .replace(/[’]/g, "'")
        .split(/\s+/).filter(Boolean);
    },
    // 编辑距离（词级）
    lev: function (a, b) {
      var i, j, prev, cur, tmp;
      if (a === b) return 0;
      if (!a.length) return b.length;
      if (!b.length) return a.length;
      prev = [];
      for (j = 0; j <= b.length; j++) prev[j] = j;
      for (i = 1; i <= a.length; i++) {
        cur = [i];
        for (j = 1; j <= b.length; j++) {
          tmp = a[i - 1] === b[j - 1] ? prev[j - 1] : Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + 1);
          cur[j] = tmp;
        }
        prev = cur;
      }
      return prev[b.length];
    },
    // 词级对齐（返回替换/删除/插入信息）
    align: function (refTokens, hypTokens) {
      var ops = [], i = 0, j = 0;
      var dp = [];
      for (i = 0; i <= refTokens.length; i++) { dp[i] = []; for (j = 0; j <= hypTokens.length; j++) dp[i][j] = 0; }
      for (i = 0; i <= refTokens.length; i++) dp[i][0] = i;
      for (j = 0; j <= hypTokens.length; j++) dp[0][j] = j;
      for (i = 1; i <= refTokens.length; i++) {
        for (j = 1; j <= hypTokens.length; j++) {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + (refTokens[i - 1] === hypTokens[j - 1] ? 0 : 1)
          );
        }
      }
      i = refTokens.length; j = hypTokens.length;
      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] && refTokens[i - 1] === hypTokens[j - 1]) {
          ops.unshift({ t: 'ok', ref: refTokens[i - 1] }); i--; j--;
        } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
          ops.unshift({ t: 'sub', ref: refTokens[i - 1], hyp: hypTokens[j - 1] }); i--; j--;
        } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
          ops.unshift({ t: 'del', ref: refTokens[i - 1] }); i--;
        } else {
          ops.unshift({ t: 'ins', hyp: hypTokens[j - 1] }); j--;
        }
      }
      return ops;
    },
    toast: function (msg, type) {
      var el = document.getElementById('toast');
      if (!el) return;
      el.textContent = msg;
      el.className = 'toast show ' + (type || '');
      clearTimeout(el._t);
      el._t = setTimeout(function () { el.className = 'toast'; }, 2200);
    }
  };

  /* ---------------- 默认状态 ---------------- */
  var DEFAULT = {
    settings: {
      dailyGoal: 40,          // 每日词/题量目标
      accent: 'en-US',        // en-US / en-GB
      rate: 0.95,             // 朗读语速
      deck: 'ielts',          // ielts / work / all
      autoSpeak: true,
      llm: { enabled: false, baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini' }
    },
    profile: { name: '', target: '雅思 + 海外求职', createdAt: util.today() },
    words: {},               // id -> {ease, interval, reps, due, seen, wrong, mastered}
    grammar: {},             // qid -> {ok, wrong, due}
    speak: {},               // sid -> {best, count, last}
    sessions: [],            // 口语历次记录
    wrongbook: [],           // 错词/错题/弱句统一入口
    days: {},                // date -> {learn, review, speak, quiz, minutes}
    starred: []
  };

  var KEY = 'vocabridge_v1';

  // 某些浏览器/隐私模式禁用了 localStorage，降级到内存存储保证程序不崩
  var _mem = {};
  var LS = (function () {
    try {
      var t = '__vb_test__';
      localStorage.setItem(t, '1'); localStorage.removeItem(t);
      return localStorage;
    } catch (e) {
      return {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(_mem, k) ? _mem[k] : null; },
        setItem: function (k, v) { _mem[k] = String(v); },
        removeItem: function (k) { delete _mem[k]; }
      };
    }
  })();

  function deepMerge(base, patch) {
    var out = {}, k;
    for (k in base) out[k] = base[k];
    if (!patch) return out;
    for (k in patch) {
      if (patch[k] && typeof patch[k] === 'object' && !Array.isArray(patch[k])) out[k] = deepMerge(base[k] || {}, patch[k]);
      else out[k] = patch[k];
    }
    return out;
  }

  var store = {
    state: JSON.parse(JSON.stringify(DEFAULT)),
    load: function () {
      try {
        var raw = LS.getItem(KEY);
        if (raw) store.state = deepMerge(DEFAULT, JSON.parse(raw));
      } catch (e) { console.warn('读取本地数据失败', e); }
      return store.state;
    },
    save: function () {
      try { LS.setItem(KEY, JSON.stringify(store.state)); }
      catch (e) { util.toast('本地存储写入失败'); }
    },
    reset: function () { store.state = JSON.parse(JSON.stringify(DEFAULT)); store.save(); },
    exportJSON: function () { return JSON.stringify(store.state, null, 2); },
    importJSON: function (txt) {
      try { store.state = deepMerge(DEFAULT, JSON.parse(txt)); store.save(); return true; }
      catch (e) { return false; }
    },
    day: function () {
      var k = util.today(), s = store.state;
      if (!s.days[k]) s.days[k] = { learn: 0, review: 0, speak: 0, quiz: 0, minutes: 0 };
      return s.days[k];
    },
    bump: function (field, n) {
      var d = store.day();
      d[field] = (d[field] || 0) + (n == null ? 1 : n);
      store.save();
      return d;
    },
    streak: function () {
      var s = store.state, key = util.today(), n = 0;
      // 今天没学则从昨天开始算
      if (!(s.days[key] && (s.days[key].learn + s.days[key].review + s.days[key].speak > 0))) key = util.addDays(key, -1);
      while (s.days[key] && (s.days[key].learn + s.days[key].review + s.days[key].speak > 0)) {
        n++; key = util.addDays(key, -1);
      }
      return n;
    }
  };

  /* ---------------- SM-2 间隔重复 ---------------- */
  var srs = {
    get: function (id) {
      return store.state.words[id] || { ease: 2.5, interval: 0, reps: 0, due: util.today(), seen: false, wrong: 0, mastered: false };
    },
    ensure: function (id) {
      if (!store.state.words[id]) {
        store.state.words[id] = srs.get(id);
        store.save();
      }
      return store.state.words[id];
    },
    // quality: 0 完全不会 / 1 模糊 / 2 想起来了 / 3 秒答
    schedule: function (id, quality) {
      var w = srs.ensure(id);
      w.seen = true;
      if (quality <= 1) {
        w.reps = 0; w.interval = 0; w.due = util.today();
        w.ease = util.clamp((w.ease || 2.5) - 0.2, 1.3, 2.8);
        w.wrong = (w.wrong || 0) + 1;
        if (quality === 0) srs.addWrong('word', id);
      } else {
        w.reps = (w.reps || 0) + 1;
        w.ease = util.clamp((w.ease || 2.5) + (0.1 - (3 - quality) * 0.08), 1.3, 2.8);
        if (w.reps === 1) w.interval = 1;
        else if (w.reps === 2) w.interval = 3;
        else w.interval = Math.round(w.interval * (w.ease || 2.5));
        w.interval = util.clamp(w.interval, 1, 180);
        w.due = util.addDays(util.today(), w.interval);
        if (w.interval >= 21) w.mastered = true;
        srs.clearWrong('word', id);
      }
      store.save();
      return w;
    },
    addWrong: function (kind, id, extra) {
      var wb = store.state.wrongbook;
      var exist = wb.filter(function (x) { return x.kind === kind && x.id === id; })[0];
      if (exist) { exist.count++; exist.at = util.today(); }
      else wb.push({ kind: kind, id: id, count: 1, at: util.today(), note: extra || '' });
      if (wb.length > 400) wb.shift();
    },
    clearWrong: function (kind, id) {
      store.state.wrongbook = store.state.wrongbook.filter(function (x) { return !(x.kind === kind && x.id === id); });
    },
    dueWords: function (deckFilter) {
      var t = util.today(), out = [];
      Object.keys(store.state.words).forEach(function (id) {
        var w = store.state.words[id];
        if (w.due && w.due <= t) out.push(id);
      });
      if (deckFilter) out = out.filter(function (id) { return App.vocab.byId(id) && App.vocab.byId(id).deck === deckFilter; });
      return out;
    },
    // 今日新词：从未见过
    newWords: function (pool, n) {
      var unseen = pool.filter(function (w) { return !store.state.words[w.id]; });
      return unseen.slice(0, n).map(function (w) { return w.id; });
    }
  };

  root.App = root.App || {};
  root.App.util = util;
  root.App.store = store;
  root.App.srs = srs;
  root.App.DEFAULTS = DEFAULT;
})(typeof window !== 'undefined' ? window : globalThis);
