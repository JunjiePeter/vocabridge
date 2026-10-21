/* ===========================================================
 * 口语模块：情景模拟 / 影子跟读 / 自由陈述 + AI 评分老师
 * =========================================================== */
(function (root) {
  'use strict';
  var App = root.App, U = App.util, S = App.store, ui = App.ui;
  var tts = App.tts, asr = App.asr;

  var CUES = [
    { t: 'Why should we hire you?', b: ['Your value proposition', 'Evidence, not adjectives', 'What you deliver in month one', 'Close with a question'] },
    { t: 'Describe a time you learned something quickly.', b: ['Situation / Task', 'What you had to learn', 'How you learned it', 'Result & what stuck'] },
    { t: 'Describe a difficult decision you made.', b: ['Context', 'Options you weighed', 'Why you chose it', 'What happened next'] },
    { t: 'Describe a career-related achievement.', b: ['The target', 'What you did differently', 'Quantified outcome', 'What you learned'] },
    { t: 'Describe a person who influenced your career.', b: ['Who they are', 'How you met', 'Their impact on you', 'What changed afterwards'] },
    { t: 'Describe a city you would like to work in.', b: ['Where & why', 'Job opportunities', 'Cost of living vs salary', 'What worries you'] },
    { t: 'Tell me about a project that failed.', b: ['What went wrong', 'Your part in it', 'How you responded', 'The lesson'] },
    { t: 'Describe a time you disagreed with someone.', b: ['Their position', 'Your argument', 'Evidence you used', 'Resolution'] },
    { t: 'Talk about a big change in your industry.', b: ['What changed', 'Why it happened', 'Who benefits', 'Your prediction'] },
    { t: 'Describe an app or tool you rely on.', b: ['What it does', 'How you use it', 'Pros and cons', 'Who it suits'] },
    { t: 'Where do you want to be in five years?', b: ['Skills you want', 'Type of role', 'Type of team', 'How you will get there'] },
    { t: 'Describe a place you have studied or worked in.', b: ['Description', 'Atmosphere', 'People', 'Why it suited (or not)'] }
  ];

  var SP = {
    tab: 'roleplay',
    role: null,        // {sc, idx, log:[], done:false}
    shadow: { mode: 'list', pid: null, idx: 0, res: null, whole: false },
    video: { mode: 'list', vid: null, idx: 0, res: null },
    free: { mode: 'list', cue: null, res: null },
    rec: { active: false, startedAt: 0, timer: null, maxMs: 60000, url: null, cb: null },
    textMode: !asr.supported()
  };

  /* ---------------- 录音控制 ---------------- */
  function updateRecUI() {
    var st = document.getElementById('recStatus');
    if (!st) return;
    var sec = Math.round((Date.now() - SP.rec.startedAt) / 1000);
    st.textContent = '● 录音中 ' + sec + 's  （最长 ' + Math.round(SP.rec.maxMs / 1000) + 's）';
  }

  function startRec(maxSec, cb) {
    if (SP.rec.active) return;
    SP.rec.active = true; SP.rec.startedAt = Date.now(); SP.rec.url = null;
    SP.rec.maxMs = (maxSec || 60) * 1000; SP.rec.cb = cb;
    updateRecUI();
    SP.rec.timer = setInterval(function () {
      updateRecUI();
      if (Date.now() - SP.rec.startedAt >= SP.rec.maxMs) stopRec();
    }, 250);
    if (!SP.textMode) {
      App.recorder.start().catch(function () { });
      asr.start({
        lang: 'en-US',
        onPartial: function (full) {
          var p = document.getElementById('recPartial');
          if (p) p.textContent = full || '（还没识别到内容…）';
        },
        onError: function (err) {
          if (err === 'not-allowed') { SP.textMode = true; U.toast('麦克风未授权，已切换打字模式'); }
        }
      });
    }
    App.views.speaking.render(document.getElementById('view'));
  }

  function stopRec() {
    if (!SP.rec.active) return;
    SP.rec.active = false;
    clearInterval(SP.rec.timer);
    var cb = SP.rec.cb; SP.rec.cb = null;
    var dur = Date.now() - SP.rec.startedAt;
    var wrap = function (text, segs) {
      App.recorder.stop().then(function (url) { if (url) SP.rec.url = url; });
      App.views.speaking.render(document.getElementById('view'));
      if (cb) cb(text, { durationMs: dur, segments: segs || [] });
    };
    if (!SP.textMode) {
      asr.stop();
      setTimeout(function () { wrap(SP.rec._final || '', SP.rec._segs || []); }, 400);
    } else {
      var ta = document.getElementById('textAnswer');
      wrap(ta ? ta.value.trim() : '', []);
    }
  }

  // 包裹 asr.start 收集最终结果
  (function wrapAsr() {
    var origStart = asr.start;
    asr.start = function (opt) {
      var o2 = {}, k;
      for (k in (opt || {})) o2[k] = opt[k];
      var prevEnd = o2.onEnd;
      o2.onEnd = function (finalText, segs, dur) {
        SP.rec._final = finalText || '';
        SP.rec._segs = segs || [];
        if (prevEnd) prevEnd(finalText, segs, dur);
      };
      SP.rec._final = ''; SP.rec._segs = [];
      return origStart(o2);
    };
  })();

  /* ---------------- 评分与报告 ---------------- */
  function saveSession(type, title, res) {
    S.state.sessions.push({
      date: U.today(), type: type, title: title,
      overall: res.scores.overall, scores: res.scores,
      words: res.metrics.words, errors: res.errors.length
    });
    if (S.state.sessions.length > 120) S.state.sessions.shift();
    S.bump('speak');
    S.save();
  }

  function reportHtml(res, opt) {
    opt = opt || {};
    var sc = res.scores;
    var dims = [
      { k: '流利度 Fluency', v: sc.fluency, d: res.metrics.wpm + ' wpm · 填充词 ' + res.metrics.fillerCount },
      { k: '词汇 Lexical', v: sc.vocabulary, d: res.lexis.uniq + ' 个不同词 · TTR ' + res.lexis.ttr.toFixed(2) },
      { k: '语法 Grammar', v: sc.grammar, d: res.errors.length + ' 处疑似问题 · 从句 ' + res.metrics.subordinates },
      { k: '发音 Pronunciation', v: sc.pronunciation, d: res.pronunciation ? '匹配度 ' + Math.round(res.pronunciation.accuracy * 100) + '%' : '未提供参考文本' }
    ];
    return '<div class="report">' +
      '<div class="report-head">' +
      '<div class="band"><b>' + (sc.overall % 1 ? sc.overall.toFixed(1) : sc.overall) + '</b><span>Overall Band</span></div>' +
      '<div class="band-dims">' + dims.map(function (d) {
        var val = d.v == null ? '—' : (d.v % 1 ? d.v.toFixed(1) : d.v);
        return '<div class="dim"><div class="row spread"><span>' + d.k + '</span><b>' + val + '</b></div>' +
          ui.bar((d.v || 0) / 9 * 100) + '<span class="muted mini">' + d.d + '</span></div>';
      }).join('') + '</div>' +
      '</div>' +
      (res.text ? '<div class="transcript"><b>你的回答：</b><p>' + U.esc(res.text) + '</p>' +
        (SP.rec.url ? '<audio controls src="' + SP.rec.url + '"></audio>' : '') + '</div>' : '') +
      (res.errors.length ? '<div class="corr"><b>AI 老师纠错（' + res.errors.length + '）</b>' +
        res.errors.slice(0, 8).map(function (c) {
          return '<div class="corr-item ' + c.type + '">' +
            '<div class="row"><span class="badge ' + c.type + '">' + (c.type === 'grammar' ? '语法' : '词汇') + '</span>' +
            '<code class="no">“' + U.esc(c.original) + '”</code> → <code class="yes">' + U.esc(c.suggestion) + '</code></div>' +
            '<p class="muted">' + U.esc(c.reason) + '</p></div>';
        }).join('') + '</div>' : '<div class="corr ok-box">✅ 本次未检测到明显语法/搭配错误。</div>') +
      (res.lexis.suggestions.length ? '<div class="corr"><b>词汇升级建议</b>' +
        res.lexis.suggestions.slice(0, 6).map(function (c) {
          return '<div class="corr-item lexis"><div class="row"><code class="no">“' + U.esc(c.original) + '”</code> → <code class="yes">' + U.esc(c.suggestion) + '</code></div></div>';
        }).join('') + '</div>' : '') +
      (res.pronunciation && (res.pronunciation.missed.length || res.pronunciation.substituted.length)
        ? '<div class="corr"><b>发音待修正</b>' +
        (res.pronunciation.missed.length ? '<p class="muted">漏读/未识别：' + res.pronunciation.missed.map(function (w) { return '<code class="no">' + U.esc(w) + '</code>'; }).join(' ') + '</p>' : '') +
        (res.pronunciation.substituted.length ? '<p class="muted">发音偏差：' + res.pronunciation.substituted.map(function (s) { return '<code class="no">' + U.esc(s.ref) + '</code> 听成了 ' + '<code class="no">' + U.esc(s.got) + '</code>'; }).join('、') + '</p>' : '') +
        '</div>' : '') +
      '<div class="tips"><b>下一步建议</b><ul>' + res.tips.map(function (t) { return '<li>' + U.esc(t) + '</li>'; }).join('') + '</ul></div>' +
      (opt.deepBtn !== false ? '<div class="row center-row">' +
        (S.state.settings.llm.enabled && S.state.settings.llm.apiKey
          ? ui.btn('✨ 让 GPT 再点评一遍', 'sp-deep', { cls: 'primary' })
          : '<span class="muted mini">在「设置」中填写 API Key，可解锁大模型逐句精批</span>') +
        '</div>' : '') +
      '<div id="deepBox"></div>' +
      '</div>';
  }

  /* ---------------- 情景模拟 ---------------- */
  function renderRole(el) {
    if (!SP.role) {
      el.innerHTML =
        ui.card('<b>情景模拟</b><p class="muted">扮演求职者，与 AI 面试官全流程对话。每个回答都会被打分（流利度 / 词汇 / 语法 / 发音），结束后出整体评估与逐条纠错。</p>') +
        '<div class="sc-grid">' + root.App.SCENARIOS.map(function (s) {
          return '<div class="sc-card" data-act="sp-roleOpen" data-id="' + s.id + '">' +
            '<div class="sc-ico">' + s.icon + '</div>' +
            '<div class="sc-body"><b>' + U.esc(s.title) + '</b>' +
            '<span class="tag sm">' + U.esc(s.level) + '</span>' +
            '<p class="muted">' + U.esc(s.desc) + '</p></div></div>';
        }).join('') + '</div>' +
        (SP.textMode ? ui.card('<b>提示</b><p class="muted">当前浏览器不支持语音识别（建议用 Chrome / Edge / Safari），已切换为<b>打字模式</b>：直接在文本框里用英文作答，评分逻辑完全一致。</p>') : '');
      return;
    }

    var r = SP.role, sc = r.sc;
    var node = sc.nodes[r.idx];
    var html = '<div class="row spread"><button class="btn sm ghost" data-act="sp-roleExit">← 退出</button>' +
      '<span class="tag">' + U.esc(sc.title) + ' · ' + (r.idx + 1) + '/' + sc.nodes.length + '</span></div>' +
      ui.bar(r.idx / sc.nodes.length * 100) +
      '<div class="chat" id="chat">' + r.log.map(function (m) {
        if (m.who === 'ai') {
          return '<div class="bub ai"><div class="bub-txt">' + U.esc(m.text) + '</div>' +
            '<div class="bub-act"><button class="spk" data-act="speak" data-id="' + U.esc(m.text) + '" data-accent="' + sc.accent + '">🔊 重听</button></div></div>';
        }
        return '<div class="bub me"><div class="bub-txt">' + U.esc(m.text) + '</div>' +
          '<div class="bub-act"><span class="mini-score">' + (m.score ? '本次 ' + m.score.toFixed(1) : '') + '</span></div></div>';
      }).join('') + '</div>';

    if (r.done) {
      html += r.reportHtml;
      html += '<div class="row center-row">' + ui.btn('重来一次', 'sp-roleRestart', { cls: 'primary' }) +
        ui.btn('换个场景', 'sp-roleExit', {}) + '</div>';
    } else if (SP.rec.active) {
      html += '<div class="card rec-box">' +
        '<div class="q-tip"><b>' + U.esc(node.q) + '</b></div>' +
        '<div id="recStatus" class="rec-status">● 录音中…</div>' +
        '<div id="recPartial" class="rec-partial muted"></div>' +
        ui.btn('■ 停止并评分', 'sp-stop', { cls: 'danger block' }) + '</div>';
    } else {
      html += '<div class="card">' +
        '<div class="q-tip"><b>面试官：</b>' + U.esc(node.q) +
        '<span class="spk" data-act="speak" data-id="' + U.esc(node.q) + '" data-accent="' + sc.accent + '">🔊</span></div>' +
        '<details class="tipbox"><summary>💡 回答提示</summary><p class="muted">' + U.esc(node.tip) + '</p></details>' +
        (SP.textMode
          ? '<textarea id="textAnswer" class="input area" placeholder="Type your answer in English…"></textarea>' +
          '<div class="row center-row">' + ui.btn('提交并评分', 'sp-textSubmit', { cls: 'primary' }) + '</div>'
          : '<div class="row center-row">' + ui.btn('🎤 开始回答（点击后再说）', 'sp-start', { cls: 'primary mic-lg', val: '90' }) +
          ui.btn('跳过这题', 'sp-skip', {}) + '</div>' +
          '<p class="muted mini center">点击后开始录音，最长 90 秒，说完点「停止并评分」。</p>') +
        '</div>';
    }
    el.innerHTML = html;
    var c = document.getElementById('chat');
    if (c) setTimeout(function () { c.scrollTop = c.scrollHeight; }, 20);
  }

  function roleAnswer(text, meta) {
    var r = SP.role, sc = r.sc, node = sc.nodes[r.idx];
    if (!text || text.length < 2) {
      U.toast('没听清内容，再说一遍试试');
      App.views.speaking.render(document.getElementById('view'));
      return;
    }
    var res = App.eval.analyze({ text: text, durationMs: meta.durationMs, segments: meta.segments });
    r.log.push({ who: 'me', text: text, score: res.scores.overall });
    r.results = r.results || [];
    r.results.push(res);
    r.comments = r.comments || [];

    // 即时点评：挑最严重的一条
    var top = res.errors[0] || res.lexis.suggestions[0];
    if (top) {
      r.log.push({
        who: 'ai',
        text: 'Got it. Quick note though — you said “' + top.original + '”, which we’d more naturally say “' + top.suggestion + '”. Keep going.'
      });
      speakLast(sc.accent);
    } else if (probe(node, text)) {
      r.log.push({ who: 'ai', text: probe(node, text) });
      speakLast(sc.accent);
    } else {
      r.log.push({ who: 'ai', text: node.ack || 'Thanks.' });
      speakLast(sc.accent);
    }

    App.views.speaking.render(document.getElementById('view'));

    // 最后一题 → 生成报告；否则切到下一题（问题只在卡片区显示，不重复进对话流）
    if (r.idx >= sc.nodes.length - 1) {
      setTimeout(function () { finishRole(); }, 400);
    } else {
      setTimeout(function () {
        r.idx++;
        App.views.speaking.render(document.getElementById('view'));
        if (S.state.settings.autoSpeak) tts.speak(sc.nodes[r.idx].q, { accent: sc.accent });
      }, 1100);
    }
  }

  function speakLast(accent) {
    if (!S.state.settings.autoSpeak) return;
    var last = SP.role.log[SP.role.log.length - 1];
    if (last && last.who === 'ai') tts.speak(last.text, { accent: accent });
  }

  function probe(node, text) {
    var low = ' ' + text.toLowerCase() + ' ';
    for (var i = 0; i < (node.probes || []).length; i++) {
      var p = node.probes[i];
      for (var j = 0; j < p.m.length; j++) {
        if (low.indexOf(p.m[j].toLowerCase()) >= 0) return p.say;
      }
    }
    return null;
  }

  function finishRole() {
    var r = SP.role, sc = r.sc, list = r.results || [];
    if (!list.length) return;
    var texts = list.map(function (x) { return x.text; }).join(' ');
    var agg = App.eval.analyze({ text: texts, durationMs: list.reduce(function (a, x) { return a + (x.metrics.minutes * 60000); }, 0) });
    agg.errors = [].concat.apply([], list.map(function (x) { return x.errors; }));
    var avg = function (k) {
      return U.toHalf(list.reduce(function (a, x) { return a + (x.scores[k] || 0); }, 0) / list.length);
    };
    agg.scores = {
      fluency: avg('fluency'), vocabulary: avg('vocabulary'), grammar: avg('grammar'),
      pronunciation: list[0].hasPronunciation ? null : null,
      overall: U.toHalf(list.reduce(function (a, x) { return a + x.scores.overall; }, 0) / list.length)
    };
    SP.role.reportHtml = reportHtml(agg);
    SP.role.done = true;
    saveSession('role', sc.title, agg);
    // 最弱的一句话进复习队列
    var worst = list.slice().sort(function (a, b) { return a.scores.overall - b.scores.overall; })[0];
    if (worst && worst.scores.overall < 6.5) {
      App.srs.addWrong('speak', sc.id + ':' + SP.role.log.length, worst.text.slice(0, 80));
    }
    tts.speak(sc.outro, { accent: sc.accent });
    SP.role.log.push({ who: 'ai', text: sc.outro });
    App.views.speaking.render(document.getElementById('view'));
  }

  /* ---------------- 影子跟读 ---------------- */
  function renderShadow(el) {
    var P = root.App.PASSAGES;
    if (SP.shadow.mode === 'list') {
      el.innerHTML = ui.card('<b>影子跟读</b><p class="muted">原声播放 → 你跟读 → 逐词对齐评分，漏读、错读、替代词全部标出。素材为<b>原创仿写文本</b>（新闻播报 / 剧集台词 / 演讲 / 雅思范文风格）。</p>') +
        '<div class="psg-grid">' + P.map(function (p) {
          var pr = S.state.speak['p:' + p.id];
          return '<div class="psg-card" data-act="sp-shadowOpen" data-id="' + p.id + '">' +
            '<div class="row spread"><span class="tag sm">' + U.esc(p.level) + '</span><span class="tag sm">' + (p.accent === 'en-GB' ? '英音' : '美音') + '</span></div>' +
            '<b>' + U.esc(p.title) + '</b>' +
            '<p class="muted">' + U.esc(p.source) + '</p>' +
            '<div class="row spread mini muted"><span>' + p.sentences.length + ' 句</span>' +
            (pr ? '<span>最佳 ' + Math.round(pr.best * 100) + '%</span>' : '<span>未练习</span>') + '</div>' +
            '</div>';
        }).join('') + '</div>';
      return;
    }

    var p = P.filter(function (x) { return x.id === SP.shadow.pid; })[0];
    if (!p) { SP.shadow.mode = 'list'; return renderShadow(el); }

    if (SP.shadow.whole) {
      el.innerHTML = '<div class="row spread"><button class="btn sm ghost" data-act="sp-shadowExit">← 返回素材</button><span class="tag">' + U.esc(p.title) + ' · 全文跟读</span></div>' +
        ui.card('<div class="lead">' + p.sentences.map(function (s) { return U.esc(s); }).join(' ') + '</div>' +
          '<div class="row center-row">' + ui.btn('🔊 常速播放全文', 'speak', { id: p.sentences.join(' ') }) +
          ui.btn('🐢 慢速', 'sp-slow', { id: p.sentences.join(' ') }) + '</div>' +
          '<p class="muted mini center">放完后再点跟读，整篇连读一遍即出报告。</p>') +
        (SP.rec.active
          ? '<div class="card rec-box"><div id="recStatus" class="rec-status">● 录音中…</div><div id="recPartial" class="rec-partial muted"></div>' + ui.btn('■ 停止并评分', 'sp-stop', { cls: 'danger block' }) + '</div>'
          : '<div class="row center-row">' + ui.btn('🎤 全文跟读', 'sp-start', { cls: 'primary mic-lg', val: '120' }) + '</div>') +
        (SP.textMode && !SP.rec.active
          ? '<textarea id="textAnswer" class="input area" placeholder="Type the whole passage…"></textarea>' +
          '<div class="row center-row">' + ui.btn('提交对照', 'sp-textSubmit', { cls: 'primary' }) + '</div>' : '') +
        (SP.shadow.res ? reportHtml(SP.shadow.res) : '');
      return;
    }

    var s = p.sentences[SP.shadow.idx];
    var done = SP.shadow.idx >= p.sentences.length;
    if (done) {
      var scores = [];
      p.sentences.forEach(function (_, i) { var k = S.state.speak['s:' + p.id + ':' + i]; if (k) scores.push(k.best); });
      var avg = scores.length ? U.round1(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) : 0;
      el.innerHTML = '<div class="row spread"><button class="btn sm ghost" data-act="sp-shadowExit">← 返回素材</button><span class="tag">跟读完成</span></div>' +
        ui.card('<div class="center"><div class="done-ico">🎧</div><h3>' + U.esc(p.title) + '</h3>' +
          '<div class="stat-row"><div><b>' + Math.round(avg * 100) + '%</b><span>平均匹配度</span></div>' +
          '<div><b>' + scores.length + '</b><span>已练句数</span></div></div>' +
          '<div class="row center-row">' + ui.btn('从头再练', 'sp-shadowRestart', { cls: 'primary' }) + ui.btn('换一篇', 'sp-shadowExit', {}) + '</div></div>');
      return;
    }

    el.innerHTML = '<div class="row spread"><button class="btn sm ghost" data-act="sp-shadowExit">← 返回素材</button>' +
      '<span class="tag">' + U.esc(p.title) + ' · ' + (SP.shadow.idx + 1) + '/' + p.sentences.length + '</span></div>' +
      ui.bar(SP.shadow.idx / p.sentences.length * 100) +
      ui.card(
        '<div class="shadow-sent">' + U.esc(s) + '</div>' +
        '<div class="row center-row">' +
        ui.btn('🔊 常速', 'speak', { id: s, cls: 'primary' }) +
        ui.btn('🐢 慢速 0.7x', 'sp-slow', { id: s }) +
        ui.btn('🐢 0.5x', 'sp-slow2', { id: s }) + '</div>' +
        '<p class="muted mini center">先听 2 遍 → 点跟读 → 尽量模仿语速与停顿（shadowing：延迟半拍贴着原声说）</p>' +
        '<div class="row center-row">' + ui.btn('📄 全文连读模式', 'sp-shadowWhole', { cls: 'ghost sm' }) + '</div>' +
        (SP.rec.active
          ? '<div class="card rec-box"><div id="recStatus" class="rec-status">● 录音中…</div><div id="recPartial" class="rec-partial muted"></div>' + ui.btn('■ 停止并评分', 'sp-stop', { cls: 'danger block' }) + '</div>'
          : '<div class="row center-row">' + ui.btn('🎤 跟读这一句', 'sp-start', { cls: 'primary mic-lg', val: '30' }) + '</div>') +
        (SP.textMode && !SP.rec.active
          ? '<textarea id="textAnswer" class="input area" placeholder="Type the sentence you just heard…"></textarea>' +
          '<div class="row center-row">' + ui.btn('提交对照', 'sp-textSubmit', { cls: 'primary' }) + '</div>' : '')
      ) +
      (SP.shadow.res ? reportHtml(SP.shadow.res) +
        '<div class="row center-row">' + ui.btn('再试一次', 'sp-start', { cls: '', val: '30' }) +
        ui.btn('下一句 →', 'sp-shadowNext', { cls: 'primary' }) + '</div>' : '') +
      ui.card('<details><summary>📚 本篇重点词</summary><div class="vocab-inline">' +
        p.vocab.map(function (v) { return '<span class="chip static">' + U.esc(v.w) + ' <i>' + U.esc(v.cn) + '</i></span>'; }).join('') +
        '</div></details>');
  }

  function shadowResult(text, meta) {
    var P = root.App.PASSAGES, p = P.filter(function (x) { return x.id === SP.shadow.pid; })[0];
    var ref = SP.shadow.whole ? p.sentences.join(' ') : p.sentences[SP.shadow.idx];
    var res = App.eval.analyze({ text: text, reference: ref, durationMs: meta.durationMs, segments: meta.segments });
    SP.shadow.res = res;
    var pct = res.pronunciation.accuracy;
    if (SP.shadow.whole) {
      saveSession('shadow', p.title + ' · 全文', res);
    } else {
      var key = 's:' + p.id + ':' + SP.shadow.idx;
      var prev = S.state.speak[key];
      S.state.speak[key] = { best: Math.max(prev ? prev.best : 0, pct), count: (prev ? prev.count : 0) + 1 };
      if (pct < 0.7) App.srs.addWrong('speak', key, ref.slice(0, 70)); else App.srs.clearWrong('speak', key);
      saveSession('shadow', p.title + ' · 句' + (SP.shadow.idx + 1), res);
      S.save();
    }
    App.views.speaking.render(document.getElementById('view'));
  }

  /* ---------------- 自由陈述 ---------------- */
  function renderFree(el) {
    if (SP.free.mode === 'list') {
      el.innerHTML = ui.card('<b>自由陈述 / Part 2 口述</b><p class="muted">抽一张话题卡，讲 1-2 分钟。系统会从流利度、词汇、语法三维度打分（含语音 → 文本），并揪出中式表达与可升级词汇。适合雅思 Part 2 与面试自我介绍。</p>' +
        '<div class="row center-row">' + ui.btn('🎲 随机抽题', 'sp-freeRandom', { cls: 'primary' }) + '</div>') +
        '<div class="cue-grid">' + CUES.map(function (c, i) {
          return '<div class="cue-card" data-act="sp-freeOpen" data-id="' + i + '"><b>' + U.esc(c.t) + '</b>' +
            '<ul>' + c.b.slice(0, 2).map(function (b) { return '<li>' + U.esc(b) + '</li>'; }).join('') + '</ul></div>';
        }).join('') + '</div>';
      return;
    }
    var c = SP.free.cue;
    if (!c) { SP.free.mode = 'list'; return renderFree(el); }
    el.innerHTML = '<div class="row spread"><button class="btn sm ghost" data-act="sp-freeExit">← 换话题</button><span class="tag">Part 2 · 口述 1-2 分钟</span></div>' +
      ui.card('<h3 class="h">' + U.esc(c.t) + '</h3>' +
        '<ul class="cue-bul">' + c.b.map(function (b) { return '<li>' + U.esc(b) + '</li>'; }).join('') + '</ul>' +
        '<div class="row center-row">' + ui.btn('🔊 朗读题目', 'speak', { id: c.t }) + '</div>') +
      (SP.rec.active
        ? '<div class="card rec-box"><div id="recStatus" class="rec-status">● 录音中…</div><div id="recPartial" class="rec-partial muted"></div>' + ui.btn('■ 停止并评分', 'sp-stop', { cls: 'danger block' }) + '</div>'
        : SP.textMode
          ? '<div class="card"><textarea id="textAnswer" class="input area" placeholder="Type your answer in English…"></textarea>' +
          '<div class="row center-row">' + ui.btn('提交并评分', 'sp-textSubmit', { cls: 'primary' }) + '</div></div>'
          : '<div class="card"><div class="row center-row">' + ui.btn('🎤 开始口述', 'sp-start', { cls: 'primary mic-lg', val: '150' }) + '</div>' +
          '<p class="muted mini center">最长 150 秒，建议讲到 Stop 为止都在展开细节。</p></div>') +
      (SP.free.res ? reportHtml(SP.free.res) : '');
  }

  function freeResult(text, meta) {
    var res = App.eval.analyze({ text: text, durationMs: meta.durationMs, segments: meta.segments });
    SP.free.res = res;
    saveSession('free', SP.free.cue.t, res);
    App.views.speaking.render(document.getElementById('view'));
  }

  /* ---------------- 视频跟读 ---------------- */
  function videoList() {
    return ((App.extra && App.extra.videos) || []).concat(S.state.customVideos || []);
  }

  function findVideo(id) {
    return videoList().filter(function (v) { return v.id === id; })[0] || null;
  }

  function renderVideo(el) {
    if (SP.video.mode === 'list') {
      var list = videoList();
      el.innerHTML =
        ui.card('<b>视频跟读</b><p class="muted">看视频逐句暂停、跟读、对照评分。支持内容热更新推送的视频包（含时间轴自动跳转），也可以粘贴自己的 MP4 链接 + 台词文本。</p>') +
        (list.length ? '<div class="psg-grid">' + list.map(function (v) {
          var pr = S.state.speak['v:' + v.id];
          return '<div class="psg-card" data-act="video-open" data-id="' + v.id + '">' +
            '<div class="row spread"><span class="tag sm">' + (v.type === 'mp4' ? 'MP4 · 时间轴' : '嵌入视频') + '</span>' +
            (pr ? '<span class="muted mini">最佳 ' + Math.round(pr.best * 100) + '%</span>' : '') + '</div>' +
            '<b>' + U.esc(v.title) + '</b>' +
            '<p class="muted">' + U.esc(v.source || '') + '</p>' +
            '<div class="row spread mini muted"><span>' + (v.sentences || []).length + ' 句</span><span>' + (v.custom ? '本地自定义' : '内容包') + '</span></div>' +
            '</div>';
        }).join('') + '</div>'
          : ui.card('<p class="muted">还没有视频素材。点下方添加，或到「设置 → 内容更新」检查新内容包。</p>')) +
        ui.card('<b>添加自定义视频</b>' +
          '<div class="form-row"><label>名称</label><input id="vName" class="input" placeholder="如：BBC 6 Minute English Ep.120"></div>' +
          '<div class="form-row"><label>视频地址</label><input id="vUrl" class="input" placeholder="https://…/xxx.mp4（直链 MP4 支持逐句自动跳转）"></div>' +
          '<div class="form-row"><label>台词文本</label><textarea id="vText" class="input area" placeholder="每行一句；可选带时间：0.0-4.5|Hello, and welcome back…"></textarea></div>' +
          '<div class="row center-row">' + ui.btn('保存并练习', 'video-add', { cls: 'primary' }) + '</div>' +
          '<p class="muted mini">自定义视频只保存在你本机浏览器；要写进内容包给别人用，见 README 的「内容热更新」一节。</p>');
      return;
    }

    var v = findVideo(SP.video.vid);
    if (!v) { SP.video.mode = 'list'; return renderVideo(el); }
    var sents = v.sentences || [];
    var cur = sents[SP.video.idx] || sents[0];

    var player = '';
    if (v.type === 'embed') {
      player = '<div class="video-wrap"><iframe src="' + U.esc(v.embedUrl || v.url) + '" allowfullscreen></iframe></div>' +
        '<p class="muted mini">嵌入视频无法自动逐句跳转，手动暂停后对应当前句跟读。</p>';
    } else if (v.url) {
      player = '<div class="video-wrap"><video id="vPlayer" controls playsinline preload="metadata" src="' + U.esc(v.url) + '"></video></div>';
    } else {
      player = '<div class="card"><p class="muted">该视频包未配置播放地址，仅提供台词跟读（点 ▶ 用系统语音播放）。</p></div>';
    }

    el.innerHTML = '<div class="row spread"><button class="btn sm ghost" data-act="video-back">← 返回列表</button>' +
      '<span class="tag">' + U.esc(v.title) + '</span></div>' +
      ui.card(player) +
      (cur ? ui.card('<div class="row spread"><b>第 ' + (SP.video.idx + 1) + ' / ' + sents.length + ' 句</b>' +
        (cur.start != null ? '<span class="muted mini">' + cur.start + 's – ' + cur.end + 's</span>' : '') + '</div>' +
        '<div class="shadow-sent">' + U.esc(cur.text) + '</div>' +
        '<div class="row center-row">' +
        (v.type !== 'embed' && v.url ? '<button class="btn primary" data-act="video-playSeg" data-id="' + SP.video.idx + '">▶ 播此句</button>' : '') +
        ui.btn('🔊 语音读', 'speak', { id: cur.text }) + ui.btn('🐢 慢速', 'sp-slow', { id: cur.text }) + '</div>' +
        (SP.rec.active
          ? '<div class="card rec-box"><div id="recStatus" class="rec-status">● 录音中…</div><div id="recPartial" class="rec-partial muted"></div>' + ui.btn('■ 停止并评分', 'sp-stop', { cls: 'danger block' }) + '</div>'
          : SP.textMode
            ? '<textarea id="textAnswer" class="input area" placeholder="Repeat this sentence here…"></textarea>' +
            '<div class="row center-row">' + ui.btn('提交对照', 'sp-textSubmit', { cls: 'primary' }) + '</div>'
            : '<div class="row center-row">' + ui.btn('🎤 跟读这一句', 'sp-start', { cls: 'primary mic-lg', val: '30' }) + '</div>')
      ) : '') +
      (SP.video.res ? reportHtml(SP.video.res) +
        '<div class="row center-row">' + ui.btn('再试一次', 'sp-start', { val: '30' }) +
        (SP.video.idx < sents.length - 1 ? ui.btn('下一句 →', 'video-next', { cls: 'primary' }) : ui.btn('完成', 'video-back', { cls: 'primary' })) + '</div>' : '') +
      ui.card('<b>全部台词</b><div class="wrong-list">' + sents.map(function (s, i) {
        return '<span class="chip static' + (i === SP.video.idx ? ' on' : '') + '" data-act="video-sel" data-id="' + i + '">' + (i + 1) + '. ' + U.esc(s.text.slice(0, 34)) + '…</span>';
      }).join('') + '</div>');
  }

  function videoResult(text, meta) {
    var v = findVideo(SP.video.vid);
    if (!v) return;
    var sents = v.sentences || [];
    var cur = sents[SP.video.idx];
    if (!cur) return;
    var res = App.eval.analyze({ text: text, reference: cur.text, durationMs: meta.durationMs, segments: meta.segments });
    SP.video.res = res;
    var pct = res.pronunciation ? res.pronunciation.accuracy : 0;
    var key = 'v:' + v.id;
    var prev = S.state.speak[key];
    S.state.speak[key] = { best: Math.max(prev ? prev.best : 0, pct), count: (prev ? prev.count : 0) + 1 };
    if (pct < 0.7) App.srs.addWrong('speak', key + ':' + SP.video.idx, cur.text.slice(0, 70)); else App.srs.clearWrong('speak', key + ':' + SP.video.idx);
    saveSession('video', v.title + ' · 句' + (SP.video.idx + 1), res);
    S.save();
    App.views.speaking.render(document.getElementById('view'));
  }

  /* ---------------- 视图入口 ---------------- */
  App.views = App.views || {};
  App.views.speaking = {
    title: '口语', icon: '🎙️',
    render: function (el) {
      var tabs = [{ id: 'roleplay', label: '情景模拟' }, { id: 'shadow', label: '影子跟读' }, { id: 'video', label: '视频跟读' }, { id: 'free', label: '自由陈述' }];
      el.innerHTML = ui.chips(tabs, 'sp-tab', SP.tab) + '<div id="spBody"></div>';
      var body = document.getElementById('spBody');
      if (SP.tab === 'roleplay') renderRole(body);
      else if (SP.tab === 'shadow') renderShadow(body);
      else if (SP.tab === 'video') renderVideo(body);
      else renderFree(body);
    }
  };
  App.speakSession = SP;

  /* ---------------- 事件 ---------------- */
  ui.on('sp-tab', function (a) {
    SP.tab = a.val;
    if (SP.rec.active) stopRec();
    App.views.speaking.render(document.getElementById('view'));
  });

  ui.on('sp-start', function (a) {
    var sec = parseInt(a.val || '60', 10);
    startRec(sec, function (text, meta) {
      if (SP.tab === 'roleplay') roleAnswer(text, meta);
      else if (SP.tab === 'shadow') shadowResult(text, meta);
      else if (SP.tab === 'video') videoResult(text, meta);
      else freeResult(text, meta);
    });
  });

  ui.on('sp-stop', function () { stopRec(); });

  ui.on('sp-textSubmit', function () {
    var ta = document.getElementById('textAnswer');
    var text = ta ? ta.value.trim() : '';
    var meta = { durationMs: Math.max(15000, text.split(/\s+/).length / 130 * 60000), segments: [] };
    if (!text) return U.toast('先输入你的英文回答');
    if (SP.tab === 'roleplay') roleAnswer(text, meta);
    else if (SP.tab === 'shadow') shadowResult(text, meta);
    else if (SP.tab === 'video') videoResult(text, meta);
    else freeResult(text, meta);
  });

  ui.on('sp-roleOpen', function (a) { openRole(a.id); });
  ui.on('sp-roleExit', function () { SP.role = null; App.views.speaking.render(document.getElementById('view')); });
  ui.on('sp-roleRestart', function () { if (SP.role) openRole(SP.role.sc.id); });

  function openRole(id) {
    var sc = root.App.SCENARIOS.filter(function (x) { return x.id === id; })[0];
    if (!sc) return;
    SP.role = { sc: sc, idx: 0, log: [{ who: 'ai', text: sc.intro }], done: false, results: [] };
    if (S.state.settings.autoSpeak) tts.speak(sc.intro, { accent: sc.accent });
    App.views.speaking.render(document.getElementById('view'));
  }

  ui.on('sp-skip', function () {
    var r = SP.role; if (!r) return;
    r.log.push({ who: 'ai', text: 'No problem — let’s move on.' });
    if (r.idx >= r.sc.nodes.length - 1) { finishRole(); return; }
    r.idx++; App.views.speaking.render(document.getElementById('view'));
  });

  ui.on('sp-shadowOpen', function (a) { SP.shadow.mode = 'run'; SP.shadow.pid = a.id; SP.shadow.idx = 0; SP.shadow.res = null; SP.shadow.whole = false; App.views.speaking.render(document.getElementById('view')); });
  ui.on('sp-shadowExit', function () { SP.shadow.mode = 'list'; SP.shadow.res = null; SP.shadow.whole = false; App.views.speaking.render(document.getElementById('view')); });
  ui.on('sp-shadowRestart', function () { SP.shadow.idx = 0; SP.shadow.res = null; App.views.speaking.render(document.getElementById('view')); });
  ui.on('sp-shadowNext', function () { SP.shadow.idx++; SP.shadow.res = null; App.views.speaking.render(document.getElementById('view')); });
  ui.on('sp-slow', function (a) { tts.speak(a.el.getAttribute('data-id'), { rate: 0.7 }); });
  ui.on('sp-slow2', function (a) { tts.speak(a.el.getAttribute('data-id'), { rate: 0.5 }); });
  ui.on('sp-shadowWhole', function (a) { SP.shadow.whole = true; SP.shadow.res = null; App.views.speaking.render(document.getElementById('view')); });

  /* 视频跟读事件 */
  ui.on('video-open', function (a) { SP.video.mode = 'run'; SP.video.vid = a.id; SP.video.idx = 0; SP.video.res = null; App.views.speaking.render(document.getElementById('view')); });
  ui.on('video-back', function () { SP.video.mode = 'list'; SP.video.res = null; App.views.speaking.render(document.getElementById('view')); });
  ui.on('video-sel', function (a) { SP.video.idx = parseInt(a.id, 10) || 0; SP.video.res = null; App.views.speaking.render(document.getElementById('view')); });
  ui.on('video-next', function () { SP.video.idx++; SP.video.res = null; App.views.speaking.render(document.getElementById('view')); });
  ui.on('video-playSeg', function (a) {
    var v = findVideo(SP.video.vid); if (!v || !v.url) return;
    var s = v.sentences[parseInt(a.id, 10)];
    var player = document.getElementById('vPlayer');
    if (!player) return;
    if (s.start != null) player.currentTime = s.start;
    player.play();
    if (s.end != null) {
      var stopAt = s.end;
      var onT = function () { if (player.currentTime >= stopAt) { player.pause(); player.removeEventListener('timeupdate', onT); } };
      player.addEventListener('timeupdate', onT);
    }
  });
  ui.on('video-add', function () {
    var name = (document.getElementById('vName') || {}).value || '';
    var url = (document.getElementById('vUrl') || {}).value || '';
    var txt = (document.getElementById('vText') || {}).value || '';
    if (!name.trim() || !txt.trim()) return U.toast('名称和台词不能为空');
    var sentences = txt.split('\n').map(function (line) {
      line = line.trim(); if (!line) return null;
      var m = line.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*\|\s*(.+)$/);
      if (m) return { start: parseFloat(m[1]), end: parseFloat(m[2]), text: m[3].trim() };
      return { text: line };
    }).filter(Boolean);
    if (!sentences.length) return U.toast('台词格式不正确');
    var type = /\.mp4(\?|$)/i.test(url) ? 'mp4' : (/youtube|bilibili|player\./i.test(url) ? 'embed' : (url ? 'mp4' : 'mp4'));
    var v = {
      id: 'c' + U.uid(), title: name.trim(), source: '自定义视频', custom: true,
      type: type, url: type === 'embed' ? '' : url.trim(), embedUrl: type === 'embed' ? url.trim() : '',
      sentences: sentences
    };
    S.state.customVideos = S.state.customVideos || [];
    S.state.customVideos.push(v); S.save();
    U.toast('已添加：' + v.title);
    App.views.speaking.render(document.getElementById('view'));
  });

  ui.on('sp-freeOpen', function (a) { SP.free.mode = 'run'; SP.free.cue = CUES[parseInt(a.id, 10)]; SP.free.res = null; App.views.speaking.render(document.getElementById('view')); });
  ui.on('sp-freeRandom', function () { ui.fire('sp-freeOpen', { getAttribute: function () { return String(Math.floor(Math.random() * CUES.length)); } }); });
  ui.on('sp-freeExit', function () { SP.free.mode = 'list'; SP.free.res = null; App.views.speaking.render(document.getElementById('view')); });

  ui.on('sp-deep', function () {
    var res = SP.free.res || SP.shadow.res || (SP.role && SP.role.done ? null : null);
    var text = (SP.free.res && SP.free.res.text) || (SP.shadow.res && SP.shadow.res.text) ||
      (SP.role && SP.role.results ? SP.role.results.map(function (r) { return r.text; }).join(' ') : '');
    if (!text) return U.toast('先完成一次口语练习');
    var box = document.getElementById('deepBox');
    if (box) box.innerHTML = '<div class="loading">AI 深度点评中…</div>';
    App.eval.deep({
      text: text,
      task: SP.tab === 'roleplay' ? (SP.role ? SP.role.sc.title : '') : (SP.tab === 'free' && SP.free.cue ? SP.free.cue.t : 'shadow reading'),
      scenario: SP.tab
    }).then(function (d) {
      if (box) {
        box.innerHTML = '<div class="corr"><b>✨ GPT 精批</b>' +
          (d.verdict ? '<p>' + U.esc(d.verdict) + '</p>' : '') +
          '<div class="row mini"><span class="badge">F ' + d.fluency + '</span><span class="badge">V ' + d.vocabulary + '</span><span class="badge">G ' + d.grammar + '</span><span class="badge">P ' + d.pronunciation + '</span><span class="badge ok">Overall ' + d.overall + '</span></div>' +
          (d.corrections || []).map(function (c) {
            return '<div class="corr-item"><div class="row"><code class="no">“' + U.esc(c.original) + '”</code> → <code class="yes">' + U.esc(c.suggestion) + '</code></div><p class="muted">' + U.esc(c.reason) + '</p></div>';
          }).join('') +
          (d.polishedVersion ? '<div class="polished"><b>润色后的版本</b><p>' + U.esc(d.polishedVersion) + '</p>' + ui.speakBtn(d.polishedVersion) + '</div>' : '') +
          '</div>';
      }
    }).catch(function (e) {
      if (box) box.innerHTML = '<div class="corr"><b>调用失败</b><p class="muted">' + U.esc(String(e.message || e)) + '。检查 Base URL / Key / 模型名，或暂时使用本地评分引擎。</p></div>';
    });
  });

  App.CUES = CUES;
})(typeof window !== 'undefined' ? window : globalThis);
