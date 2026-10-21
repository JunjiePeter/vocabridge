/* ===========================================================
 * 单词模块：词库访问 + 学习 / 练习 / 拼写 / 词库列表 / 会话
 * 参考扇贝「初识→练习→自评→间隔复习」闭环
 * =========================================================== */
(function (root) {
  'use strict';
  var App = root.App, U = App.util, S = App.store, srs = App.srs, ui = App.ui;

  /* ---------- 数据访问 ---------- */
  var vocab = {
    all: function (deck) {
      var a = (root.App.VOCAB_IELTS || []).concat(root.App.VOCAB_WORK || [], (root.App.extra && root.App.extra.vocab) || []);
      if (!deck || deck === 'all') return a;
      return a.filter(function (w) { return w.deck === deck; });
    },
    byId: function (id) {
      var a = vocab.all();
      for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
      return null;
    },
    decks: [
      { id: 'ielts', label: '雅思核心' },
      { id: 'work', label: '求职职场' },
      { id: 'all', label: '全部' }
    ],
    stats: function (deck) {
      var list = vocab.all(deck), s = S.state.words, seen = 0, mastered = 0;
      list.forEach(function (w) {
        var p = s[w.id];
        if (p && p.seen) seen++;
        if (p && p.mastered) mastered++;
      });
      return { total: list.length, seen: seen, mastered: mastered };
    }
  };
  App.vocab = vocab;

  /* ---------- 会话状态 ---------- */
  var SS = {
    mode: null, items: [], i: 0, ok: 0, bad: 0, wrongIds: [],
    q: null, phase: 'q', lastResult: null, revealed: false, cardWord: null
  };

  var MODES = [
    { id: 'learn', label: '初识卡片', desc: '新词先看，配例句+发音' },
    { id: 'quiz', label: '选择题', desc: '英选中 / 中选英 / 听音选义' },
    { id: 'spell', label: '拼写+听写', desc: '中文/音频提示下拼写' },
    { id: 'review', label: '到期复习', desc: '按遗忘曲线安排的组合练习' }
  ];

  /* ---------- 组题 ---------- */
  function makeQuestion(w, type) {
    var pool = vocab.all(S.state.settings.deck);
    var others = U.shuffle(pool.filter(function (x) { return x.id !== w.id; })).slice(0, 3);
    if (type === 'cn2en') {
      var opts = U.shuffle([w].concat(others).map(function (x) { return x.word; }));
      return { type: 'choice', prompt: w.cn + '  ' + w.pos, sub: '选出对应的英文单词', options: opts, answer: w.word, word: w };
    }
    if (type === 'listen') {
      var opts2 = U.shuffle([w.cn].concat(others.map(function (x) { return x.cn; })));
      return { type: 'choice', prompt: '🔊 听发音，选出正确释义', sub: '点击播放重听', options: opts2, answer: w.cn, word: w, audio: true };
    }
    var opts3 = U.shuffle([w.cn].concat(others.map(function (x) { return x.cn; })));
    return { type: 'choice', prompt: w.word, sub: w.phon + '  ' + w.pos, options: opts3, answer: w.cn, word: w };
  }

  function start(mode, list0) {
    var list = list0;
    if (!list) {
      var deck = S.state.settings.deck;
      var pool = vocab.all(deck);
      if (mode === 'review') list = srs.dueWords(deck === 'all' ? null : deck);
      else list = srs.newWords(pool, mode === 'learn' ? 15 : 20);
      if (mode !== 'review' && list.length < 5) list = U.shuffle(pool).slice(0, 15).map(function (w) { return w.id; });
    }
    if (!list.length) { U.toast(mode === 'review' ? '暂时没有到期单词，先去学新词吧' : '没有可用的单词'); return false; }
    SS.mode = mode; SS.items = U.shuffle(list); SS.i = 0; SS.ok = 0; SS.bad = 0; SS.wrongIds = []; SS.cardWord = null;
    next();
    App.router.go('#/vocab');
    return true;
  }

  function cur() { return vocab.byId(SS.items[SS.i]); }

  function next() {
    SS.phase = 'q'; SS.revealed = false; SS.lastResult = null;
    if (SS.i >= SS.items.length) { SS.mode = 'done'; return; }
    var w = cur();
    if (!w) { SS.i++; return next(); }
    if (SS.mode === 'learn') { SS.cardWord = w; if (S.state.settings.autoSpeak) root.App.tts.speak(w.word, {}); S.bump('learn'); }
    else if (SS.mode === 'spell') { SS.q = { type: 'spell', word: w }; if (S.state.settings.autoSpeak) root.App.tts.speak(w.word, {}); }
    else {
      var types = ['en2cn', 'cn2en', 'listen'];
      SS.q = makeQuestion(w, SS.mode === 'review' ? U.pick(types) : U.pick(types));
      if (SS.q.audio && S.state.settings.autoSpeak) root.App.tts.speak(w.word, {});
    }
    App.views.vocab.render(document.getElementById('view'));
  }

  function answerChoice(opt) {
    if (SS.phase !== 'q') return;
    var w = SS.q.word, right = opt === SS.q.answer;
    SS.phase = 'fb'; SS.lastResult = right ? 'ok' : 'no';
    if (right) { SS.ok++; srs.schedule(w.id, 3); }
    else { SS.bad++; srs.schedule(w.id, 0); SS.wrongIds.push(w.id); S.bump('review'); }
    S.bump(right ? 'learn' : 'review');
    App.views.vocab.render(document.getElementById('view'));
  }

  function gradeLearn(q) {
    var w = SS.cardWord;
    srs.schedule(w.id, q);
    if (q <= 1) SS.wrongIds.push(w.id);
    SS.i++; next();
  }

  function checkSpell(val) {
    var w = SS.q.word;
    var user = String(val || '').trim().toLowerCase().replace(/\s+/g, ' ');
    var target = w.word.toLowerCase();
    var right = user === target || user === target.replace(/\s*\(.*\)/, '');
    SS.phase = 'fb'; SS.lastResult = right ? 'ok' : 'no';
    SS.lastSpell = { user: user, target: target };
    if (right) { SS.ok++; srs.schedule(w.id, 3); }
    else { SS.bad++; srs.schedule(w.id, 0); SS.wrongIds.push(w.id); }
    S.bump(right ? 'learn' : 'review');
    App.views.vocab.render(document.getElementById('view'));
  }

  function manualGrade(quality) {
    var w = SS.mode === 'learn' ? SS.cardWord : SS.q.word;
    srs.schedule(w.id, quality);
  }

  /* ---------- 渲染 ---------- */
  function renderSession(el) {
    if (SS.mode === 'done') {
      var total = SS.ok + SS.bad, rate = total ? Math.round(SS.ok / total * 100) : 0;
      el.innerHTML =
        '<div class="card center">' +
        '<div class="done-ico">🎉</div><h3>本组完成</h3>' +
        '<div class="stat-row">' +
        '<div><b>' + SS.ok + '</b><span>正确</span></div>' +
        '<div><b>' + SS.bad + '</b><span>需巩固</span></div>' +
        '<div><b>' + rate + '%</b><span>正确率</span></div>' +
        '</div>' +
        '<p class="muted">' + (SS.wrongIds.length ? '错词已进入错词本，明天会优先出现在复习队列。' : '全部答对，系统已按遗忘曲线安排下次复习。') + '</p>' +
        '<div class="row center-row">' +
        ui.btn('再来一组', 'vocab-start', { cls: 'primary', val: SS.mode }) +
        (SS.wrongIds.length ? ui.btn('只练错词', 'vocab-startWrong', {}) : '') +
        ui.btn('返回', 'vocab-exit', {}) +
        '</div></div>';
      return;
    }

    var pct = Math.round(SS.i / SS.items.length * 100);
    var head = '<div class="sess-head"><div class="row spread"><span class="tag">' +
      (MODES.filter(function (m) { return m.id === SS.mode; })[0] || {}).label + '</span>' +
      '<span class="muted">' + (SS.i + 1) + ' / ' + SS.items.length + '</span></div>' + ui.bar(pct) +
      '<div class="row spread mini"><span class="ok-c">✓ ' + SS.ok + '</span><span class="bad-c">✗ ' + SS.bad + '</span></div></div>';

    if (SS.mode === 'learn') {
      var w = SS.cardWord;
      el.innerHTML = head +
        '<div class="card flash">' +
        '<div class="word-big">' + U.esc(w.word) + ui.speakBtn(w.word) + '</div>' +
        '<div class="phon">' + U.esc(w.phon) + ' <span class="tag sm">' + U.esc(w.pos) + '</span></div>' +
        (SS.revealed
          ? '<div class="mean"><b>' + U.esc(w.cn) + '</b></div>' +
          '<div class="ex-box"><div class="ex">' + U.esc(w.ex) + ui.speakBtn(w.ex) + '</div><div class="ex-cn">' + U.esc(w.exCn) + '</div></div>' +
          '<div class="row3">' +
          ui.btn('不认识', 'vocab-grade', { val: '0' }) +
          ui.btn('模糊', 'vocab-grade', { val: '1', cls: 'warn' }) +
          ui.btn('认识', 'vocab-grade', { val: '3', cls: 'ok' }) +
          '</div>'
          : '<div class="row center-row">' + ui.btn('显示释义', 'vocab-reveal', { cls: 'primary' }) + '</div>') +
        '</div>';
      return;
    }

    if (SS.mode === 'spell') {
      var ws = SS.q.word;
      el.innerHTML = head +
        '<div class="card">' +
        '<div class="prompt">' + U.esc(ws.cn) + '　<span class="tag sm">' + U.esc(ws.pos) + '</span></div>' +
        '<div class="muted mini">听录音或看中文拼写单词</div>' +
        '<div class="row center-row">' + ui.btn('🔊 播放单词', 'speak', { id: ws.word }) + ui.btn('🐢 慢速', 'vocab-slow', { id: ws.word }) + '</div>' +
        (SS.phase === 'fb'
          ? '<div class="fb ' + SS.lastResult + '">' +
          '<div class="fb-head">' + (SS.lastResult === 'ok' ? '✅ 拼写正确' : '❌ 正确拼写：' + U.esc(ws.word)) + '</div>' +
          (SS.lastResult === 'no' ? '<div class="diff">你写的：<code>' + U.esc(SS.lastSpell.user || '(空)') + '</code></div>' : '') +
          '<div class="ex-box"><div class="ex">' + U.esc(ws.ex) + ui.speakBtn(ws.ex) + '</div><div class="ex-cn">' + U.esc(ws.exCn) + '</div></div>' +
          '<div class="row3">' + ui.btn('标为认识', 'vocab-over', { val: '3', cls: 'ok' }) + ui.btn('下一个', 'vocab-next', { cls: 'primary' }) + ui.btn('结束', 'vocab-exit', {}) + '</div>' +
          '</div>'
          : '<div class="row"><input id="spellInput" class="input" placeholder="输入单词后回车" autocomplete="off" autocapitalize="off">' +
          ui.btn('提交', 'vocab-check', { cls: 'primary' }) + '</div>' +
          '<div class="row center-row">' + ui.btn('提示首字母', 'vocab-hint', {}) + '</div>') +
        '</div>';
      var inp = document.getElementById('spellInput');
      if (inp) { inp.focus(); inp.onkeydown = function (e) { if (e.key === 'Enter') document.querySelector('[data-act="vocab-check"]').click(); }; }
      return;
    }

    // 选择题
    var q = SS.q;
    el.innerHTML = head +
      '<div class="card">' +
      '<div class="prompt">' + U.esc(q.prompt) + (q.audio ? ' <span class="replay" data-act="speak" data-id="' + U.esc(q.word.word) + '">🔊</span>' : '') + '</div>' +
      '<div class="muted mini">' + U.esc(q.sub) + '</div>' +
      '<div class="opts">' + q.options.map(function (o) {
        var cls = '';
        if (SS.phase === 'fb') {
          if (o === q.answer) cls = ' right';
          else if (SS.lastResult === 'no' && o === SS.picked) cls = ' wrong';
        }
        return '<button class="opt' + cls + '" data-act="vocab-answer" data-id="' + U.esc(o) + '">' + U.esc(o) + '</button>';
      }).join('') + '</div>' +
      (SS.phase === 'fb'
        ? '<div class="fb ' + SS.lastResult + '">' +
        '<div class="ex-box"><div class="ex">' + U.esc(q.word.ex) + ui.speakBtn(q.word.ex) + '</div><div class="ex-cn">' + U.esc(q.word.exCn) + '</div></div>' +
        '<div class="row3">' + ui.btn('下一个', 'vocab-next', { cls: 'primary' }) + ui.btn('加入错词本', 'vocab-markWrong', { id: q.word.id }) + ui.btn('结束', 'vocab-exit', {}) + '</div>' +
        '</div>'
        : '') +
      '</div>';
  }

  function renderHub(el) {
    var deckId = S.state.settings.deck;
    var st = vocab.stats(deckId);
    var due = srs.dueWords(deckId === 'all' ? null : deckId).length;
    var newCount = vocab.all(deckId).filter(function (w) { return !S.state.words[w.id]; }).length;

    el.innerHTML =
      ui.card(
        '<div class="row spread"><b>词库</b>' + ui.muted('共 ' + st.total + ' 词') + '</div>' +
        ui.chips(vocab.decks, 'vocab-deck', deckId) +
        '<div class="row mini spread"><span>已学 ' + st.seen + '</span><span>已掌握 ' + st.mastered + '</span><span>未学 ' + newCount + '</span></div>' +
        ui.bar(st.seen / Math.max(1, st.total) * 100)
      ) +
      ui.card(
        '<div class="row spread"><b>今日任务</b></div>' +
        '<div class="task-grid">' +
        '<div class="task"><span class="t-ico">🆕</span><b>学新词</b><i>' + Math.min(15, newCount) + ' 词</i>' + ui.btn('开始', 'vocab-start', { val: 'learn', cls: 'primary sm' }) + '</div>' +
        '<div class="task"><span class="t-ico">🔁</span><b>到期复习</b><i>' + due + ' 词</i>' + ui.btn('开始', 'vocab-start', { val: 'review', cls: 'primary sm' }) + '</div>' +
        '</div>'
      ) +
      ui.card('<b>练习模式</b>' +
        '<div class="mode-grid">' + MODES.map(function (m) {
          return '<div class="mode-item"><div><b>' + m.label + '</b><p class="muted">' + m.desc + '</p></div>' +
            ui.btn('Go', 'vocab-start', { val: m.id, cls: 'sm' }) + '</div>';
        }).join('') + '</div>') +
      ui.card('<div class="row spread"><b>我的词库</b>' +
        '<div class="row"><input id="vSearch" class="input sm" placeholder="搜索单词或中文…">' +
        ui.btn('错词本(' + S.state.wrongbook.filter(function (x) { return x.kind === 'word'; }).length + ')', 'vocab-startWrong', { cls: 'sm' }) + '</div></div>' +
        '<div id="vocabList" class="word-list"></div>');

    var inp = document.getElementById('vSearch');
    if (inp) inp.oninput = function () { ui.fire('vocab-search', inp); };
    ui.fire('vocab-search', document.getElementById('vSearch'));
  }

  App.views = App.views || {};
  App.views.vocab = {
    title: '单词',
    icon: '📖',
    render: function (el) {
      if (SS.mode && SS.items.length) renderSession(el); else renderHub(el);
    }
  };
  App.vocabSession = SS;

  /* ---------- 事件 ---------- */
  function renderList(q) {
    var box = document.getElementById('vocabList');
    if (!box) return;
    q = (q || '').trim().toLowerCase();
    var list = vocab.all(S.state.settings.deck);
    if (q) list = list.filter(function (w) { return w.word.toLowerCase().indexOf(q) >= 0 || w.cn.indexOf(q) >= 0; });
    list = list.slice(0, 200);
    box.innerHTML = list.map(function (w) {
      var p = S.state.words[w.id];
      var badge = !p ? '<span class="dot new"></span>' : (p.mastered ? '<span class="dot ok"></span>' : '<span class="dot ing"></span>');
      return '<div class="wl-item" data-act="vocab-detail" data-id="' + w.id + '">' + badge +
        '<div class="wl-w"><b>' + U.esc(w.word) + '</b><span class="muted">' + U.esc(w.phon) + '</span></div>' +
        '<div class="wl-cn">' + U.esc(w.cn) + '</div></div>';
    }).join('') || ui.muted('没有匹配的单词');
  }

  ui.on('vocab-search', function (a) { renderList(a.el.value); });
  ui.on('vocab-deck', function (a) { S.state.settings.deck = a.val; S.save(); App.views.vocab.render(document.getElementById('view')); });
  ui.on('vocab-start', function (a) { start(a.val); });
  ui.on('vocab-exit', function () { SS.mode = null; SS.items = []; App.views.vocab.render(document.getElementById('view')); });
  ui.on('vocab-startWrong', function () {
    var ids = U.shuffle(S.state.wrongbook.filter(function (x) { return x.kind === 'word'; }).map(function (x) { return x.id; })).slice(0, 20);
    if (!ids.length) return U.toast('错词本是空的');
    start('quiz', ids);
  });
  ui.on('vocab-reveal', function () { SS.revealed = true; App.views.vocab.render(document.getElementById('view')); });
  ui.on('vocab-grade', function (a) { gradeLearn(parseInt(a.val, 10)); });
  ui.on('vocab-next', function () { SS.i++; next(); });
  ui.on('vocab-answer', function (a) { SS.picked = a.el.getAttribute('data-id'); answerChoice(SS.picked); });
  ui.on('vocab-check', function () {
    var i = document.getElementById('spellInput');
    if (i) checkSpell(i.value);
  });
  ui.on('vocab-hint', function () { var i = document.getElementById('spellInput'); if (i && SS.q.word) i.value = SS.q.word.word.slice(0, 1); });
  ui.on('vocab-slow', function (a) { root.App.tts.speak(a.el.getAttribute('data-id'), { rate: 0.6 }); });
  ui.on('vocab-over', function (a) { manualGrade(parseInt(a.val, 10)); SS.i++; next(); });
  ui.on('vocab-markWrong', function (a) { srs.addWrong('word', a.id); U.toast('已加入错词本'); });
  ui.on('vocab-detail', function (a) {
    var w = vocab.byId(a.id); if (!w) return;
    var p = S.state.words[w.id];
    ui.modal(w.word + '  ' + w.phon,
      '<div class="mean big">' + U.esc(w.cn) + ' <span class="tag sm">' + U.esc(w.pos) + '</span></div>' +
      '<div class="ex-box"><div class="ex">' + U.esc(w.ex) + ui.speakBtn(w.ex) + '</div><div class="ex-cn">' + U.esc(w.exCn) + '</div></div>' +
      '<div class="row mini spread muted"><span>状态：' + (!p ? '未接触' : (p.mastered ? '已掌握' : '复习中 · 第 ' + p.reps + ' 次')) + '</span>' +
      '<span>下次复习：' + (p ? p.due : '—') + '</span></div>' +
      '<div class="row">' + ui.btn('朗读例句 🐢', 'speak', { id: w.ex }) + ui.btn('加入错词本', 'vocab-markWrong', { id: w.id }) + '</div>',
      ui.btn('关闭', 'close-modal', {}));
  });

  App.startVocab = start;
})(typeof window !== 'undefined' ? window : globalThis);
