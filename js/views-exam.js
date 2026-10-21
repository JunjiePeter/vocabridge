/* ===========================================================
 * 英语能力测评（参考英语流利说测评方案）
 * 五个部分：词汇 20 / 语法 20 / 听力 20 / 阅读 20 / 口语 20 → 总分 100
 * 输出：总分 + CEFR 等级 + 雅思参考分 + 五维雷达图 + 针对性学习路径 + 历史对比
 * =========================================================== */
(function (root) {
  'use strict';
  var App = root.App, U = App.util, S = App.store, ui = App.ui;
  var tts = App.tts, asr = App.asr;

  var EX = { stage: 'intro', sections: [], si: 0, qi: 0, answers: {}, shadow: [], cue: null, rec: { active: false, timer: null, startedAt: 0, cb: null } };
  var SECS = [
    { key: 'vocab', label: '词汇', icon: '📖' },
    { key: 'grammar', label: '语法', icon: '✍️' },
    { key: 'listening', label: '听力', icon: '👂' },
    { key: 'reading', label: '阅读', icon: '📄' },
    { key: 'speaking', label: '口语', icon: '🎙️' }
  ];

  /* ---------------- 题目生成 ---------------- */
  function buildQuestions() {
    var ielts = App.vocab.all('ielts');
    var tiers = [ielts.slice(0, 60), ielts.slice(60, 120), ielts.slice(120)];
    var vocabQ = [];
    [3, 4, 3].forEach(function (n, t) {
      U.sample(tiers[t], n).forEach(function (w) {
        var others = U.sample(ielts.filter(function (x) { return x.id !== w.id; }), 3);
        var opts = U.shuffle([w.cn].concat(others.map(function (x) { return x.cn; })));
        vocabQ.push({ prompt: w.word, sub: w.phon, options: opts, answer: w.cn });
      });
    });

    var grammarQ = [];
    var topics = App.GRAMMAR;
    for (var i = 0; i < topics.length && grammarQ.length < 8; i += Math.max(1, Math.floor(topics.length / 8))) {
      var t = topics[i];
      var q = U.pick(t.quiz.filter(function (x) { return x.type === 'choice'; }));
      if (q) grammarQ.push({ prompt: q.q, options: q.options, answer: q.options[q.a], ex: q.ex, topic: t.title });
    }

    var shadowPool = [];
    App.PASSAGES.forEach(function (p) { p.sentences.forEach(function (s) { shadowPool.push({ ref: s, pid: p.id }); }); });
    var shadow = U.sample(shadowPool.filter(function (x) { return x.ref.split(/\s+/).length >= 8; }), 3);

    return {
      vocab: vocabQ,
      grammar: grammarQ.slice(0, 8),
      listening: App.EXAM_LISTENING,
      reading: App.EXAM_READING,
      shadow: shadow,
      cue: U.pick(App.CUES)
    };
  }

  /* ---------------- 分数与等级 ---------------- */
  function scoreToLevel(score) {
    if (score < 25) return { cefr: 'A1', ielts: '4.0', desc: '基础入门：能处理最简单的日常用语' };
    if (score < 40) return { cefr: 'A2', ielts: '5.0', desc: '初级：能完成熟悉的日常交流' };
    if (score < 55) return { cefr: 'B1', ielts: '5.5', desc: '中级：能独立处理多数日常与工作场景' };
    if (score < 70) return { cefr: 'B2', ielts: '6.5', desc: '中高级：能流畅就专业领域交流，距 7.0 一步之遥' };
    if (score < 85) return { cefr: 'C1', ielts: '7.0-7.5', desc: '高级：能自如应对学术与职场英语，符合海外招聘主流门槛' };
    return { cefr: 'C2', ielts: '8.0+', desc: '接近母语：可以放心冲 8 分或高阶面试' };
  }

  function recommend(parts) {
    var map = {
      vocab: { label: '词汇', tip: '每天 20 词新学 + 复习；先把「雅思核心」背完再攻「求职职场」。', link: '#/vocab' },
      grammar: { label: '语法', tip: '重点补「现在完成时 / 条件句 / 中式英语纠偏」三讲。', link: '#/grammar' },
      listening: { label: '听力', tip: '每天影子跟读 2 篇，先 0.7x 再常速。', link: '#/speaking' },
      reading: { label: '阅读', tip: '跟读素材自带长难句，读完做一遍全文复述。', link: '#/speaking' },
      speaking: { label: '口语', tip: '先把 6 个情景模拟全过一遍，再练自由陈述。', link: '#/speaking' }
    };
    return Object.keys(map).filter(function (k) { return parts[k] < 65; })
      .sort(function (a, b) { return parts[a] - parts[b]; }).map(function (k) { return map[k]; });
  }

  /* ---------------- 录音 ---------------- */
  function recStart(sec, cb) {
    if (EX.rec.active) return;
    EX.rec.active = true; EX.rec.startedAt = Date.now(); EX.rec.cb = cb;
    EX.rec.timer = setInterval(function () {
      var el = document.getElementById('exRecStatus');
      if (el) el.textContent = '● 录音中 ' + Math.round((Date.now() - EX.rec.startedAt) / 1000) + 's';
      if (Date.now() - EX.rec.startedAt >= sec * 1000) recStop();
    }, 250);
    App.views.exam.render(document.getElementById('view'));
    if (asr.supported()) {
      asr.start({
        lang: 'en-US',
        onPartial: function (full) {
          var p = document.getElementById('exRecPartial');
          if (p) p.textContent = full;
        },
        onEnd: function (finalText) { EX.rec._final = finalText; },
        onError: function () { EX.textMode = true; }
      });
    } else { EX.textMode = true; }
  }

  function recStop() {
    if (!EX.rec.active) return;
    EX.rec.active = false;
    clearInterval(EX.rec.timer);
    var cb = EX.rec.cb; EX.rec.cb = null;
    var dur = Date.now() - EX.rec.startedAt;
    if (EX.textMode) {
      var ta = document.getElementById('exTextAnswer');
      cb((ta ? ta.value : '').trim(), dur);
    } else {
      asr.stop();
      setTimeout(function () { cb((EX.rec._final || '').trim(), dur); }, 400);
    }
  }

  /* ---------------- 渲染 ---------------- */
  function renderIntro(el) {
    var last = (S.state.exams || []).slice(-1)[0];
    var hist = (S.state.exams || []).slice(-4).reverse();
    el.innerHTML =
      ui.card('<b>英语能力测评</b>' +
        '<p class="muted">参考流利说测评方案，五个部分各 20 分：词汇 → 语法 → 听力 → 阅读 → 口语。约 12-15 分钟，结束后给出 CEFR 等级、雅思参考分和针对性学习路径。</p>' +
        '<div class="sec-row">' + SECS.map(function (s) {
          return '<span class="chip static">' + s.icon + ' ' + s.label + '</span>';
        }).join('') + '</div>' +
        '<div class="row center-row">' + ui.btn('开始测评', 'exam-start', { cls: 'primary' }) + '</div>' +
        '<p class="muted mini center">建议戴耳机、保持安静，口语环节需允许麦克风权限。</p>') +
      (last ? ui.card('<b>历史测评</b>' +
        hist.map(function (e) {
          var lv = scoreToLevel(e.overall);
          return '<div class="row spread mini"><span class="muted">' + e.date + '</span>' +
            '<span><b>' + e.overall + '</b> 分 · ' + lv.cefr + '（雅思约 ' + lv.ielts + '）</span></div>';
        }).join('')) : '') +
      ui.card('<p class="muted mini">评分仅供参考：词/法/听/读为客观题判分；口语由本地 AI 引擎（流利度/词汇/语法/发音）换算。想更准，可在设置中接入大模型。</p>');
  }

  function sectionLen(key) {
    var qs = EX.sections;
    if (!qs) return 1;
    if (key === 'vocab') return qs.vocab.length;
    if (key === 'grammar') return qs.grammar.length;
    if (key === 'listening') return qs.listening.length;
    if (key === 'reading') return qs.reading.questions.length;
    return qs.shadow.length + 1;
  }

  function renderSection(el) {
    var sec = SECS[EX.si], qs = EX.sections, key = sec.key;
    var len = sectionLen(key);
    var head = '<div class="row spread"><span class="tag">' + sec.icon + ' ' + sec.label + ' ' + (EX.qi + 1) + '/' + len + '</span>' +
      '<span class="muted mini">第 ' + (EX.si + 1) + ' 部分 / 共 ' + SECS.length + ' 部分</span></div>' +
      ui.bar((EX.si * 100 + EX.qi / len * 100) / SECS.length);

    if (key === 'reading') {
      var r = qs.reading, q = r.questions[EX.qi];
      el.innerHTML = head +
        ui.card('<b>' + U.esc(r.title) + '</b><div class="passage">' + U.esc(r.passage).split('\n\n').map(function (p) { return '<p>' + p + '</p>'; }).join('') +
          '<button class="spk" data-act="speak" data-id="' + U.esc(r.passage.replace(/\n+/g, ' ')) + '">🔊 朗读全文</button></div>') +
        choiceCard(q, 'exam-reading');
      return;
    }

    if (key === 'listening') {
      var l = qs.listening[EX.qi];
      el.innerHTML = head +
        ui.card('<div class="center" style="margin:6px 0"><div class="q-tip">👂 听句子，选出正确理解</div>' +
          '<div class="row center-row">' + ui.btn('▶ 播放', 'exam-listenPlay', { id: l.id, cls: 'primary' }) +
          ui.btn('🐢 慢速', 'exam-listenSlow', { id: l.id }) + '</div>' +
          (EX.showListenText ? '<div class="ex-box"><div class="ex">' + U.esc(l.text) + '</div><div class="ex-cn">' + U.esc(l.cn) + '</div></div>' : '') +
          '</div>') +
        choiceCard({ prompt: l.q, options: l.options, answer: l.options[l.a] }, 'exam-listening');
      if (!EX._played || EX._played !== l.id) { EX._played = l.id; setTimeout(function () { tts.speak(l.text, { rate: 0.95 }); }, 300); }
      return;
    }

    if (key === 'speaking') { renderSpeaking(el, head); return; }

    // vocab / grammar
    var list = key === 'vocab' ? qs.vocab : qs.grammar;
    el.innerHTML = head + choiceCard(list[EX.qi], 'exam-answer');
  }

  function choiceCard(q, act) {
    return ui.card(
      '<div class="prompt">' + U.esc(q.prompt) + '</div>' +
      (q.sub ? '<div class="muted mini">' + U.esc(q.sub) + '</div>' : '') +
      (q.topic ? '<div class="muted mini">考点：' + U.esc(q.topic) + '</div>' : '') +
      '<div class="opts">' + q.options.map(function (o) {
        return '<button class="opt" data-act="' + act + '" data-id="' + U.esc(o) + '">' + U.esc(o) + '</button>';
      }).join('') + '</div>');
  }

  function renderSpeaking(el, head) {
    var qs = EX.sections;
    var total = qs.shadow.length + 1;
    if (EX.qi < qs.shadow.length) {
      var s = qs.shadow[EX.qi];
      el.innerHTML = head +
        ui.card('<div class="q-tip"><b>跟读第 ' + (EX.qi + 1) + ' / ' + qs.shadow.length + ' 句</b></div>' +
          '<div class="shadow-sent">' + U.esc(s.ref) + '</div>' +
          '<div class="row center-row">' + ui.btn('▶ 常速', 'speak', { id: s.ref, cls: 'primary' }) +
          ui.btn('🐢 0.7x', 'sp-slow', { id: s.ref }) + '</div>' +
          (EX.rec.active
            ? '<div class="card rec-box"><div id="exRecStatus" class="rec-status">● 录音中…</div><div id="exRecPartial" class="rec-partial muted"></div>' + ui.btn('■ 停止', 'exam-recStop', { cls: 'danger block' }) + '</div>'
            : EX.textMode
              ? '<textarea id="exTextAnswer" class="input area" placeholder="Repeat the sentence here…"></textarea>' +
              '<div class="row center-row">' + ui.btn('提交', 'exam-textSubmit', { cls: 'primary' }) + '</div>'
              : '<div class="row center-row">' + ui.btn('🎤 跟读', 'exam-recStart', { cls: 'primary mic-lg', val: '25' }) + '</div>') +
          (EX.shadowLast != null ? '<p class="muted center">上一句匹配度：<b>' + Math.round(EX.shadowLast * 100) + '%</b></p>' : ''));
      return;
    }
    // 自由口语
    var c = qs.cue;
    el.innerHTML = head +
      ui.card('<div class="q-tip"><b>自由口述（45 秒）</b></div>' +
        '<div class="shadow-sent">' + U.esc(c.t) + '</div>' +
        '<ul class="cue-bul">' + c.b.map(function (b) { return '<li>' + U.esc(b) + '</li>'; }).join('') + '</ul>' +
        (EX.rec.active
          ? '<div class="card rec-box"><div id="exRecStatus" class="rec-status">● 录音中…</div><div id="exRecPartial" class="rec-partial muted"></div>' + ui.btn('■ 停止', 'exam-recStop', { cls: 'danger block' }) + '</div>'
          : EX.textMode
            ? '<textarea id="exTextAnswer" class="input area" placeholder="Speak or type your answer…"></textarea>' +
            '<div class="row center-row">' + ui.btn('提交', 'exam-textSubmit', { cls: 'primary' }) + '</div>'
            : '<div class="row center-row">' + ui.btn('🎤 开始口述', 'exam-recStart', { cls: 'primary mic-lg', val: '45' }) + '</div>'));
  }

  function radar(parts) {
    var keys = ['vocab', 'grammar', 'listening', 'reading', 'speaking'];
    var labels = { vocab: '词汇', grammar: '语法', listening: '听力', reading: '阅读', speaking: '口语' };
    var cx = 130, cy = 110, R = 80, n = keys.length;
    function pt(i, r) {
      var ang = -Math.PI / 2 + i * 2 * Math.PI / n;
      return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
    }
    var rings = [0.25, 0.5, 0.75, 1].map(function (f) {
      return '<polygon points="' + keys.map(function (_, i) { return pt(i, R * f).join(','); }).join(' ') + '" fill="none" stroke="#e7e9f2"/>';
    }).join('');
    var axes = keys.map(function (_, i) {
      var p = pt(i, R); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="#e7e9f2"/>';
    }).join('');
    var poly = keys.map(function (k, i) { return pt(i, R * U.clamp(parts[k], 0, 100) / 100).join(','); }).join(' ');
    var labs = keys.map(function (k, i) {
      var p = pt(i, R + 16);
      return '<text x="' + p[0] + '" y="' + p[1] + '" text-anchor="middle" font-size="11" fill="#3b4058">' + labels[k] + '</text>';
    }).join('');
    return '<svg viewBox="0 0 260 230" class="radar">' + rings + axes +
      '<polygon points="' + poly + '" fill="rgba(79,70,229,.25)" stroke="#4f46e5" stroke-width="2"/>' + labs + '</svg>';
  }

  function renderResult(el) {
    var p = EX.parts;
    var overall = Math.round((p.vocab + p.grammar + p.listening + p.reading + p.speaking) / 5);
    var lv = scoreToLevel(overall);
    var prev = (S.state.exams || []).slice(-1)[0];
    var delta = prev ? overall - prev.overall : null;
    var recs = recommend(p);

    // 保存历史
    (S.state.exams = S.state.exams || []).push({ date: U.today(), overall: overall, parts: p, cefr: lv.cefr });
    if (S.state.exams.length > 12) S.state.exams.shift();
    S.save();

    el.innerHTML =
      ui.card('<div class="center"><div class="done-ico">🏅</div>' +
        '<h3>测评总分 ' + overall + ' / 100</h3>' +
        '<div class="row center-row">' +
        '<span class="tag">' + lv.cefr + '</span>' +
        '<span class="tag">雅思约 ' + lv.ielts + '</span>' +
        (delta != null ? '<span class="tag ' + (delta >= 0 ? 'ok' : '') + '">较上次 ' + (delta >= 0 ? '+' : '') + delta + '</span>' : '') +
        '</div>' +
        '<p class="muted">' + lv.desc + '</p></div>') +
      ui.card('<b>五维雷达</b>' + radar(p) +
        '<div class="stat-row">' + ['vocab', 'grammar', 'listening', 'reading', 'speaking'].map(function (k) {
          var name = { vocab: '词汇', grammar: '语法', listening: '听力', reading: '阅读', speaking: '口语' }[k];
          return '<div><b>' + Math.round(p[k]) + '</b><span>' + name + '</span></div>';
        }).join('') + '</div>') +
      (EX.speakReport ? ui.card('<b>口语细评</b><div class="mini muted">' +
        '跟读匹配度 ' + Math.round(EX.shadowAvg * 100) + '%　自由口述 Band ' + EX.speakReport.scores.overall +
        '</div>' + (EX.speakReport.errors.length ? '<div class="corr">' + EX.speakReport.errors.slice(0, 5).map(function (c) {
          return '<div class="corr-item"><div class="row"><code class="no">“' + U.esc(c.original) + '”</code> → <code class="yes">' + U.esc(c.suggestion) + '</code></div></div>';
        }).join('') + '</div>' : '')) : '') +
      ui.card('<b>下一步怎么练</b>' +
        (recs.length ? recs.map(function (r) {
          return '<div class="mode-item"><div><b>' + r.label + '（' + Math.round(p[{ vocab: 'vocab', grammar: 'grammar', listening: 'listening', reading: 'reading', speaking: 'speaking' }[r.label] || 'vocab'] || 0) + '）</b><p class="muted">' + r.tip + '</p></div>' +
            ui.btn('去练习', 'go', { val: r.link, cls: 'primary sm' }) + '</div>';
        }).join('') : '<p class="muted">五维全部 ≥ 65，状态很好，直接进入「情景模拟」刷面试话术。</p>')) +
      '<div class="row center-row">' + ui.btn('再测一次', 'exam-start', {}) + ui.btn('回到今日', 'go', { val: '#/today', cls: 'primary' }) + '</div>';
  }

  App.views = App.views || {};
  App.views.exam = {
    title: '测评', icon: '🏅',
    render: function (el) {
      if (EX.stage === 'run') renderSection(el);
      else if (EX.stage === 'result') renderResult(el);
      else renderIntro(el);
    }
  };

  function advance() {
    var sec = SECS[EX.si], len = sectionLen(sec.key);
    EX.qi++; EX.showListenText = false;
    if (EX.qi >= len) { EX.si++; EX.qi = 0; }
    if (EX.si >= SECS.length) { finish(); return; }
    App.views.exam.render(document.getElementById('view'));
  }

  function finish() {
    var qs = EX.sections, a = EX.answers;
    var parts = {
      vocab: a.vocab.filter(Boolean).length / qs.vocab.length * 100,
      grammar: a.grammar.filter(Boolean).length / qs.grammar.length * 100,
      listening: a.listening.filter(Boolean).length / qs.listening.length * 100,
      reading: a.reading.filter(Boolean).length / qs.reading.questions.length * 100,
      speaking: Math.round(EX.shadowAvg * 100 * 0.5 + EX.freeScore * 0.5)
    };
    EX.parts = parts;
    EX.stage = 'result';
    App.views.exam.render(document.getElementById('view'));
  }

  ui.on('exam-start', function () {
    EX.stage = 'run'; EX.si = 0; EX.qi = 0; EX.shadowLast = null;
    EX.sections = buildQuestions();
    EX.answers = { vocab: [], grammar: [], listening: [], reading: [] };
    EX.textMode = !asr.supported();
    App.views.exam.render(document.getElementById('view'));
  });

  function markAnswer(kind, chosen, q) {
    var ok = chosen === q.answer;
    EX.answers[kind].push(ok);
    if (ok) S.bump('quiz'); else S.bump('review');
    U.toast(ok ? '✓ 正确' : '✗ 正确答案：' + q.answer);
    setTimeout(advance, 500);
  }

  ui.on('exam-answer', function (a) {
    var sec = SECS[EX.si].key;
    var q = (sec === 'vocab' ? EX.sections.vocab : EX.sections.grammar)[EX.qi];
    markAnswer(sec, a.el.getAttribute('data-id'), q);
  });
  ui.on('exam-reading', function (a) {
    var q = EX.sections.reading.questions[EX.qi];
    var q2 = { answer: q.options[q.a] };
    markAnswer('reading', a.el.getAttribute('data-id'), q2);
  });
  ui.on('exam-listening', function (a) {
    var l = EX.sections.listening[EX.qi];
    EX.showListenText = true;
    markAnswer('listening', a.el.getAttribute('data-id'), { answer: l.options[l.a] });
    App.views.exam.render(document.getElementById('view'));
  });
  ui.on('exam-listenPlay', function (a) { var l = EX.sections.listening.filter(function (x) { return x.id === a.id; })[0]; tts.speak(l.text, {}); });
  ui.on('exam-listenSlow', function (a) { var l = EX.sections.listening.filter(function (x) { return x.id === a.id; })[0]; tts.speak(l.text, { rate: 0.65 }); });

  ui.on('exam-recStart', function (a) {
    recStart(parseInt(a.val || '30', 10), function (text, dur) {
      var qs = EX.sections;
      if (EX.qi < qs.shadow.length) {
        var res = App.eval.analyze({ text: text, reference: qs.shadow[EX.qi].ref, durationMs: dur });
        EX.shadowAcc = EX.shadowAcc || [];
        var acc = res.pronunciation ? res.pronunciation.accuracy : 0;
        EX.shadowAcc.push(acc);
        EX.shadowLast = acc;
        U.toast('匹配度 ' + Math.round(acc * 100) + '%');
        advance();
      } else {
        var res2 = App.eval.analyze({ text: text, durationMs: dur });
        EX.freeScore = res2.scores.overall / 9 * 100;
        EX.speakReport = res2;
        advance();
      }
    });
  });
  ui.on('exam-recStop', function () { recStop(); });
  ui.on('exam-textSubmit', function () {
    var ta = document.getElementById('exTextAnswer');
    var text = ta ? ta.value.trim() : '';
    var dur = Math.max(10000, text.split(/\s+/).length / 130 * 60000);
    var qs = EX.sections;
    if (EX.qi < qs.shadow.length) {
      var res = App.eval.analyze({ text: text, reference: qs.shadow[EX.qi].ref, durationMs: dur });
      var acc = res.pronunciation ? res.pronunciation.accuracy : 0;
      (EX.shadowAcc = EX.shadowAcc || []).push(acc);
      EX.shadowLast = acc; advance();
    } else {
      var res2 = App.eval.analyze({ text: text, durationMs: dur });
      EX.freeScore = res2.scores.overall / 9 * 100;
      EX.speakReport = res2; advance();
    }
  });

  // 每次进入口语部分初始化
  var _origRender = App.views.exam.render;
  App.views.exam.render = function (el) {
    if (EX.stage === 'run' && SECS[EX.si] && SECS[EX.si].key === 'speaking' && !EX._speakInit) {
      EX._speakInit = true; EX.shadowAcc = [];
    }
    if (EX.stage === 'run' && SECS[EX.si] && SECS[EX.si].key !== 'speaking') EX._speakInit = false;
    _origRender(el);
  };
  // 口语进入 finish 前计算均分
  var _origFinish = finish;
  finish = function () {
    var acc = (EX.shadowAcc && EX.shadowAcc.length) ? EX.shadowAcc.reduce(function (a, b) { return a + b; }, 0) / EX.shadowAcc.length : 0;
    EX.shadowAvg = acc;
    if (EX.freeScore == null) EX.freeScore = 0;
    _origFinish();
  };

  App.examSession = EX;
})(typeof window !== 'undefined' ? window : globalThis);
