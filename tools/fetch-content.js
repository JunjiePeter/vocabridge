/* ===========================================================
 * 内容采集器：RSS / Podcast / 文件 → 影子跟读素材包
 * 支持的内容源：
 *   - BBC 新闻/科技/商业（RSS，稳定可用）
 *   - The Economist（latest RSS，可能因订阅墙失败 → 自动跳过；
 *       最可靠的方式是用 --file 手动投递你复制的文章文本）
 *   - TED Talks（podcast RSS + 尽力抓取演讲全文 transcript 作为影子跟读素材）
 *
 * 用法：
 *   node tools/fetch-content.js                                   # 抓全部默认源
 *   node tools/fetch-content.js --feed <url> --name <id>          # 自定义 RSS 源
 *   node tools/fetch-content.js --file <path> --name economist    # 手动投递（最适合付费墙源）
 *
 * 行为：拉取 → 拆句 → 匹配内置词库中文释义 → 生成 content/packs/rss-<name>.json
 *       → 自动把 manifest 版本 +1。每个源独立 try/catch，单个源失败不影响其它源。
 *
 * 版权提醒：RSS/文章/演讲文本版权归原媒体所有，仅限个人学习使用，不要二次分发。
 * =========================================================== */
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const packsDir = path.join(rootDir, 'content', 'packs');
const manifestPath = path.join(rootDir, 'content', 'manifest.json');

const DEFAULT_FEEDS = [
  { name: 'bbc-news',  url: 'https://feeds.bbci.co.uk/news/rss.xml',            accent: 'en-GB', label: 'BBC News · Top Stories', level: '6.5-7.5', topic: '时事新闻' },
  { name: 'bbc-tech',  url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', accent: 'en-GB', label: 'BBC News · Technology',  level: '6.5-7.5', topic: '科技' },
  { name: 'bbc-biz',   url: 'https://feeds.bbci.co.uk/news/business/rss.xml',   accent: 'en-GB', label: 'BBC News · Business',    level: '6.5-7.5', topic: '商业' },
  { name: 'economist', url: 'https://www.economist.com/latest/rss.xml',         accent: 'en-GB', label: 'The Economist · Latest', level: '7.0-8.5', topic: '商业与时事',
    note: '订阅墙可能导致失败，失败会自动跳过；可用 --file 手动投递文章文本' },
  { name: 'ted',       url: 'https://feeds.feedburner.com/tedtalks_audio', type: 'ted', accent: 'en-US', label: 'TED Talks · Daily', level: '6.5-8.0', topic: '演讲与观点',
    note: 'podcast RSS + 尽力抓全文 transcript；RSS 失效时可改用 --file 投递讲稿' }
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

/* ---------------- 通用工具 ---------------- */
function stripHtml(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

async function fetchWithTimeout(url, opts = {}, ms = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function getXML(feed) {
  const res = await fetchWithTimeout(feed.url, { headers: { 'User-Agent': 'VocaBridge-ContentBot/1.0' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

/* ---------------- RSS 解析（无依赖，轻量正则） ---------------- */
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
    let desc = get('description');
    // 描述过短时尝试用 content:encoded 补充
    if (desc.length < 60) {
      const ce = get('content:encoded');
      if (ce.length > desc.length) desc = ce;
    }
    const link = get('link');
    const enc = block.match(/<enclosure[^>]*url="([^"]+)"/i);
    const audio = enc ? enc[1] : '';
    if (title && desc) items.push({ title, desc, link, audio });
  }
  return items;
}

/* ---------------- TED：RSS + 尽力抓全文 transcript ---------------- */
async function fetchTED(feed) {
  const xml = await getXML(feed);
  const items = parseRSS(xml);
  if (!items.length) throw new Error('TED RSS 未解析到内容');
  const out = [];
  for (const it of items.slice(0, 6)) {
    let text = it.desc || '';
    const audio = it.audio || '';
    // 尽力抓取演讲全文 transcript（talk 页面公开 JSON 接口）
    try {
      const slug = (it.link.match(/ted\.com\/talks\/([a-z0-9_\-]+)/i) || [])[1];
      if (slug) {
        const tRes = await fetchWithTimeout(
          'https://www.ted.com/talks/' + slug + '/transcript.json?language=en',
          { headers: { 'User-Agent': 'VocaBridge-ContentBot/1.0' } }
        );
        if (tRes.ok) {
          const tj = await tRes.json();
          const paras = (tj.paragraphs || [])
            .map(p => (p.cues || []).map(c => c.text).join(' '))
            .join(' ');
          if (paras && paras.length > text.length) text = paras;
        }
      }
    } catch (e) { /* transcript 抓取失败则回退到描述 */ }
    out.push({ title: it.title, desc: text, link: it.link, audio });
  }
  return out;
}

/* ---------------- 手动投递（--file）：最适合付费墙源 ---------------- */
function readFileFeed(feed) {
  const raw = fs.readFileSync(feed.file, 'utf8');
  const chunks = raw.split(/\n\s*\n+/).map(s => s.trim()).filter(Boolean);
  // 单块（没有空行分隔）整体作为一篇；多块按篇拆分
  return (chunks.length > 1 ? chunks : [raw])
    .map(c => ({ title: c.slice(0, 40), desc: c, link: '', audio: '' }));
}

/* ---------------- 统一入口：按源类型分发 ---------------- */
async function fetchFeedItems(feed) {
  if (feed.file) return readFileFeed(feed);
  if (feed.type === 'ted') return fetchTED(feed);
  const xml = await getXML(feed);
  return parseRSS(xml);
}

/* ---------------- 拆句 ---------------- */
function splitSentences(text) {
  return String(text)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => {
      const w = s.split(/\s+/).length;
      return w >= 5 && w <= 34 && /[a-z]/i.test(s);
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
    let sents = splitSentences(it.desc).slice(0, 8);
    if (sents.length < 2) sents = splitSentences(it.title + '. ' + it.desc).slice(0, 8);
    return {
      id: 'rss-' + feed.name + '-' + (i + 1),
      title: it.title.length > 40 ? it.title.slice(0, 40) + '…' : it.title,
      source: feed.label + ' · 个人学习用',
      accent: feed.accent,
      level: feed.level || '6.5-7.5',
      topic: feed.topic || '时事新闻',
      intro: it.link ? '原文：' + it.link : '',
      sentences: sents,
      vocab: extractVocab(sents, VOCAB_DICT),
      link: it.link,
      audio: it.audio || ''   // podcast 音频（TED/BBC 音频源），供后续原生听力播放
    };
  }).filter(p => p.sentences && p.sentences.length >= 1);

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

(async () => {
  for (const feed of feeds) {
    try {
      console.log('抓取', feed.label, '…');
      if (feed.note) console.log('   （' + feed.note + '）');
      const items = await fetchFeedItems(feed);
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
