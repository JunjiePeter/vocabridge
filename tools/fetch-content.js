/* ===========================================================
 * 内容采集器：RSS → 影子跟读素材包
 * 用法：
 *   node tools/fetch-content.js                      # 抓默认源（BBC 新闻/科技/商业）
 *   node tools/fetch-content.js --feed <url> --name <id> --accent en-US
 * 行为：
 *   1. 拉取 RSS → 提取每条新闻的标题与摘要
 *   2. 拆句、清洗 HTML、过滤过短/过长句
 *   3. 从内置词库匹配重点词中文释义（离线可查的那部分）
 *   4. 生成 content/packs/rss-<name>.json，并自动把 manifest 版本 +1
 * 版权提醒：RSS 摘要文本版权归原媒体所有，仅适合个人学习使用，不要二次分发。
 * =========================================================== */
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const packsDir = path.join(rootDir, 'content', 'packs');
const manifestPath = path.join(rootDir, 'content', 'manifest.json');

const DEFAULT_FEEDS = [
  { name: 'bbc-news', url: 'https://feeds.bbci.co.uk/news/rss.xml', accent: 'en-GB', label: 'BBC News · Top Stories' },
  { name: 'bbc-tech', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', accent: 'en-GB', label: 'BBC News · Technology' },
  { name: 'bbc-biz', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', accent: 'en-GB', label: 'BBC News · Business' }
];

/* ---------------- 参数 ---------------- */
function parseArgs(argv) {
  const o = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[i + 1] || true, i++;
  }
  return o;
}
const args = parseArgs(process.argv);
const feeds = args.feed
  ? [{ name: args.name || 'custom', url: args.feed, accent: args.accent || 'en-US', label: args.name || '自定义源' }]
  : args.file
    ? [{ name: args.name || 'local', file: args.file, accent: args.accent || 'en-GB', label: args.label || args.name || '本地源' }]
    : DEFAULT_FEEDS;

/* ---------------- RSS 解析（无依赖，轻量正则解析） ---------------- */
function stripHtml(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function parseRSS(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) && items.length < 12) {
    const block = m[1];
    const get = tag => {
      const mm = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'));
      return mm ? stripHtml(mm[1]) : '';
    };
    const title = get('title');
    const desc = get('description');
    const link = get('link');
    if (title && desc) items.push({ title, desc, link });
  }
  return items;
}

/* ---------------- 拆句 ---------------- */
function splitSentences(text) {
  return String(text)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => {
      const w = s.split(/\s+/).length;
      return w >= 8 && w <= 32 && /[a-z]/i.test(s);
    });
}

/* ---------------- 重点词：匹配内置词库拿中文释义 ---------------- */
function loadVocabDict() {
  const dict = {};
  ['data-vocab-ielts.js', 'data-vocab-work.js'].forEach(f => {
    const code = fs.readFileSync(path.join(rootDir, 'js', f), 'utf8');
    const re = /\["([^"]+)",\s*"[^"]*",\s*"[^"]*",\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(code))) dict[m[1].toLowerCase()] = m[2];
  });
  return dict;
}

function extractVocab(sentences, dict) {
  const seen = {}, out = [];
  const stop = /^(the|and|that|with|from|this|have|has|will|would|there|their|about|after|before|which|while|where|when|what|because|through|between|against|without|during|including|according)$/i;
  sentences.join(' ').toLowerCase().replace(/[^a-z\s'-]/g, ' ').split(/\s+/).forEach(w => {
    if (!w || w.length < 7 || seen[w] || stop.test(w)) return;
    seen[w] = 1;
    if (dict[w] && out.length < 6) out.push({ w, cn: dict[w] });
  });
  // 词库没有的就留原文提示
  Object.keys(seen).slice(0, 8).forEach(w => {
    if (!out.some(x => x.w === w) && out.length < 6) out.push({ w, cn: '（查词典）' });
  });
  return out;
}

/* ---------------- 生成内容包 ---------------- */
function buildPassagePack(feed, items) {
  const passages = items.map((it, i) => {
    const sents = splitSentences(it.desc + ' ' + it.title).slice(0, 7);
    return {
      id: 'rss-' + feed.name + '-' + (i + 1),
      title: it.title.length > 40 ? it.title.slice(0, 40) + '…' : it.title,
      source: feed.label + ' · RSS 摘要（个人学习用）',
      accent: feed.accent,
      level: '6.5-7.5',
      topic: '时事新闻',
      intro: it.link ? '原文：' + it.link : '',
      sentences: sents.length >= 4 ? sents : splitSentences(it.title + '. ' + it.desc),
      vocab: extractVocab(sents, VOCAB_DICT),
      link: it.link
    };
  }).filter(p => p.sentences && p.sentences.length >= 3);

  return {
    id: 'rss-' + feed.name,
    name: feed.label + ' · ' + new Date().toISOString().slice(0, 10),
    type: 'passage',
    generatedAt: new Date().toISOString(),
    items: passages
  };
}

/* ---------------- manifest 版本管理 ---------------- */
function bumpManifest(packFile, packMeta) {
  const mf = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const exist = mf.packs.find(p => p.id === packMeta.id);
  if (exist) { exist.file = packFile; exist.version++; exist.name = packMeta.name; }
  else mf.packs.push({ id: packMeta.id, name: packMeta.name, type: 'passage', file: packFile, version: 1 });
  mf.version = (mf.version || 0) + 1;
  mf.updatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(manifestPath, JSON.stringify(mf, null, 2));
  return mf.version;
}

/* ---------------- 主流程 ---------------- */
const VOCAB_DICT = loadVocabDict();

async function getXML(feed) {
  if (feed.file) return fs.readFileSync(feed.file, 'utf8');   // 本地文件模式（离线/人工投递）
  const res = await fetch(feed.url, { headers: { 'User-Agent': 'VocaBridge-ContentBot/1.0' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

(async () => {
  for (const feed of feeds) {
    try {
      console.log('抓取', feed.label, '…');
      const xml = await getXML(feed);
      const items = parseRSS(xml);
      if (!items.length) throw new Error('未解析到内容');
      const pack = buildPassagePack(feed, items);
      const file = 'content/packs/rss-' + feed.name + '.json';
      fs.mkdirSync(packsDir, { recursive: true });
      fs.writeFileSync(path.join(rootDir, file), JSON.stringify(pack, null, 2));
      const v = bumpManifest(file, { id: pack.id, name: pack.name });
      console.log('  ✔', pack.items.length, '篇素材 →', file, '| manifest → v' + v);
    } catch (e) {
      console.log('  ✗', feed.label, '失败：', e.message);
    }
  }
  console.log('\n完成。用户下次打开应用（http/https 部署版）会自动收到新内容。');
})();
