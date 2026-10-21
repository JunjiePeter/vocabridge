/* ===========================================================
 * AI 口语老师：评分与纠错引擎
 * 维度参照 IELTS Speaking 四项标准：Fluency / Vocabulary / Grammar / Pronunciation
 * 纯本地规则引擎（无需联网）；在「设置」里填 LLM Key 后可升级为大模型深度点评
 * =========================================================== */
(function (root) {
  'use strict';
  var U = root.App.util;

  /* ---------- 语块 & 词表 ---------- */
  var FILLERS = /\b(um+|uh+|erm+|er|mm+|eh|hmm+|you know|i mean|kind of|sort of|basically|actually|like|so yeah|well)\b/ig;
  var FILLER_LIST = ['um', 'uh', 'erm', 'er', 'mm', 'hmm', 'you know', 'i mean', 'kind of', 'sort of', 'basically', 'actually', 'like', 'well'];
  var DISCOURSE = /\b(first of all|firstly|secondly|finally|to sum up|in conclusion|having said that|having said this|as a result|consequently|nevertheless|therefore|meanwhile|on the other hand|for instance|for example|to be honest|in my view|personally)\b/ig;
  var SUBORDINATORS = /\b(because|although|whereas|since|while|unless|provided that|as long as|in order that|even though|who|which|that|when|if|once|until|before|after|given that|whereby)\b/ig;

  /* 常见 glaring 错误规则库：ESL 高频错误 */
  var GRAMMAR_RULES = [
    { re: /\bi\s+am\s+(agree|disagree)\b/i, fix: 'I agree / I disagree', note: 'agree 是动词，不能直接跟在 am 后面。' },
    { re: /\bvery\s+(like|recommend|suggest|appreciate|enjoy)\b/i, fix: 'like … very much', note: 'very 不能直接修饰动词，应放在句末或用 really。' },
    { re: /\bimprove\s+(my\s+|the\s+)?english\s+level\b/i, fix: 'improve my English', note: 'level 冗余。' },
    { re: /\benglish\s+level\b/i, fix: 'English proficiency / English', note: '中式表达，建议用 proficiency。' },
    { re: /\baccording\s+to\s+(my|his|her)\s+opinion\b/i, fix: 'in my opinion', note: 'according to 后接来源，不接观点。' },
    { re: /\bdiscuss\s+about\b/i, fix: 'discuss', note: 'discuss 直接接宾语。' },
    { re: /\bemphasise\s+on\b|\bemphasize\s+on\b/i, fix: 'emphasise', note: 'emphasise 及物。' },
    { re: /\breturn\s+back\b/i, fix: 'return / go back', note: '语义重复。' },
    { re: /\brepeat\s+again\b/i, fix: 'repeat', note: 'repeat 已含 again 之意。' },
    { re: /\bmore\s+(better|easier|cheaper|faster|higher)\b/i, fix: 'better / cheaper …', note: '双重比较级。' },
    { re: /\bthe\s+most\s+best\b/i, fix: 'the best', note: '最高级重复。' },
    { re: /\bvery\s+unique\b|\bmore\s+unique\b/i, fix: 'unique', note: 'unique 是绝对形容词，不分级。' },
    { re: /\b(can|will|must|should|may)\s+to\b/i, fix: '情态动词后直接加动词原形', note: '情态动词后不加 to。' },
    { re: /\b(informations|advices|equipments|researchs|staffs|knowledges|progresses|feedbacks|homeworks)\b/i, fix: 'information / advice / equipment / research / staff / knowledge / progress / feedback / homework', note: '这些是不可数名词，没有复数。' },
    { re: /\bmuch\s+(people|students|workers|employees|candidates|companies)\b/i, fix: 'many people', note: '可数名词复数用 many。' },
    { re: /\bless\s+(people|employees|students|candidates)\b/i, fix: 'fewer people', note: '可数名词用 fewer。' },
    { re: /\bmarry\s+with\b|\bmarried\s+with\b/i, fix: 'married to', note: '固定搭配 marry sb / be married to sb。' },
    { re: /\bexplain\s+me\b|\bexplain\s+us\b/i, fix: 'explain to me', note: 'explain 的直接宾语是事物。' },
    { re: /\bresponsible\s+(of|on)\b/i, fix: 'responsible for', note: '固定介词搭配。' },
    { re: /\bparticipate\s+(to|on)\b/i, fix: 'participate in', note: '固定搭配。' },
    { re: /\bdepend\s+(of|from)\b/i, fix: 'depend on', note: '固定搭配。' },
    { re: /\bconsist\s+(by|from)\b/i, fix: 'consist of', note: '固定搭配。' },
    { re: /\bpay\s+attention\s+on\b/i, fix: 'pay attention to', note: '固定搭配。' },
    { re: /\btake\s+part\s+(on|of)\b/i, fix: 'take part in', note: '固定搭配。' },
    { re: /\binterest(ed)?\s+(at|on)\b/i, fix: 'interested in', note: '固定搭配。' },
    { re: /\bgood\s+in\b/i, fix: 'good at', note: '擅长某事用 good at。' },
    { re: /\bcontact\s+with\s+(me|him|her|them|us)\b/i, fix: 'contact me', note: 'contact 及物。' },
    { re: /\b(learn|study|increase)\s+knowledge\b/i, fix: 'acquire / gain knowledge', note: 'learn knowledge 属典型中式搭配。' },
    { re: /\bopen\s+(the|a)\s+(light|tv|computer)\b/i, fix: 'turn on the light', note: '开电器用 turn on / switch on。' },
    { re: /\bthere\s+(are|is|were)\s+many\s+people\s+(think|believe|say)\b/i, fix: 'there are many people who think', note: '补足关系代词 who。' },
    { re: /\bwill\s+\w+ed\b/i, fix: 'will + 动词原形', note: '将来时后不可接过去式。' },
    { re: /\bdidn'?t\s+\w+ed\b/i, fix: "didn't + 动词原形", note: '助动词 did 后须接原形。' },
    { re: /\bi\s+have\s+\d+\s+(years?|year)\s+old\b/i, fix: 'I am 25 years old', note: '表达年龄用 be 动词。' },
    { re: /\bmy\s+age\s+is\s+\d+\b/i, fix: 'I am 25', note: '更自然的表达。' },
    { re: /\bi\s+am\s+(a\s+)?(very|really)?\s?(agree)\b/i, fix: 'I agree', note: '重复规则保护。' },
    { re: /\bthis\s+is\s+because\s+of\s+(\w+ing)\b/i, fix: 'this is because …', note: 'because of 后不接句子。' },
    { re: /\bin\s+the\s+future\s+i\s+will\s+to\b/i, fix: 'in future I will', note: 'will 后不加 to。' }
  ];

  /* although…but / because…so 需整句判定 */
  var PAIR_RULES = [
    { a: /\balthough\b|\bthough\b/i, b: /\bbut\b/i, fix: '删掉 but 或 although（两者留一个）', note: '英语句子中 although 与 but 不能同时使用。' },
    { a: /\bbecause\b/i, b: /\bso\b/i, fix: '删掉 so 或 because（两者留一个）', note: 'because 与 so 不能同时连接同一组句子。' }
  ];

  /* 主谓一致：第三人称单数 */
  var VERB_THIRD = {
    'go': 'goes', 'do': 'does', 'have': 'has', 'say': 'says', 'get': 'gets', 'make': 'makes', 'know': 'knows',
    'think': 'thinks', 'take': 'takes', 'see': 'sees', 'come': 'comes', 'want': 'wants', 'look': 'looks',
    'use': 'uses', 'find': 'finds', 'give': 'gives', 'tell': 'tells', 'work': 'works', 'call': 'calls',
    'try': 'tries', 'ask': 'asks', 'need': 'needs', 'feel': 'feels', 'become': 'becomes', 'leave': 'leaves',
    'put': 'puts', 'mean': 'means', 'keep': 'keeps', 'let': 'lets', 'begin': 'begins', 'help': 'helps',
    'talk': 'talks', 'turn': 'turns', 'start': 'starts', 'show': 'shows', 'hear': 'hears', 'play': 'plays',
    'run': 'runs', 'move': 'moves', 'live': 'lives', 'believe': 'believes', 'bring': 'brings', 'happen': 'happens',
    'write': 'writes', 'provide': 'provides', 'include': 'includes', 'require': 'requires', 'manage': 'manages',
    'report': 'reports', 'depend': 'depends', 'vary': 'varies', 'reflect': 'reflects', 'suggest': 'suggests',
    'lead': 'leads', 'support': 'supports', 'deliver': 'delivers', 'focus': 'focuses', 'handle': 'handles',
    'improve': 'improves', 'create': 'creates', 'reduce': 'reduces', 'allow': 'allows', 'cause': 'causes'
  };
  var THIRD_SUBJ = /\b(he|she|it|this|that|my\s+\w+|the\s+\w+)\b/i;

  /* 词汇升级表 */
  var UPGRADES = [
    ['good', 'beneficial / solid'], ['bad', 'detrimental / poor'], ['very big', 'substantial'], ['big', 'significant / considerable'],
    ['very important', 'crucial / essential'], ['important', 'significant'], ['happy', 'satisfied / delighted'],
    ['sad', 'frustrated / disappointed'], ['like', 'be keen on / appreciate'], ['many', 'a considerable number of'],
    ['help', 'facilitate / assist'], ['change', 'transform / adjust'], ['use', 'utilise / deploy'],
    ['make better', 'enhance / optimise'], ['more and more', 'increasingly'], ['know', 'understand / be aware of'],
    ['think', 'believe / reckon'], ['a lot of', 'a great deal of'], ['get', 'obtain / secure'],
    ['show', 'demonstrate / reveal'], ['start', 'commence / initiate'], ['end', 'conclude'],
    ['give', 'provide'], ['buy', 'purchase'], ['usual', 'conventional'], ['often', 'frequently'],
    ['really', 'genuinely / considerably'], ['problem', 'challenge / issue'], ['need', 'require'],
    ['because of', 'owing to / due to'], ['about', 'regarding / approximately'], ['cheap', 'affordable'],
    ['rich', 'affluent'], ['poor people', 'low-income households'], ['people', 'individuals / residents'],
    ['way', 'approach / mechanism'], ['part', 'component'], ['job', 'role / position'], ['company', 'organisation / firm'],
    ['boss', 'line manager / supervisor'], ['hard', 'demanding / strenuous'], ['quickly', 'rapidly'],
    ['very much', 'considerably'], ['try', 'endeavour / attempt'], ['decide', 'resolve / opt'], ['bad for', 'detrimental to']
  ];

  var COMMON_WORDS = /^(the|is|are|was|were|do|does|did|i|you|he|she|it|we|they|and|but|so|to|of|a|an|in|on|at|for|with|that|this|there|my|me|be|am|very|really|about|have|has|had|when|what|which|who|why|how|because|just|can|will|would|should|could|not|no|yes|up|out|if|or|as|from|they're|don't)$/i;

  /* ---------- 工具：句子切分 ---------- */
  function sentences(text) {
    return String(text || '').split(/[.!?。！？]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 1; });
  }
  function words(text) { return U.tokenize(text); }

  /* ---------- 语法检查 ---------- */
  function checkGrammar(text) {
    var out = [], seen = {};
    var sents = sentences(text);
    sents.forEach(function (s) {
      GRAMMAR_RULES.forEach(function (r) {
        var m = s.match(r.re);
        if (m) {
          var key = r.fix + m[0];
          if (seen[key]) return;
          seen[key] = 1;
          out.push({ type: 'grammar', original: m[0], suggestion: r.fix, reason: r.note, sentence: s });
        }
      });
      PAIR_RULES.forEach(function (p) {
        if (p.a.test(s) && p.b.test(s)) {
          var key = 'pair' + p.note;
          if (seen[key]) return; seen[key] = 1;
          out.push({ type: 'grammar', original: s.length > 60 ? s.slice(0, 60) + '…' : s, suggestion: p.fix, reason: p.note, sentence: s });
        }
      });
      // 第三人称单数缺 -s
      var third = s.match(/\b(he|she|it)\s+([a-z]+)\b/i);
      if (third) {
        var v = third[2].toLowerCase();
        if (VERB_THIRD[v] && !/\b(not|n't)\b/.test(s)) {
          var key2 = 'third' + third[0];
          if (!seen[key2]) {
            seen[key2] = 1;
            out.push({
              type: 'grammar', original: third[0], suggestion: third[1] + ' ' + VERB_THIRD[v],
              reason: '第三人称单数一般现在时，动词要加 -s。', sentence: s
            });
          }
        }
      }
      // 缺冠词：I am / He is + 职业名词
      var art = s.match(/\b(i\s+am|he\s+is|she\s+is)\s+(student|teacher|engineer|developer|manager|intern|analyst|designer|researcher|candidate)\b/i);
      if (art) {
        var key3 = 'art' + art[0];
        if (!seen[key3]) {
          seen[key3] = 1;
          out.push({ type: 'grammar', original: art[0], suggestion: art[1] + ' a ' + art[2], reason: '可数名词单数不能没有冠词。', sentence: s });
        }
      }
      // 过去时间 + 动词原形
      var past = s.match(/\b(yesterday|last\s+(year|month|week|night|semester)|ago)\b[^.!?]*\b(go|goes|come|comes|see|sees|take|takes|buy|buys|get|gets|make|makes|do|does|have|has|eat|eats|meet|meets|give|gives|leave|leaves|start|starts|finish|finishes)\b/i);
      if (past) {
        var key4 = 'past' + past[0];
        if (!seen[key4]) {
          seen[key4] = 1;
          out.push({ type: 'grammar', original: past[0], suggestion: '改用过去式动词', reason: '与明确的过去时间状语连用，须用一般过去时。', sentence: s });
        }
      }
    });
    return out;
  }

  /* ---------- 词汇分析 ---------- */
  function checkLexis(text) {
    var W = words(text), low = ' ' + text.toLowerCase() + ' ';
    var counts = {}, total = 0, i, w;
    for (i = 0; i < W.length; i++) {
      w = W[i];
      if (COMMON_WORDS.test(w)) continue;
      counts[w] = (counts[w] || 0) + 1; total++;
    }
    var uniq = Object.keys(counts).length;
    var ttr = W.length ? uniq / Math.max(1, W.length) : 0;

    var suggestions = [];
    UPGRADES.forEach(function (p) {
      var re = new RegExp('(^|[^a-z])' + p[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)', 'i');
      if (re.test(low) && suggestions.length < 6) {
        suggestions.push({ type: 'lexis', original: p[0], suggestion: p[1], reason: '雅思 Lexical Resource 建议替换为更精准的表达。' });
      }
    });

    // 重复词（同一实词出现 >= 3 次）
    Object.keys(counts).forEach(function (k) {
      if (counts[k] >= 3 && suggestions.length < 8) {
        suggestions.push({ type: 'lexis', original: k, suggestion: '使用同义替换或代词指代', reason: '同一实词重复出现 ' + counts[k] + ' 次，影响词汇多样性。' });
      }
    });

    // 命中目标词库的加分项
    var hitVocab = [];
    try {
      var pool = (root.App.VOCAB_IELTS || []).concat(root.App.VOCAB_WORK || []);
      pool.forEach(function (v) {
        var re = new RegExp('(^|[^a-z])' + v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([a-z]|$)', 'i');
        if (re.test(text)) hitVocab.push(v.word);
      });
    } catch (e) { }

    return { ttr: ttr, uniq: uniq, total: total, suggestions: suggestions, hitVocab: hitVocab.slice(0, 12) };
  }

  /* ---------- 流利度 ---------- */
  function checkFluency(text, meta) {
    meta = meta || {};
    var W = words(text);
    var n = W.length;
    var durMs = meta.durationMs || (n ? (n / 130) * 60000 : 0);
    var minutes = Math.max(durMs / 60000, 0.05);
    var wpm = Math.round(n / minutes);

    var fm = String(text || '').match(FILLERS) || [];
    var fillers = fm.map(function (x) { return x.toLowerCase().trim(); });
    var distinctFillers = {};
    fillers.forEach(function (f) { distinctFillers[f] = (distinctFillers[f] || 0) + 1; });

    // 停顿估算：基于 ASR 分段
    var segs = meta.segments || [];
    var pauses = 0, longPauses = 0;
    if (segs.length > 1) {
      var prev = segs[0].t || 0;
      for (var i = 1; i < segs.length; i++) {
        var gap = (segs[i].t || 0) - prev;
        var expect = (segs[i].text.split(/\s+/).length / Math.max(60, wpm)) * 60000; // 说话时长估算
        var silent = gap - expect;
        if (silent > 900) { pauses++; if (silent > 2500) longPauses++; }
        prev = segs[i].t || 0;
      }
    }

    var sentsCount = sentences(text).length;
    var avgSentLen = sentsCount ? n / sentsCount : 0;
    var discourse = (String(text).match(DISCOURSE) || []).length;
    var subordinates = (String(text).match(SUBORDINATORS) || []).length;

    // 负向：连续重复（stutter I I I）
    var stutter = (String(text).toLowerCase().match(/\b(\w+)( \1\b){1,}/g) || []).length;

    return {
      words: n, minutes: U.round1(minutes), wpm: wpm,
      fillerCount: fillers.length, fillerPer100: U.round1((fillers.length / Math.max(1, n)) * 100),
      fillerWords: Object.keys(distinctFillers),
      pauses: pauses, longPauses: longPauses, stutter: stutter,
      sentenceCount: sentsCount, avgSentLen: U.round1(avgSentLen),
      discourse: discourse, subordinates: subordinates
    };
  }

  /* ---------- 发音：与参考文本比对 ---------- */
  function checkPronunciation(text, reference) {
    if (!reference) return null;
    var ref = words(reference), hyp = words(text);
    var ops = U.align(ref, hyp);
    var correct = ops.filter(function (o) { return o.t === 'ok'; }).length;
    var accuracy = ref.length ? correct / ref.length : 0;
    var missed = ops.filter(function (o) { return o.t === 'del'; }).map(function (o) { return o.ref; });
    var sub = ops.filter(function (o) { return o.t === 'sub'; }).map(function (o) { return { ref: o.ref, got: o.hyp }; });
    var extra = ops.filter(function (o) { return o.t === 'ins'; }).map(function (o) { return o.hyp; });
    return {
      accuracy: U.round1(accuracy), missed: missed, substituted: sub, extra: extra,
      wer: U.round1(1 - accuracy)
    };
  }

  /* ---------- 打分映射 ---------- */
  function bandFluency(f) {
    var base;
    if (f.wpm >= 150) base = 8.5; else if (f.wpm >= 130) base = 8; else if (f.wpm >= 110) base = 7.5;
    else if (f.wpm >= 90) base = 7; else if (f.wpm >= 70) base = 6.5; else if (f.wpm >= 50) base = 6; else base = 5;
    var     pen = 0;
    if (f.fillerPer100 > 6) pen += 1.5; else if (f.fillerPer100 > 3) pen += 1; else if (f.fillerPer100 > 1.5) pen += 0.5;
    if (f.longPauses > 2) pen += 1; else if (f.longPauses > 0) pen += 0.5;
    if (f.stutter > 2) pen += 0.5;
    if (f.discourse >= 2) pen -= 0.25;
    if (f.words < 30) pen += 0.5;   // 内容太少，无法稳定判断
    return U.clamp(U.toHalf(base - pen), 4, 9);
  }
  function bandLexis(l, f) {
    var base;
    if (l.ttr >= 0.62) base = 8; else if (l.ttr >= 0.55) base = 7.5; else if (l.ttr >= 0.48) base = 7;
    else if (l.ttr >= 0.42) base = 6.5; else if (l.ttr >= 0.35) base = 6; else base = 5.5;
    if (l.hitVocab.length >= 4) base += 0.5; else if (l.hitVocab.length >= 2) base += 0.25;
    if (f.words < 25) base -= 0.5;
    return U.clamp(U.toHalf(base), 4, 9);
  }
  function bandGrammar(errors, f) {
    var g = 7.5;
    g -= Math.min(3, errors.length * 0.5);
    if (f.subordinates >= 3) g += 0.5;
    if (f.avgSentLen > 15) g += 0.25;
    if (f.sentenceCount <= 1 && f.words > 40) g -= 0.5;
    if (f.words < 30) g = Math.min(g, 6.5);  // 样本太少，无法证明句法多样性
    return U.clamp(U.toHalf(g), 4, 9);
  }
  function bandPronunciation(p, f, confidence) {
    if (p) {
      var a = p.accuracy;
      var b;
      if (a >= 0.99) b = 9; else if (a >= 0.96) b = 8.5; else if (a >= 0.92) b = 8; else if (a >= 0.86) b = 7.5;
      else if (a >= 0.78) b = 7; else if (a >= 0.68) b = 6.5; else if (a >= 0.55) b = 6; else b = 5;
      if (f.words < 3) b = 5;
      return U.clamp(U.toHalf(b), 4, 9);
    }
    if (confidence != null) {
      return U.clamp(U.toHalf(5 + confidence * 4), 4, 9);
    }
    return null;
  }

  /* ---------- 主入口 ---------- */
  function analyze(opt) {
    opt = opt || {};
    var text = (opt.text || '').trim();
    var f = checkFluency(text, opt);
    var l = checkLexis(text);
    var errors = checkGrammar(text);
    var p = checkPronunciation(text, opt.reference);

    var sF = bandFluency(f), sL = bandLexis(l, f), sG = bandGrammar(errors, f), sP = bandPronunciation(p, f, opt.confidence);
    var dims = [sF, sL, sG];
    if (sP != null) dims.push(sP);
    var overall = U.toHalf(dims.reduce(function (a, b) { return a + b; }, 0) / dims.length);

    // 通用改进建议
    var tips = [];
    if (f.words < 30) tips.push('回答偏短。雅思/面试回答建议 60-120 词，面试官追问时会更轻松。');
    if (f.fillerPer100 > 3) tips.push('填充词偏多（' + f.fillerWords.slice(0, 4).join('、') + '）。宁可停顿 1 秒，也不要用 um / like 填补空白。');
    if (f.longPauses > 0) tips.push('出现超过 2.5 秒的长停顿，建议用衔接词占位："That\'s a good question — let me think for a second."');
    if (f.subordinates < 2 && f.words > 40) tips.push('句子偏简单，试着加入 because / although / which 等从句，GRA 分数会明显上升。');
    if (l.ttr < 0.45) tips.push('用词重复度高，试着换掉重复出现的实词。');
    if (errors.length) tips.push('本次检测到 ' + errors.length + ' 处语法/搭配问题，优先修最有把握的三条。');
    if (p && p.wer > 0.2) tips.push('跟读匹配度偏低，把标红的词单独慢速重读三遍再整句跟读。');
    if (!tips.length) tips.push('整体不错，下一步可以把重心放在内容组织（PEEL 结构）上。');

    return {
      text: text, metrics: f, lexis: l, errors: errors,
      pronunciation: p, tips: tips,
      scores: { fluency: sF, vocabulary: sL, grammar: sG, pronunciation: sP, overall: overall },
      hasPronunciation: sP != null
    };
  }

  /* ---------- LLM 深度点评（可选） ---------- */
  function deep(opt) {
    var st = root.App.store.state.settings.llm;
    if (!st || !st.enabled || !st.apiKey) return Promise.reject(new Error('LLM 未配置'));
    var text = opt.text || '';
    var prompt = [
      'You are an IELTS Speaking examiner and a senior hiring coach for English-speaking tech companies.',
      'Assess the candidate answer below.',
      '',
      'Task / question: ' + (opt.task || 'open speaking'),
      'Scenario: ' + (opt.scenario || 'general'),
      'Reference answer (may be empty): ' + (opt.reference || ''),
      'Candidate answer: "' + text + '"',
      '',
      'Reply with STRICT JSON only, no markdown fences, with this schema:',
      '{"fluency":7.0,"vocabulary":6.5,"grammar":7.0,"pronunciation":6.5,"overall":7.0,',
      '"verdict":"2 sentences of examiner comment",',
      '"corrections":[{"original":"wrong part","suggestion":"fixed","reason":"short Chinese reason"}],',
      '"upgradeSuggestions":["advice1","advice2"],',
      '"polishedVersion":"an improved version of the candidate answer, 30-80 words"}'
    ].join('\n');

    return fetch(st.baseUrl.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + st.apiKey },
      body: JSON.stringify({
        model: st.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You assess spoken English for IELTS and job interviews. Always answer in strict JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('API ' + r.status);
      return r.json();
    }).then(function (j) {
      var content = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
      content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(content);
    });
  }

  root.App.eval = { analyze: analyze, deep: deep, checkGrammar: checkGrammar, checkLexis: checkLexis, checkPronunciation: checkPronunciation, sentences: sentences };
})(typeof window !== 'undefined' ? window : globalThis);
