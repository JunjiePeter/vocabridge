/* ===========================================================
 * 语音层：朗读(TTS) / 识别(ASR) / 录音回放
 * 全部走浏览器原生 API，不依赖任何外部服务
 * =========================================================== */
(function (root) {
  'use strict';
  var util = root.App.util;

  /* ---------------- 朗读 ---------------- */
  var tts = {
    ok: 'speechSynthesis' in window,
    _voices: [],
    load: function () {
      if (!tts.ok) return [];
      tts._voices = window.speechSynthesis.getVoices() || [];
      return tts._voices;
    },
    voices: function () { return tts._voices.length ? tts._voices : tts.load(); },
    pick: function (accent) {
      var vs = tts.voices().filter(function (v) { return /^en(-|_)/i.test(v.lang || ''); });
      if (!vs.length) return null;
      var want = (accent || 'en-US').toLowerCase();
      var exact = vs.filter(function (v) { return v.lang.toLowerCase().replace('_', '-') === want; });
      if (exact.length) {
        // 优先高质量音色
        return exact.filter(function (v) { return /google|natural|premium|enhanced|siri/i.test(v.name); })[0] || exact[0];
      }
      return vs.filter(function (v) { return /^en-gb/i.test(v.lang); })[0] || vs[0];
    },
    speak: function (text, opt) {
      opt = opt || {};
      if (!tts.ok) { util.toast('当前浏览器不支持朗读'); if (opt.onend) opt.onend(); return; }
      try { window.speechSynthesis.cancel(); } catch (e) { }
      var u = new SpeechSynthesisUtterance(String(text));
      var accent = opt.accent || (root.App.store.state.settings.accent) || 'en-US';
      u.lang = accent;
      var v = tts.pick(accent);
      if (v) u.voice = v;
      u.rate = opt.rate || root.App.store.state.settings.rate || 0.95;
      u.pitch = opt.pitch || 1;
      u.volume = opt.volume == null ? 1 : opt.volume;
      if (opt.onend) u.onend = opt.onend;
      if (opt.onerror) u.onerror = opt.onerror;
      setTimeout(function () {
        try { window.speechSynthesis.speak(u); } catch (e) { util.toast('朗读失败：' + e.message); }
      }, 30);
      return u;
    },
    stop: function () { if (tts.ok) { try { window.speechSynthesis.cancel(); } catch (e) { } } }
  };

  if (tts.ok) {
    tts.load();
    window.speechSynthesis.onvoiceschanged = function () { tts.load(); };
  }

  /* ---------------- 识别 ---------------- */
  function SR() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || null;
  }

  var asr = {
    supported: function () { return !!SR(); },
    rec: null,
    listening: false,
    start: function (opt) {
      opt = opt || {};
      var SRc = SR();
      if (!SRc) { util.toast('当前浏览器不支持语音识别，可切换到「打字模式」'); if (opt.onError) opt.onError('unsupported'); return false; }
      asr.stop();
      var r = new SRc();
      r.lang = opt.lang || 'en-US';
      r.continuous = opt.continuous !== false;
      r.interimResults = true;
      r.maxAlternatives = 3;
      var finalText = '';
      var segments = [];   // {text, start, end} for fluency analysis
      var started = Date.now();
      var lastFinalEnd = 0;

      r.onresult = function (e) {
        var interim = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var res = e.results[i], alt = res[0];
          if (res.isFinal) {
            var t = (alt.transcript || '').trim();
            if (t) {
              segments.push({ text: t, t: Date.now() - started });
              finalText = (finalText ? finalText + ' ' : '') + t;
              lastFinalEnd = Date.now() - started;
            }
          } else {
            interim += alt.transcript;
          }
        }
        if (opt.onPartial) opt.onPartial(finalText + (interim ? (finalText ? ' ' : '') + interim : ''), interim);
        if (opt.onResult) opt.onResult(finalText, interim, segments);
      };
      r.onerror = function (e) {
        if (e.error === 'no-speech') return;
        if (opt.onError) opt.onError(e.error);
      };
      r.onend = function () {
        asr.listening = false;
        if (opt.onEnd) opt.onEnd(finalText, segments, Date.now() - started);
      };
      try { r.start(); } catch (e) { if (opt.onError) opt.onError(String(e)); return false; }
      asr.rec = r; asr.listening = true;
      return true;
    },
    stop: function () {
      if (asr.rec) { try { asr.rec.stop(); } catch (e) { } asr.rec = null; }
      asr.listening = false;
    },
    abort: function () {
      if (asr.rec) { try { asr.rec.abort(); } catch (e) { } asr.rec = null; }
      asr.listening = false;
    }
  };

  /* ---------------- 录音回放 ---------------- */
  var recorder = {
    stream: null, mr: null, chunks: [], active: false,
    supported: function () { return !!(navigator.mediaDevices && window.MediaRecorder); },
    start: function () {
      if (!recorder.supported()) return Promise.resolve(false);
      return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (st) {
        recorder.stream = st; recorder.chunks = [];
        recorder.mr = new MediaRecorder(st);
        recorder.mr.ondataavailable = function (e) { if (e.data.size) recorder.chunks.push(e.data); };
        recorder.mr.start(); recorder.active = true;
        return true;
      }).catch(function () { return false; });
    },
    stop: function () {
      return new Promise(function (resolve) {
        if (!recorder.active || !recorder.mr) return resolve(null);
        recorder.mr.onstop = function () {
          var blob = new Blob(recorder.chunks, { type: 'audio/webm' });
          if (recorder.stream) recorder.stream.getTracks().forEach(function (t) { t.stop(); });
          recorder.active = false;
          resolve(URL.createObjectURL(blob));
        };
        try { recorder.mr.stop(); } catch (e) { resolve(null); }
      });
    }
  };

  root.App.tts = tts;
  root.App.asr = asr;
  root.App.recorder = recorder;
})(typeof window !== 'undefined' ? window : globalThis);
