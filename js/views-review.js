/* ===========================================================
 * 今日 / 复习队列 / 学习报告 / 设置
 * =========================================================== */
(function (root) {
  'use strict';
  var App = root.App, U = App.util, S = App.store, srs = App.srs, ui = App.ui;

  /* ---------------- 今日 ---------------- */
  function todayCtx() {
    var deck = S.state.settings.deck;
    var due = srs.dueWords(deck === 'all' ? null : deck);
    var newW = App.vocab.all(deck).filter(function (w) { return !S.state.words[w.id]; });
    var gw = S.state.wrongbook.filter(function (x) { return x.kind === 'grammar'; });
    var spw = S.state.wrongbook.filter(function (x) { return x.kind === 'speak'; });
    var wbW = S.state.wrongbook.filter(function (x) { return x.kind === 'word'; });
    return { due: due, newW: newW, gw: gw, spw: spw, wbW: wbW };
  }

  App.views = App.views || {};
  App.views.today = {
    title: '今日', icon: '🏠',
    render: function (el) {
      var c = todayCtx(), st = S.state;
      var day = S.day();
      var goal = st.settings.dailyGoal || 40;
      var doneScore = day.learn + day.review + day.quiz * 2;
      var hour = new Date().getHours();
      var hi = hour < 6 ? '夜深了' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
      var sessions = st.sessions.slice(-5).reverse();

      el.innerHTML =
        ui.card('<div class="hero">' +
          '<div class="hero-txt"><b>' + hi + (st.profile.name ? '，' + U.esc(st.profile.name) : '') + '</b>' +
          '<span class="muted">目标：雅思 + 海外求职　|　连续打卡 ' + S.streak() + ' 天</span></div>' +
          ui.ring(doneScore / goal * 100, doneScore + '/' + goal, '今日进度') +
          '</div>' +
          '<div class="stat-row">' +
          '<div><b>' + day.learn + '</b><span>新学</span></div>' +
          '<div><b>' + day.review + '</b><span>复习</span></div>' +
          '<div><b>' + day.speak + '</b><span>口语练习</span></div>' +
          '<div><b>' + U.round1(day.minutes) + '</b><span>分钟</span></div>' +
          '</div>') +
        ui.card('<b>今天该做什么</b>' +
          '<div class="task-grid">' +
          '<div class="task"><span class="t-ico">🆕</span><b>学新词</b><i>' + c.newW.length + ' 词未学</i>' + ui.btn('开始', 'vocab-start', { val: 'learn', cls: 'primary sm' }) + '</div>' +
          '<div class="task"><span class="t-ico">🔁</span><b>到期复习</b><i>' + c.due.length + ' 词</i>' + ui.btn('开始', 'vocab-start', { val: 'review', cls: 'primary sm' }) + '</div>' +
          '<div class="task"><span class="t-ico">🎙️</span><b>情景口语</b><i>6 个真实场景</i>' + ui.btn('去练习', 'go', { val: '#/speaking', cls: 'primary sm' }) + '</div>' +
          '<div class="task"><span class="t-ico">🎧</span><b>影子跟读</b><i>' + root.App.PASSAGES.length + ' 篇素材</i>' + ui.btn('去跟读', 'goShadow', { cls: 'primary sm' }) + '</div>' +
          '<div class="task"><span class="t-ico">🏅</span><b>能力测评</b><i>' + ((S.state.exams || []).length ? '已测 ' + (S.state.exams.length) + ' 次' : '尚未测评') + '</i>' + ui.btn('去测评', 'go', { val: '#/exam', cls: 'primary sm' }) + '</div>' +
          '<div class="task"><span class="t-ico">✍️</span><b>语法</b><i>' + c.gw.length + ' 道错题</i>' + ui.btn('去练习', 'go', { val: '#/grammar', cls: 'primary sm' }) + '</div>' +
          '<div class="task"><span class="t-ico">📕</span><b>错词本</b><i>' + c.wbW.length + ' 词</i>' + ui.btn('查看', 'go', { val: '#/review', cls: 'primary sm' }) + '</div>' +
          '</div>') +
        '<div class="grid2">' +
        (sessions.length ? ui.card('<b>最近口语成绩</b>' + sessions.map(function (s) {
          return '<div class="row spread mini"><span class="muted">' + U.esc(s.title.slice(0, 22)) + '</span>' +
            '<b class="' + (s.overall >= 7 ? 'ok-c' : s.overall >= 6 ? '' : 'bad-c') + '">' + s.overall + '</b></div>';
        }).join('')) : '') +
        ui.card('<b>雅思口语评分参照</b>' +
          '<div class="ref"><span><b>9</b> 接近母语</span><span><b>7</b> 能流利表达、偶有误用</span>' +
          '<span><b>6</b> 能持续讲话、结构有限</span><span><b>5</b> 需重复、停顿多</span></div>' +
          '<p class="muted mini">AI 老师按 Fluency / Vocabulary / Grammar / Pronunciation 四项分别给分，总分为四项均值。</p>') +
        '</div>';
    }
  };

  /* ---------------- 复习 ---------------- */
  App.views.review = {
    title: '复习', icon: '🔁',
    render: function (el) {
      var c = todayCtx();
      el.innerHTML =
        ui.card('<div class="row spread"><div><b>待复习单词</b><br><span class="muted">按遗忘曲线到期 ' + c.due.length + ' 个</span></div>' +
          (c.due.length ? ui.btn('开始复习', 'vocab-start', { val: 'review', cls: 'primary' }) : '<span class="tag ok">今日清空 ✓</span>') + '</div>') +
        (c.wbW.length ? ui.card('<div class="row spread"><div><b>错词本</b><br><span class="muted">' + c.wbW.length + ' 词</span></div>' +
          ui.btn('专项练习', 'vocab-startWrong', { cls: 'primary' }) + '</div>' +
          '<div class="wrong-list">' + c.wbW.slice(0, 12).map(function (x) {
            var w = App.vocab.byId(x.id);
            return w ? '<span class="chip static" data-act="vocab-detail" data-id="' + w.id + '">' + U.esc(w.word) + ' <i>' + U.esc(w.cn) + '</i><em>×' + x.count + '</em></span>' : '';
          }).join('') + '</div>') : '') +
        (c.gw.length ? ui.card('<div class="row spread"><div><b>语法错题</b><br><span class="muted">' + c.gw.length + ' 题</span></div>' +
          ui.btn('重做错题', 'grammar-practiceWrong', { cls: 'primary' }) + '</div>' +
          '<div class="wrong-list">' + c.gw.slice(0, 8).map(function (x) {
            return '<span class="chip static">' + U.esc((x.note || '').slice(0, 28)) + '<em>×' + x.count + '</em></span>';
          }).join('') + '</div>') : '') +
        (c.spw.length ? ui.card('<div class="row spread"><div><b>口语待纠句式</b><br><span class="muted">' + c.spw.length + ' 句，匹配度低于 70%</span></div>' + '</div>' +
          '<div class="wrong-list">' + c.spw.slice(0, 10).map(function (x) {
            return '<span class="chip static drill" data-act="review-drill" data-id="' + U.esc(x.id) + '">' + U.esc((x.note || '').slice(0, 40)) + '…' +
              '<em>重练</em></span>';
          }).join('') + '</div>') : '') +
        ui.card('<b>间隔重复机制</b><p class="muted">SM-2 算法：认识 → 间隔 1→3→7→21 天递增；答错 → 立即重排并降低难度系数。这保证你每天只复习「刚好要忘」的那部分内容。</p>');
    }
  };

  ui.on('review-drill', function (a) {
    var entry = S.state.wrongbook.filter(function (x) { return x.id === a.el.getAttribute('data-id'); })[0];
    if (!entry) return;
    var sentence = entry.note || '';
    var id = 'rp:' + entry.id;
    var exist = root.App.PASSAGES.filter(function (p) { return p.id === id; })[0];
    if (!exist) {
      exist = {
        id: id, title: '弱句重练', source: '来自你的口语错句本', accent: 'en-US', level: '练习',
        intro: '逐句重练直到匹配度 ≥ 90%', sentences: [sentence], vocab: []
      };
      root.App.PASSAGES.unshift(exist);
    }
    App.speakSession.tab = 'shadow';
    App.speakSession.shadow = { mode: 'run', pid: id, idx: 0, res: null, whole: false };
    App.speakSession.free.res = null;
    App.router.go('#/speaking');
    if (S.state.settings.autoSpeak) App.tts.speak(sentence, {});
  });

  ui.on('go', function (a) { App.router.go(a.val); });
  ui.on('goShadow', function () {
    App.speakSession.tab = 'shadow';
    App.speakSession.shadow = { mode: 'list', pid: null, idx: 0, res: null, whole: false };
    App.router.go('#/speaking');
  });

  /* ---------------- 报告 ---------------- */
  App.views.stats = {
    title: '报告', icon: '📊',
    render: function (el) {
      var st = S.state, days = [], i, k;
      for (i = 6; i >= 0; i--) days.push(U.addDays(U.today(), -i));
      var maxV = 1;
      var rows = days.map(function (d) {
        var v = st.days[d] || { learn: 0, review: 0, speak: 0, quiz: 0 };
        var tot = v.learn + v.review + v.quiz || 0;
        maxV = Math.max(maxV, tot, v.speak * 5);
        return { d: d, v: v, tot: tot };
      });

      var sessions = st.sessions.slice(-20);
      var chart = '';
      if (sessions.length >= 2) {
        var pts = sessions.map(function (s, idx) {
          var x = 10 + idx * (620 / Math.max(1, sessions.length - 1));
          var y = 90 - (s.overall / 9) * 80;
          return x.toFixed(1) + ',' + y.toFixed(1);
        }).join(' ');
        chart = '<svg class="line" viewBox="0 0 640 100" preserveAspectRatio="none">' +
          '<line x1="10" y1="10" x2="630" y2="10" class="grid-l"/>' +
          '<line x1="10" y1="90" x2="630" y2="90" class="grid-l"/>' +
          '<polyline points="' + pts + '" fill="none" stroke="#4f46e5" stroke-width="2.5"/>' +
          sessions.map(function (s, idx) {
            var x = 10 + idx * (620 / Math.max(1, sessions.length - 1));
            var y = 90 - (s.overall / 9) * 80;
            return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.5" fill="#4f46e5"/>';
          }).join('') + '</svg>' +
          '<div class="row spread muted mini"><span>' + sessions[0].date.slice(5) + '</span><span>9.0</span><span>' + sessions[sessions.length - 1].date.slice(5) + '</span></div>';
      }

      var vst = App.vocab.stats('all');
      var avgAll = sessions.length ? U.round1(sessions.reduce(function (a, s) { return a + s.overall; }, 0) / sessions.length) : 0;
      var topWrong = st.wrongbook.slice().sort(function (a, b) { return b.count - a.count; }).slice(0, 8);

      el.innerHTML =
        ui.card('<b>近 7 天学习量</b><div class="bars">' + rows.map(function (r) {
          return '<div class="bar-col"><i style="height:' + (r.tot / maxV * 100) + '%" title="词/题 ' + r.tot + '"></i>' +
            '<i class="s" style="height:' + (r.v.speak * 5 / maxV * 100) + '%" title="口语 ' + r.v.speak + ' 次"></i>' +
            '<span>' + r.d.slice(8) + '</span></div>';
        }).join('') + '</div>' +
          '<div class="row mini muted"><span class="legend"></span>蓝＝单词/语法练习次数　绿＝口语练习次数（×5 显示）</div>') +
        '<div class="grid2">' +
        ui.card('<b>词库掌握度</b>' +
          '<div class="dim-row"><span>已背词</span>' + ui.bar(vst.seen / vst.total * 100) + '<b>' + vst.seen + '/' + vst.total + '</b></div>' +
          '<div class="dim-row"><span>已长期记忆</span>' + ui.bar(vst.mastered / vst.total * 100) + '<b>' + vst.mastered + '</b></div>' +
          '<p class="muted mini">掌握标准：连续复习到 21 天以上间隔。</p>') +
        ui.card('<b>口语总览</b>' +
          '<div class="stat-row"><div><b>' + sessions.length + '</b><span>练习次数</span></div>' +
          '<div><b>' + avgAll + '</b><span>平均分</span></div>' +
          '<div><b>' + st.wrongbook.filter(function (x) { return x.kind === 'speak'; }).length + '</b><span>待纠句</span></div></div>' +
          (chart || '<p class="muted">完成 2 次以上口语练习后显示趋势图。</p>')) +
        '</div>' +
        (topWrong.length ? ui.card('<b>高频失分点</b><div class="wrong-list">' + topWrong.map(function (x) {
          var w = App.vocab.byId(x.id);
          return '<span class="chip static">' + (w ? U.esc(w.word) + ' <i>' + U.esc(w.cn) + '</i>' : U.esc((x.note || x.id).slice(0, 24))) + '<em>×' + x.count + '</em></span>';
        }).join('') + '</div>') : '') +
        (sessions.length ? ui.card('<b>练习记录</b><div class="rec-list">' + sessions.slice().reverse().slice(0, 10).map(function (s) {
          return '<div class="row spread mini"><span class="muted">' + s.date.slice(5) + ' · ' + U.esc(s.title.slice(0, 26)) + '</span>' +
            '<b>' + s.overall + '</b></div>';
        }).join('') + '</div>') : '');
    }
  };

  /* ---------------- 设置 ---------------- */
  App.views.settings = {
    title: '设置', icon: '⚙️',
    render: function (el) {
      var st = S.state.settings, llm = st.llm;
      el.innerHTML =
        ui.card('<b>学习计划</b>' +
          '<div class="form-row"><label>每日目标（词/题）</label><input class="input" type="number" min="10" max="200" value="' + st.dailyGoal + '" data-change="set-goal"></div>' +
          '<div class="form-row"><label>称呼</label><input class="input" value="' + U.esc(S.state.profile.name || '') + '" placeholder="比如 David / 小王" data-change="set-name"></div>') +
        ui.card('<b>语音设置</b>' +
          '<div class="form-row"><label>发音口音</label><select class="input" data-change="set-accent">' +
          '<option value="en-US"' + (st.accent === 'en-US' ? ' selected' : '') + '>美式 en-US</option>' +
          '<option value="en-GB"' + (st.accent === 'en-GB' ? ' selected' : '') + '>英式 en-GB</option></select></div>' +
          '<div class="form-row"><label>朗读语速 ' + st.rate + 'x</label><input type="range" min="0.5" max="1.3" step="0.05" value="' + st.rate + '" data-change="set-rate"></div>' +
          '<div class="form-row"><label>自动朗读</label><input type="checkbox"' + (st.autoSpeak ? ' checked' : '') + ' data-change="set-auto"></div>' +
          '<div class="row center-row">' + ui.btn('试听一句', 'speak', { id: 'Good morning, thanks for making the time today.', cls: 'sm' }) + '</div>' +
          '<p class="muted mini">浏览器支持的音色数量有限，Chrome + Windows/macOS 质量最好。</p>') +
        ui.card('<b>AI 深度点评（可选·需 API Key）</b>' +
          '<p class="muted">不填也能用：本地引擎已完成流利度/词汇/语法/发音打分。填了之后，「报告」里会出现大模型给出的逐句精批与润色版本。</p>' +
          '<div class="form-row"><label>启用</label><input type="checkbox"' + (llm.enabled ? ' checked' : '') + ' data-change="llm-enabled"></div>' +
          '<div class="form-row"><label>Base URL</label><input class="input" value="' + U.esc(llm.baseUrl) + '" data-change="llm-base"></div>' +
          '<div class="form-row"><label>API Key</label><input class="input" type="password" value="' + U.esc(llm.apiKey) + '" placeholder="sk-…" data-change="llm-key"></div>' +
          '<div class="form-row"><label>模型</label><input class="input" value="' + U.esc(llm.model) + '" data-change="llm-model"></div>' +
          '<p class="muted mini">支持任何 OpenAI 兼容接口（含 DeepSeek、通义、月之暗面、本地 Ollama 等）。Key 只存在你本机浏览器。</p>') +
        ui.card('<b>内容更新</b>' +
          '<p class="muted">单词、跟读素材、情景脚本、视频包都以「内容包」形式下发，打开应用时自动检查；本地 file:// 打开时不联网，仅使用内置与已缓存内容。</p>' +
          '<div class="row spread mini"><span>当前内容版本</span><b>v' + App.content.state.version + '</b></div>' +
          '<div class="row spread mini"><span>上次更新</span><b>' + (App.content.state.updatedAt || '尚未更新') + '</b></div>' +
          '<div class="row spread mini"><span>已缓存内容包</span><b>' + App.content.state.packCount + ' 个（+词汇 ' + App.extra.vocab.length + ' 条 / +视频 ' + App.extra.videos.length + ' 个）</b></div>' +
          '<div class="form-row"><label>内容源地址</label><input class="input" value="' + U.esc(st.contentSource || './') + '" placeholder="默认 ./（与本应用同目录）" data-change="set-source"></div>' +
          '<div class="row wrap">' + ui.btn('立即检查更新', 'content-check', { cls: 'primary sm' }) +
          ui.btn('清空内容缓存', 'content-reset', { cls: 'sm' }) + '</div>') +
        ui.card('<b>数据</b><p class="muted">全部学习记录保存在本机 localStorage，不上传任何服务器。</p>' +
          '<div class="row wrap">' + ui.btn('导出备份 JSON', 'set-export', { cls: 'sm' }) +
          '<label class="btn sm ghost">导入备份<input type="file" accept="application/json" hidden data-change="set-import"></label>' +
          ui.btn('清空全部数据', 'set-reset', { cls: 'sm danger' }) + '</div>') +
        ui.card('<b>关于</b><p class="muted">VocaBridge · 雅思 + 海外求职版。题库与素材均为内置/原创仿写；情景脚本、语法规则、评分维度按 IELTS Speaking 标准设计。</p>' +
          '<p class="muted mini">建议用 Chrome / Edge 打开以获得语音识别（ASR）能力；Safari 部分支持，可在打字模式下使用。</p>');
    }
  };

  ui.on('set-goal', function (a) { S.state.settings.dailyGoal = parseInt(a.el.value, 10) || 40; S.save(); });
  ui.on('set-name', function (a) { S.state.profile.name = a.el.value.trim(); S.save(); });
  ui.on('set-accent', function (a) { S.state.settings.accent = a.el.value; S.save(); App.tts.speak('Hello, this is a quick test.', { accent: a.el.value }); });
  ui.on('set-rate', function (a) { S.state.settings.rate = parseFloat(a.el.value); S.save(); App.views.settings.render(document.getElementById('view')); App.tts.speak('Rate test.', { rate: parseFloat(a.el.value) }); });
  ui.on('set-auto', function (a) { S.state.settings.autoSpeak = a.el.checked; S.save(); });
  ui.on('llm-enabled', function (a) { S.state.settings.llm.enabled = a.el.checked; S.save(); U.toast(a.el.checked ? '已启用大模型点评' : '已关闭'); });
  ui.on('llm-base', function (a) { S.state.settings.llm.baseUrl = a.el.value.trim(); S.save(); });
  ui.on('llm-key', function (a) { S.state.settings.llm.apiKey = a.el.value.trim(); S.save(); });
  ui.on('llm-model', function (a) { S.state.settings.llm.model = a.el.value.trim(); S.save(); });
  ui.on('set-source', function (a) { S.state.settings.contentSource = a.el.value.trim(); S.save(); });
  ui.on('content-check', function () {
    U.toast('正在检查内容更新…');
    App.content.check().then(function (r) {
      U.toast(r.message || (r.updated ? '更新成功' : '已是最新'));
      App.views.settings.render(document.getElementById('view'));
    });
  });
  ui.on('content-reset', function () {
    App.content.reset();
    U.toast('内容缓存已清空，刷新页面后生效');
    App.views.settings.render(document.getElementById('view'));
  });
  ui.on('set-export', function () {
    var blob = new Blob([S.exportJSON()], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vocabridge-backup-' + U.today() + '.json';
    a.click(); U.toast('已导出备份');
  });
  ui.on('set-import', function (a) {
    var f = a.el.files && a.el.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      if (S.importJSON(rd.result)) { U.toast('导入成功'); App.router.go('#/today'); }
      else U.toast('文件格式不正确');
    };
    rd.readAsText(f);
  });
  ui.on('set-reset', function () {
    ui.modal('确认清空？', '<p class="muted">所有学习进度、错词本、口语记录都会被删除，无法恢复。</p>',
      ui.btn('确认清空', 'set-reset2', { cls: 'danger' }) + ui.btn('取消', 'close-modal', {}));
  });
  ui.on('set-reset2', function () { S.reset(); ui.closeModal(); App.router.go('#/today'); U.toast('已清空'); });
})(typeof window !== 'undefined' ? window : globalThis);
