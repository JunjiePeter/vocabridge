/* ===========================================================
 * 路由与启动
 * =========================================================== */
(function (root) {
  'use strict';
  var App = root.App, U = App.util, S = App.store;

  var NAV = [
    { key: 'today', hash: '#/today', icon: '🏠', label: '今日' },
    { key: 'vocab', hash: '#/vocab', icon: '📖', label: '单词' },
    { key: 'grammar', hash: '#/grammar', icon: '✍️', label: '语法' },
    { key: 'exam', hash: '#/exam', icon: '🏅', label: '测评' },
    { key: 'speaking', hash: '#/speaking', icon: '🎙️', label: '口语' },
    { key: 'review', hash: '#/review', icon: '🔁', label: '复习' },
    { key: 'stats', hash: '#/stats', icon: '📊', label: '报告' },
    { key: 'settings', hash: '#/settings', icon: '⚙️', label: '设置' }
  ];
  var TABS = ['today', 'vocab', 'exam', 'speaking', 'review'];

  var router = {
    cur: '#/today',
    go: function (hash) {
      hash = hash || '#/today';
      if (location.hash === hash) router.render();
      else location.hash = hash;
    },
    render: function () {
      var key = (location.hash || '#/today').replace('#/', '') || 'today';
      var v = App.views[key] || App.views.today;
      router.cur = location.hash;
      document.getElementById('title').textContent = v.title;
      document.getElementById('subTitle').textContent =
        key === 'today' ? U.today() : (key === 'speaking' ? '情景 · 跟读 · AI 打分' : '');
      App.util.qsa('[data-nav]').forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-nav') === key);
      });
      App.tts.stop();
      if (App.asr.supported() && App.asr.stop) App.asr.stop();
      v.render(document.getElementById('view'));
      window.scrollTo(0, 0);
    }
  };
  App.router = router;

  function boot() {
    S.load();

    // 先应用本地缓存的内容包（离线也要有新内容）
    try { App.content.applyCached(); } catch (e) { console.warn('内容包应用失败', e); }

    document.getElementById('nav').innerHTML = NAV.map(function (n) {
      return '<button class="nav-item" data-nav="' + n.key + '" data-act="go" data-val="' + n.hash + '"><i>' + n.icon + '</i>' + n.label + '</button>';
    }).join('');
    document.getElementById('tabbar').innerHTML = '<div class="row">' + NAV.filter(function (n) { return TABS.indexOf(n.key) >= 0; }).map(function (n) {
      return '<button class="nav-item" data-nav="' + n.key + '" data-act="go" data-val="' + n.hash + '"><i>' + n.icon + '</i>' + n.label + '</button>';
    }).join('') + '</div>';

    window.addEventListener('hashchange', router.render);
    if (!location.hash) location.hash = '#/today';
    router.render();

    // 后台静默检查内容更新（仅 http/https 场景；失败静默降级）
    setTimeout(function () {
      if (/^https?:/i.test(location.protocol)) {
        App.content.check().then(function (r) {
          if (r && r.updated) U.toast(r.message + '，刷新后展示最新内容');
        });
      }
    }, 3000);

    // 学习时长统计（每 60 秒累加 1 分钟）
    setInterval(function () {
      if (document.visibilityState === 'visible') S.bump('minutes', 1);
    }, 60000);

    // 首次使用提示
    var onboarded = false, isNew = false;
    try {
      onboarded = localStorage.getItem('vocabridge_onboarded') === '1';
      if (!onboarded) { localStorage.setItem('vocabridge_onboarded', '1'); isNew = true; }
    } catch (e) { isNew = true; }
    if (isNew && !onboarded) {
      setTimeout(function () {
        App.ui.modal('欢迎使用 VocaBridge',
          '<p>这是一个 offline 可用的英语学习工具，全部数据只存在你本机浏览器。</p>' +
          '<ul><li><b>学</b>：单词卡片 + 语法专题</li><li><b>练</b>：选择题 / 拼写 / 听写 / 情景对话 / 影子跟读</li>' +
          '<li><b>评</b>：AI 口语老师按雅思四项标准打分并逐句纠错</li>' +
          '<li><b>复习</b>：SM-2 间隔重复 + 错词本自动排队</li></ul>' +
          '<p class="muted">建议用 <b>Chrome / Edge</b> 打开以支持语音识别；其他浏览器会自动切换为打字模式。</p>',
          App.ui.btn('开始学习', 'close-modal', { cls: 'primary' }));
      }, 600);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);
