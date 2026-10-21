/* ===========================================================
 * 语法模块：专题知识 → 随堂练 → 错题进入复习队列
 * =========================================================== */
(function (root) {
  'use strict';
  var App = root.App, U = App.util, S = App.store, ui = App.ui;

  var GS = { mode: 'list', topic: null, qi: 0, answers: [], phase: 'q', picked: null, input: '' };

  function qid(topicId, idx) { return topicId + ':' + idx; }

  function renderList(el) {
    var topics = root.App.GRAMMAR;
    var wrongCount = S.state.wrongbook.filter(function (x) { return x.kind === 'grammar'; }).length;
    el.innerHTML =
      ui.card('<div class="row spread"><b>语法专题</b>' + ui.muted(topics.length + ' 讲 · 共 ' + topics.reduce(function (a, t) { return a + t.quiz.length; }, 0) + ' 题') + '</div>' +
        '<p class="muted">针对雅思写作 GRA 与口语句法设计：每讲含 5 道随堂练习，错题自动排队复习。</p>') +
      (wrongCount ? ui.card('<div class="row spread"><div><b>语法错题</b><br><span class="muted">' + wrongCount + ' 题待巩固</span></div>' +
        ui.btn('立刻重做', 'grammar-practiceWrong', { cls: 'primary' }) + '</div>') : '') +
      '<div class="topic-grid">' + topics.map(function (t, i) {
        var done = t.quiz.filter(function (q, j) { return (S.state.grammar[qid(t.id, j)] || {}).ok; }).length;
        return '<div class="topic-card" data-act="grammar-open" data-id="' + t.id + '">' +
          '<div class="row spread"><span class="tag sm">' + U.esc(t.level) + '</span><span class="muted">' + done + '/' + t.quiz.length + '</span></div>' +
          '<b>' + U.esc(t.title) + '</b>' +
          '<p class="muted">' + U.esc(t.brief.slice(0, 46)) + '…</p>' +
          ui.bar(done / t.quiz.length * 100) +
          '</div>';
      }).join('') + '</div>';
  }

  function renderTopic(el) {
    var t = GS.topic;
    el.innerHTML =
      '<div class="row spread"><button class="btn sm ghost" data-act="grammar-back">← 返回列表</button>' +
      '<span class="tag">' + U.esc(t.level) + '</span></div>' +
      ui.card('<h3 class="h">' + U.esc(t.title) + '</h3><p class="lead">' + U.esc(t.brief) + '</p>' +
        '<div class="points">' + t.points.map(function (p) {
          return '<div class="point"><b>' + U.esc(p.t) + '</b><span>' + U.esc(p.d) + '</span></div>';
        }).join('') + '</div>') +
      ui.card('<div class="row spread"><b>随堂练习</b>' + ui.muted(t.quiz.length + ' 题') + '</div>' +
        '<p class="muted">提交后立即显示解析，错题自动进入复习队列。</p>' +
        ui.btn('开始练习 ' + t.quiz.length + ' 题', 'grammar-start', { cls: 'primary block' }));
  }

  function renderQuiz(el) {
    var t = GS.topic, q = t.quiz[GS.qi];
    if (!q) { renderSummary(el); return; }
    var total = t.quiz.length;
    el.innerHTML =
      '<div class="row spread"><button class="btn sm ghost" data-act="grammar-back">← 退出</button><span class="muted">' + (GS.qi + 1) + ' / ' + total + '</span></div>' +
      ui.bar(GS.qi / total * 100) +
      ui.card(
        '<div class="prompt">' + U.esc(q.q) + '</div>' +
        (q.type === 'choice'
          ? '<div class="opts">' + q.options.map(function (o) {
            var cls = '';
            if (GS.phase === 'fb') {
              var ans = q.options[q.a];
              if (o === ans) cls = ' right'; else if (o === GS.picked) cls = ' wrong';
            }
            return '<button class="opt' + cls + '" data-act="grammar-answer" data-id="' + U.esc(o) + '">' + U.esc(o) + '</button>';
          }).join('') + '</div>'
          : '<div class="row"><input id="gInput" class="input" placeholder="填写答案后回车" value="' + U.esc(GS.input) + '">' +
          ui.btn('提交', 'grammar-fill', { cls: 'primary' }) + '</div>' +
          '<span class="muted mini">多个答案用 / 分隔也可接受</span>') +
        (GS.phase === 'fb'
          ? '<div class="fb ' + (GS.lastOk ? 'ok' : 'no') + '">' +
          '<div class="fb-head">' + (GS.lastOk ? '✅ 正确' : '❌ 正确答案：' + U.esc(q.type === 'choice' ? q.options[q.a] : String(q.a[0]))) + '</div>' +
          '<div class="reason">' + U.esc(q.ex) + '</div>' +
          (q.type === 'fill' ? '<div class="row center-row">' + ui.btn('就当我会（不算错）', 'grammar-credit', { cls: 'sm' }) + '</div>' : '') +
          '<div class="row center-row">' + ui.btn(GS.qi === total - 1 ? '查看结果 →' : '下一题 →', 'grammar-next', { cls: 'primary' }) + '</div>' +
          '</div>'
          : '')
      );
    if (q.type === 'fill') {
      var inp = document.getElementById('gInput');
      if (inp) { inp.focus(); inp.onkeydown = function (e) { if (e.key === 'Enter') ui.fire('grammar-fill', inp); }; }
    }
  }

  function renderSummary(el) {
    var ok = GS.answers.filter(Boolean).length, total = GS.answers.length;
    el.innerHTML = ui.card('<div class="center"><div class="done-ico">' + (ok === total ? '🎯' : '📘') + '</div>' +
      '<h3>' + U.esc(GS.topic.title) + ' · 完成</h3>' +
      '<div class="stat-row"><div><b>' + ok + '</b><span>正确</span></div><div><b>' + (total - ok) + '</b><span>错误</span></div><div><b>' + Math.round(ok / total * 100) + '%</b><span>正确率</span></div></div>' +
      '<div class="row center-row">' + ui.btn('再做一次', 'grammar-start', { cls: 'primary' }) + ui.btn('返回列表', 'grammar-back', {}) + '</div></div>');
  }

  App.views = App.views || {};
  App.views.grammar = {
    title: '语法', icon: '✍️',
    render: function (el) {
      if (GS.mode === 'topic') renderTopic(el);
      else if (GS.mode === 'quiz' || GS.mode === 'summary') renderQuiz(el);
      else renderList(el);
    }
  };

  function grade(okAnswer) {
    var t = GS.topic, q = t.quiz[GS.qi], id = qid(t.id, GS.qi);
    var st = S.state.grammar[id] || { ok: 0, wrong: 0, due: U.today() };
    if (okAnswer) {
      st.ok = 1; st.wrong = Math.max(0, (st.wrong || 0) - 1);
      if (st.wrong === 0) st.due = U.addDays(U.today(), 7);
      App.srs.clearWrong('grammar', id);
      S.bump('quiz');
    } else {
      st.wrong = (st.wrong || 0) + 1; st.ok = 0; st.due = U.today();
      App.srs.addWrong('grammar', id, U.esc(t.title) + '：' + U.esc(q.q).slice(0, 30));
      S.bump('review');
    }
    S.state.grammar[id] = st; S.save();
  }

  ui.on('grammar-open', function (a) {
    GS.topic = root.App.GRAMMAR.filter(function (t) { return t.id === a.id; })[0];
    GS.mode = 'topic'; App.views.grammar.render(document.getElementById('view'));
  });
  ui.on('grammar-back', function () { GS.mode = 'list'; GS.topic = null; App.views.grammar.render(document.getElementById('view')); });
  ui.on('grammar-start', function (a) {
    if (!GS.topic) return;
    GS.mode = 'quiz'; GS.qi = 0; GS.answers = []; GS.phase = 'q'; GS.input = '';
    App.views.grammar.render(document.getElementById('view'));
  });
  ui.on('grammar-answer', function (a) {
    if (GS.phase === 'fb') return;
    var t = GS.topic, q = t.quiz[GS.qi];
    GS.picked = a.el.getAttribute('data-id');
    GS.lastOk = GS.picked === q.options[q.a];
    GS.phase = 'fb';
    GS.answers[GS.qi] = GS.lastOk;
    grade(GS.lastOk);
    App.views.grammar.render(document.getElementById('view'));
  });
  ui.on('grammar-fill', function (a) {
    if (GS.phase === 'fb') return;
    var t = GS.topic, q = t.quiz[GS.qi];
    var val = String((a.el && a.el.value) || document.getElementById('gInput').value || '').trim().toLowerCase();
    GS.input = val;
    var expects = q.a.map(function (x) { return x.toLowerCase(); });
    GS.lastOk = expects.some(function (e) { return val === e || (e.indexOf(' ') > 0 && val.indexOf(e) >= 0); });
    GS.phase = 'fb'; GS.answers[GS.qi] = GS.lastOk;
    grade(GS.lastOk);
    App.views.grammar.render(document.getElementById('view'));
  });
  ui.on('grammar-credit', function () {
    GS.lastOk = true; GS.answers[GS.qi] = true; grade(true);
    App.views.grammar.render(document.getElementById('view'));
  });
  ui.on('grammar-next', function () {
    GS.qi++;
    if (GS.qi >= GS.topic.quiz.length) { GS.mode = 'summary'; App.views.grammar.render(document.getElementById('view')); return; }
    GS.phase = 'q'; GS.input = ''; GS.picked = null;
    App.views.grammar.render(document.getElementById('view'));
  });
  ui.on('grammar-practiceWrong', function () {
    var entries = S.state.wrongbook.filter(function (x) { return x.kind === 'grammar'; });
    if (!entries.length) return U.toast('没有语法错题');
    GS.mode = 'quiz';
    GS.topic = { id: 'review', title: '语法错题重做', quiz: [] };
    GS.topic.quiz = entries.map(function (e) {
      var parts = e.id.split(':');
      var t = root.App.GRAMMAR.filter(function (x) { return x.id === parts[0]; })[0];
      return t ? t.quiz[parseInt(parts[1], 10)] : null;
    }).filter(Boolean);
    if (!GS.topic.quiz.length) return U.toast('错题数据已失效');
    GS.qi = 0; GS.answers = []; GS.phase = 'q';
    App.views.grammar.render(document.getElementById('view'));
  });

  App.grammarSession = GS;
})(typeof window !== 'undefined' ? window : globalThis);
