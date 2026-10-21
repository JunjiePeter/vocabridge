/* ===========================================================
 * 内容热更新体系
 * - content/manifest.json 描述版本与包清单
 * - content/packs/*.json 是实际内容包（单词/语法/跟读/情景/话题卡/视频）
 * - 运行时先应用本地缓存包，再后台静默检查远程版本
 * - 本地 file:// 下 fetch 失败时自动静默降级，不影响内置内容
 * =========================================================== */
(function (root) {
  'use strict';
  var App = root.App, U = App.util, S = App.store;

  App.extra = App.extra || { vocab: [], videos: [] };

  var CACHE_KEY = 'vocabridge_content_v1';

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : { version: 0, updatedAt: null, packs: {} };
    } catch (e) { return { version: 0, updatedAt: null, packs: {} }; }
  }
  function writeCache(c) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (e) { }
  }

  function dedupe(list, idKey) {
    var seen = {}, out = [];
    list.forEach(function (x) {
      var k = x[idKey];
      if (!seen[k]) { seen[k] = 1; out.push(x); }
    });
    return out;
  }

  function applyPack(pack) {
    if (!pack || !pack.type) return 0;
    var n = 0;
    switch (pack.type) {
      case 'vocab':
        (pack.items || []).forEach(function (r, i) {
          var id = 'X' + pack.id + '_' + i;
          var exists = App.extra.vocab.concat(App.VOCAB_IELTS || [], App.VOCAB_WORK || [])
            .some(function (w) { return w.word.toLowerCase() === String(r[0]).toLowerCase(); });
          if (!exists) {
            App.extra.vocab.push({
              id: id, deck: pack.deck || 'ielts', word: r[0], phon: r[1] || '', pos: r[2] || '',
              cn: r[3] || '', ex: r[4] || '', exCn: r[5] || '', tag: pack.tag || 'extra'
            });
            n++;
          }
        });
        break;
      case 'grammar':
        (pack.items || []).forEach(function (t) {
          if (!App.GRAMMAR.some(function (g) { return g.id === t.id; })) { App.GRAMMAR.push(t); n++; }
        });
        break;
      case 'passage':
        (pack.items || []).forEach(function (p) {
          if (!App.PASSAGES.some(function (x) { return x.id === p.id; })) { App.PASSAGES.push(p); n++; }
        });
        break;
      case 'scenario':
        (pack.items || []).forEach(function (s) {
          if (!App.SCENARIOS.some(function (x) { return x.id === s.id; })) { App.SCENARIOS.push(s); n++; }
        });
        break;
      case 'cue':
        (pack.items || []).forEach(function (c) {
          if (!App.CUES.some(function (x) { return x.t === c.t; })) { App.CUES.push(c); n++; }
        });
        break;
      case 'video':
        (pack.items || []).forEach(function (v) {
          if (!App.extra.videos.some(function (x) { return x.id === v.id; })) { App.extra.videos.push(v); n++; }
        });
        break;
    }
    return n;
  }

  var content = {
    state: readCache(),

    applyCached: function () {
      var c = content.state, total = 0;
      Object.keys(c.packs).forEach(function (id) { total += applyPack(c.packs[id]); });
      return total;
    },

    sourceBase: function () {
      var s = S.state.settings.contentSource || './';
      return s.replace(/\/?$/, '/');
    },

    // 拉取 manifest，发现新版本则下载并应用
    check: function () {
      var base = content.sourceBase();
      return fetch(base + 'content/manifest.json?v=' + Date.now(), { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (m) {
          if (!m || typeof m.version !== 'number') throw new Error('manifest 格式不正确');
          var cur = content.state;
          if (m.version <= (cur.version || 0)) {
            return { updated: false, message: '已是最新版本 v' + cur.version };
          }
          // 逐个拉包（跳过已缓存且版本相同的）
          var downloads = (m.packs || []).map(function (p) {
            var cached = cur.packs[p.id];
            if (cached && cached.packVersion === p.version) return Promise.resolve(null);
            return fetch(base + p.file).then(function (r) {
              if (!r.ok) throw new Error(p.file + ' 加载失败');
              return r.json();
            }).then(function (data) {
              data.packVersion = p.version;
              cur.packs[p.id] = data;
            });
          });
          return Promise.all(downloads).then(function () {
            var added = 0;
            (m.packs || []).forEach(function (p) { added += applyPack(cur.packs[p.id]); });
            cur.version = m.version; cur.updatedAt = m.updatedAt || U.today();
            writeCache(cur);
            return { updated: true, version: m.version, added: added, message: '已更新到 v' + m.version + '，新增/合并 ' + added + ' 项内容' };
          });
        })
        .catch(function (e) {
          return { updated: false, error: true, message: '更新失败：' + (e.message || e) + '（内置内容不受影响）' };
        });
    },

    reset: function () {
      try { localStorage.removeItem(CACHE_KEY); } catch (e) { }
      content.state = { version: 0, updatedAt: null, packs: {} };
    },

    status: function () {
      var c = content.state;
      return {
        version: c.version, updatedAt: c.updatedAt,
        packCount: Object.keys(c.packs).length,
        extraVocab: App.extra.vocab.length, extraVideos: App.extra.videos.length
      };
    }
  };

  App.content = content;
})(typeof window !== 'undefined' ? window : globalThis);
