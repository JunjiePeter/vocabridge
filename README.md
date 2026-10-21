# VocaBridge · 雅思 + 海外求职英语

一个单页离线可用的英语学习工具。直接用浏览器打开 `index.html` 即可，无需安装、无需联网（除可选的 AI 深度点评）。

## 快速开始

- **两个版本**：
  - `index.html`（多文件版）：开发用，目录结构清晰
  - `dist/VocaBridge-单文件版.html`：**双击即用版**，所有代码已打进一个文件，拷到任何设备都能跑
- **推荐浏览器**：Chrome / Edge（Windows / Android 支持语音识别）；iOS Safari 用打字模式
- 页面出现任何脚本错误会弹红色提示（可截图反馈），不会静默卡死
- Safari / Firefox 不支持语音识别时会自动进入**打字模式**，评分逻辑完全一致

## 模块

| 模块 | 内容 |
| --- | --- |
| 📖 单词 | 267 词（178 雅思核心 + 89 求职职场），扇贝式「初识 → 练习 → 自评 → 间隔复习」闭环；练习含英选中 / 中选英 / 听音选义 / 拼写听写 |
| ✍️ 语法 | 14 个专题、70 道题，覆盖完成时、被动、定语从句、虚拟条件句、非谓语、冠词、衔接、倒装强调、图表句型、**中式英语纠偏**、**STAR 面试句型**、职场邮件谈判语气 |
| 🏅 测评 | 参考流利说测评方案：词汇/语法/听力/阅读/口语 各 20 分 → 总分 100，映射 **CEFR（A1-C2）+ 雅思参考分**，五维雷达图 + 针对性学习路径 + 历史成绩对比 |
| 🎙️ 口语 | ① 情景模拟（6 个真实场景，AI 面试官追问）② 影子跟读（10 篇原创仿写素材）③ **视频跟读**（支持 MP4 时间轴逐句跳转 + 自定义视频）④ 自由陈述 Part 2（12+ 张话题卡） |
| 🔁 复习 | SM-2 间隔重复 + 错词本 + 语法错题 + 口语弱句重练，统一排队 |
| 📊 报告 | 近 7 天学习量、口语分数趋势、词库掌握度、高频失分点 |
| ⚙️ 设置 | 每日目标、英音/美音、语速、自动朗读、内容源、数据导出导入 |
| ✍️ 语法 | 14 个专题、70 道题，覆盖完成时、被动、定语从句、虚拟条件句、非谓语、冠词、衔接、倒装强调、图表句型、**中式英语纠偏**、**STAR 面试句型**、职场邮件谈判语气 |
| 🎙️ 口语 | ① 情景模拟（6 个真实场景，AI 面试官追问）② 影子跟读（10 篇原创仿写素材：新闻播报 / 剧集台词 / 演讲 / 雅思范文）③ 自由陈述 Part 2（12 张话题卡） |
| 🔁 复习 | SM-2 间隔重复 + 错词本 + 语法错题 + 口语弱句重练，统一排队 |
| 📊 报告 | 近 7 天学习量、口语分数趋势、词库掌握度、高频失分点 |
| ⚙️ 设置 | 每日目标、英音/美音、语速、自动朗读、数据导出导入 |

## AI 口语老师怎么打分

评分按 **IELTS Speaking 四项标准** 进行（0.5 分档）：

- **流利度 Fluency**：语速（wpm）、填充词密度（um / like / you know）、长停顿、重复口误、衔接词使用
- **词汇 Lexical Resource**：类符/形符比（TTR）、目标词库命中数、重复词、同级词升级建议
- **语法 Grammar**：37 条 ESL 高频错误规则库 + 主谓一致 + 冠词缺失 + 时态冲突 + 从句复杂度
- **发音 Pronunciation**：把你的回答与参考文本做**词级对齐**（编辑距离），输出匹配度、漏读词、听错词
- 最后给出「（流利度+词汇+语法+发音）/4」的总分与逐条纠错报告

### 可选：接大模型做深度点评

在「设置 → AI 深度点评」填入任意 OpenAI 兼容接口的 Base URL / Key / 模型（如 OpenAI、DeepSeek、通义、Kimi、Ollama），口语报告里会多出一个 **✨ GPT 精批** 区块：更细的点评、更准的纠错和一段润色后的参考答案。Key 只存在本机浏览器，不上传任何第三方。

## 数据

全部进度保存在浏览器 localStorage（存储键 `vocabridge_v1`）。可在「设置 → 数据」导出 JSON 备份或导入恢复。**清理浏览器数据会导致进度丢失，重要时请先导出。**

## 内容热更新

单词、跟读素材、情景脚本、话题卡、视频包都以「内容包（JSON）」的形式下发，应用打开时自动检查、无网静默降级：

```
content/manifest.json      版本与包清单
content/packs/*.json       实际内容（词汇/语法/跟读/情景/话题/视频）
```

发布新内容的步骤：
1. 在 `content/packs/` 新建 JSON（格式参考现有 4 个包）
2. 编辑 `content/manifest.json`，把 `version` +1，并在 `packs` 数组里登记新包
3. 把文件夹放回原服务器/静态托管，用户打开应用即自动合并（设置里也能手动「检查更新」）

自定义内容源：「设置 → 内容更新 → 内容源地址」改成你自己的静态托管 URL（如 GitHub Pages / Vercel / CloudStudio），即可用你自己的渠道持续下发。

### 实时嫁接 BBC News（自动采集器）

`tools/fetch-content.js` 把任意 RSS 源直接转成影子跟读素材包：

```bash
# 默认抓 BBC Top / 科技 / 商业三个源
node tools/fetch-content.js

# 自定义任意 RSS
node tools/fetch-content.js --feed "https://feeds.bbci.co.uk/news/world/rss.xml" --name bbc-world --accent en-GB

# 离线/人工投递：用本地 XML 文件
node tools/fetch-content.js --file tools/fixtures/bbc-sample.xml --name bbc-news --label "BBC News · Top Stories"
```

流程：抓 RSS → 提取标题+摘要 → 拆句清洗 → 从内置词库匹配重点词中文释义 → 写入 `content/packs/rss-*.json` → **自动把 manifest 版本号 +1**。应用（http/https 部署版）下次打开即自动合并新素材到「影子跟读」列表。

已配每日 08:30 自动运行（自动化任务「VocaBridge 每日内容采集」）。

> ⚠️ 版权提醒：RSS 摘要版权归原媒体（BBC 等）所有，本流程仅适合**个人学习用途**，不要把采集到的文本二次发布到公开渠道。
> ⚠️ 采集器需要在能访问外网的机器上运行（WorkBuddy 沙盒内网络被限制，请在普通终端跑）。

## 视频跟读

- 视频包格式（`type: "video"`）：`{id, title, source, type: "mp4"|"embed", url, sentences: [{start, end, text}]}`
- `start`/`end` 为秒数，MP4 直链支持点句自动跳转播放该段；嵌入视频（YouTube/Bilibili iframe）只做展示
- 口语页 → 视频跟读 → 「添加自定义视频」可直接粘贴 MP4 链接 + 台词（每行一句，或 `0.0-4.5|句子`）

## 素材说明

词库、语法题、情景脚本均为本工具内置内容；影子跟读素材为**原创仿写文本**（BBC 新闻播报风格、英美剧台词风格、TED 演讲风格、雅思高分回答风格），不使用任何受版权保护的原文素材。

## 文件结构

```
index.html            页面骨架
style.css             样式
dist/                 单文件打包产物（tools/build-single.js 生成）
content/              内容热更新：manifest.json + packs/*.json
js/core.js            状态、localStorage、SM-2 间隔重复算法
js/data-*.js          词库 / 语法 / 口语 / 测评数据
js/speech.js          朗读、语音识别、录音封装
js/evaluator.js       AI 口语评分与纠错引擎
js/content.js         内容热更新加载器（manifest + packs + 本地缓存）
js/ui.js              事件总线（含全局错误提示）与 UI 组件
js/views-*.js         各功能模块视图（含 views-exam.js 测评）
js/app.js             路由与启动
```

## 在线版（GitHub Pages）

已部署到公开仓库，任意设备浏览器直开（含 iOS / 安卓 Safari）：

**https://junjiepeter.github.io/vocabridge/**

- 该地址即多文件版，支持「内容热更新」：打开时自动从 `content/` 拉取最新素材包。
- **内容自动更新**：仓库内置 GitHub Actions 工作流（`.github/workflows/update-content.yml`），每天定时抓取 BBC 等 RSS，生成影子跟读素材并自动提交，手机端打开即为含最新新闻跟读内容的版本。
  - 工作流需仓库的 `workflow` 权限；若你重新生成 PAT，请勾选 `workflow` 作用域后推送该文件即可启用。
  - 也可在仓库 Actions 页面手动 `Run workflow` 立即更新一次。
- 想要自己的在线版：Fork 本仓库 → Settings → Pages 选 `main` 分支 → 得到 `https://你的名.github.io/vocabridge/`。

## 本地维护（开发者）

```bash
git pull                                   # 拉取最新（含 CI 自动提交的内容包）
node tools/fetch-content.js                # 手动采集一次 BBC 新闻（本地预览用）
python -m http.server 8765                 # 本地预览 http://127.0.0.1:8765
```
