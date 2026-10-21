/* 把 vocabridge 多文件版打成单文件 HTML：dist/VocaBridge-单文件版.html */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

const scriptTags = html.match(/<script src="([^"]+)"><\/script>/g) || [];
const scripts = scriptTags.map(t => t.match(/src="([^"]+)"/)[1]);

let body = html
  .replace(/<link rel="stylesheet" href="style.css">/, '<style>\n' + css + '\n</style>')
  .replace(/<script src="[^"]+"><\/script>/g, '');

const bundled = scripts.map(s => {
  const code = fs.readFileSync(path.join(root, s), 'utf8');
  return '<script>\n/* ===== ' + s + ' ===== */\n' + code + '\n</script>';
}).join('\n');

body = body.replace('</body>', bundled + '\n</body>');

const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'VocaBridge-单文件版.html');
fs.writeFileSync(out, body);
console.log('打包完成:', out, '| 大小', Math.round(body.length / 1024), 'KB');
