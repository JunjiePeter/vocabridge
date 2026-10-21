/* ===========================================================
 * UI 基础层：事件总线（事件委托）+ 常用组件片段
 * 所有交互用 data-act 属性驱动，重渲染后无需重新绑定
 * =========================================================== */
(function (root) {
  'use strict';
  var U = root.App.util;

  var handlers = {};

  function on(name, fn) { handlers[name] = fn; }
  function fire(name, el, ev) {
    if (!handlers[name]) {
      if (U && U.toast) U.toast('该功能暂未加载：' + name);
      return;
    }
    try {
      handlers[name]({
        el: el, ev: ev,
        id: el && el.getAttribute ? el.getAttribute('data-id') : undefined,
        val: el && el.getAttribute ? el.getAttribute('data-val') : undefined,
        data: (el && el.dataset) || {}
      });
    } catch (e) {
      console.error('[handler:' + name + ']', e);
      if (U && U.toast) U.toast('操作失败：' + (e && e.message ? e.message : String(e)));
    }
  }

  // 全局错误可视化：任何浏览器兼容问题都会弹出来，不会静默死掉
  window.addEventListener('error', function (e) {
    var t = document.getElementById('toast');
    if (t && e && e.message) {
      t.textContent = '页面出错了：' + e.message + '（可截图反馈）';
      t.className = 'toast show bad';
      clearTimeout(t._t); t._t = setTimeout(function () { t.className = 'toast'; }, 4500);
    }
  }, true);
  window.addEventListener('unhandledrejection', function (e) { console.error('Promise rejection:', e.reason); });

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t) return;
    e.preventDefault();
    fire(t.getAttribute('data-act'), t, e);
  });

  document.addEventListener('change', function (e) {
    var t = e.target.closest ? e.target.closest('[data-change]') : null;
    if (!t) return;
    fire(t.getAttribute('data-change'), t, e);
  });

  document.addEventListener('input', function (e) {
    var t = e.target.closest ? e.target.closest('[data-input]') : null;
    if (!t) return;
    fire(t.getAttribute('data-input'), t, e);
  });

  /* ---------- 片段构造 ---------- */
  function card(body, cls) { return '<div class="card ' + (cls || '') + '">' + body + '</div>'; }
  function btn(label, act, opts) {
    opts = opts || {};
    return '<button class="btn ' + (opts.cls || '') + '" data-act="' + act + '"' +
      (opts.id ? ' data-id="' + opts.id + '"' : '') + (opts.val ? ' data-val="' + opts.val + '"' : '') +
      (opts.title ? ' title="' + opts.title + '"' : '') + '>' + label + '</button>';
  }
  function muted(s) { return '<span class="muted">' + s + '</span>'; }
  function bar(pct, cls) {
    return '<div class="progress"><i class="' + (cls || '') + '" style="width:' + U.clamp(pct, 0, 100) + '%"></i></div>';
  }
  function ring(pct, label, sub) {
    var v = U.clamp(pct, 0, 100);
    var r = 34, c = 2 * Math.PI * r;
    return '<div class="ring"><svg viewBox="0 0 84 84">' +
      '<circle class="ring-bg" cx="42" cy="42" r="' + r + '"></circle>' +
      '<circle class="ring-fg" cx="42" cy="42" r="' + r + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - v / 100)) + '"></circle>' +
      '</svg><div class="ring-txt"><b>' + label + '</b><span>' + (sub || '') + '</span></div></div>';
  }
  function chips(list, act, activeId) {
    return '<div class="chips">' + list.map(function (c) {
      return '<button class="chip ' + (c.id === activeId ? 'on' : '') + '" data-act="' + act + '" data-val="' + c.id + '">' + c.label + '</button>';
    }).join('') + '</div>';
  }
  function empty(title, desc) {
    return '<div class="empty"><div class="empty-ico">📭</div><b>' + title + '</b><p>' + (desc || '') + '</p></div>';
  }
  function modal(title, bodyHtml, footerHtml) {
    var root_ = document.getElementById('modal-root');
    root_.innerHTML = '<div class="modal-mask" data-act="close-modal"><div class="modal" onclick="event.stopPropagation()">' +
      '<div class="modal-head"><b>' + title + '</b><button class="x" data-act="close-modal">✕</button></div>' +
      '<div class="modal-body">' + bodyHtml + '</div>' +
      (footerHtml ? '<div class="modal-foot">' + footerHtml + '</div>' : '') +
      '</div></div>';
    root_.classList.add('show');
  }
  function closeModal() {
    var root_ = document.getElementById('modal-root');
    root_.innerHTML = '';
    root_.classList.remove('show');
  }

  function speakBtn(text, opts) {
    opts = opts || {};
    return '<button class="spk" title="朗读" data-act="' + (opts.act || 'speak') + '" data-id="' + U.esc(text) + '"' +
      (opts.accent ? ' data-accent="' + opts.accent + '"' : '') + '>🔊</button>';
  }

  root.App.ui = {
    on: on, fire: fire,
    card: card, btn: btn, muted: muted, bar: bar, ring: ring, chips: chips,
    empty: empty, modal: modal, closeModal: closeModal, speakBtn: speakBtn
  };

  /* 通用：朗读 */
  on('speak', function (a) {
    var txt = a.el.getAttribute('data-id') || '';
    var acc = a.el.getAttribute('data-accent');
    root.App.tts.speak(txt, { accent: acc });
  });
  on('close-modal', function () { closeModal(); });

  // 兜底：任何脚本文件加载失败也提醒
  window.addEventListener('load', function () {
    if (!root.App || !root.App.views || !root.App.views.today) {
      U.toast('核心脚本未加载完整，请刷新或换用 Chrome / Edge 打开');
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
