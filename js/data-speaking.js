/* ===========================================================
 * 口语模块素材
 * A. 情景模拟 scenarios：海外招聘面试 / 薪酬谈判 / 行为面试 / 远程协作 / 客户沟通 / 外派签证
 * B. 影子跟读 passages：BBC News 风格报道、剧集台词、TED 演讲、雅思高分回答（均为原创仿写文本）
 * =========================================================== */
(function (root) {
  'use strict';

  /* ---------------- A. 情景模拟 ---------------- */
  var scenarios = [
    {
      id: 's-tech', icon: '🎧', title: '海外技术岗 · 视频面试', accent: 'en-US', level: '雅思 6.5+ / 求职必备',
      desc: '硅谷面试官 Dan，45 分钟技术岗初面：自我介绍、项目深挖、为什么回国离职、反问环节。',
      intro: "Hi, thanks for making the time today. I'm Dan, the engineering manager for the platform team. Shall we just dive straight in?",
      first: 'n1',
      nodes: [
        {
          id: 'n1', q: "Great. So — could you walk me through your background? I've had a quick look at your résumé, but I'd rather hear it in your own words.",
          tip: '控制在 60 秒内：现在做什么 → 之前的关键经历 → 为什么来这边。别从大学讲起。',
          probes: [
            { m: ['data', 'pipeline', 'analytics'], say: "Interesting — you mentioned data work. Was that more pipelines or modelling?" },
            { m: ['manage', 'led', 'lead', 'team'], say: "You've led people as well then — how big was the team?" },
            { m: ['startup', 'fintech', 'company'], say: "Nice. And what stage was the company when you joined?" }
          ],
          ack: "Got it — that's a clear picture."
        },
        {
          id: 'n2', q: "Tell me about one project you're genuinely proud of. What was the problem, and what did you actually do?",
          tip: '用 STAR：情境一句、任务一句、动作两句、结果必须量化（百分比/金额/时间）。',
          probes: [
            { m: ['percent', '%', 'reduced', 'improved'], say: "That's a solid number — how did you measure it?" },
            { m: ['team', 'we', 'colleague'], say: "Fair enough. What part was hardest for the team?" },
            { m: ['fail', 'problem', 'bug'], say: "Everyone hits walls on projects — how did you get past this one?" }
          ],
          ack: "Thanks, that's helpful."
        },
        {
          id: 'n3', q: "Why are you looking to leave your current company? And why us, rather than another offer?",
          tip: '离职原因讲 motivation，不讲抱怨；为什么选我们：具体到他们的产品/技术栈/远程文化。',
          probes: [
            { m: ['visa', 'relocat', 'abroad', 'overseas'], say: "I see — so location is part of it. How flexible is your timeline?" },
            { m: ['learn', 'growth', 'career'], say: "Growth came up twice — what specifically do you want to learn here?" },
            { m: ['salary', 'pay', 'raise'], say: "Understood. Let's come back to compensation a bit later." }
          ],
          ack: "Makes sense."
        },
        {
          id: 'n4', q: "How do you handle disagreement? Give me a real example where you and a colleague couldn't agree.",
          tip: '讲过程，不甩锅：先复述对方立场 → 你的论据（用数据） → 折中方案 → 结果。',
          probes: [
            { m: ['compromise', 'agreed', 'consensus'], say: "Good outcome. Would you do it differently now?" },
            { m: ['escalat', 'manager', 'director'], say: "Escalating is sometimes right — how did that land with the team?" }
          ],
          ack: "Appreciate the honesty."
        },
        {
          id: 'n5', q: "Last one from my side: if we brought you in, what would your first ninety days look like?",
          tip: '30/60/90 结构：先听与诊断 → 小胜一个 → 系统化。显示你懂入职节奏。',
          probes: [
            { m: ['audit', 'review', 'read', 'listen'], say: "Good instinct — most people over-build too early." }
          ],
          ack: "Thanks, that's realistic."
        },
        {
          id: 'n6', q: "Take a couple of minutes — anything you'd like to ask me?",
          tip: '问 2 个高质量问题：团队当前最大的技术债？这个岗位怎样才算成功？避免先问假期。',
          probes: [
            { m: ['success', 'outcome', 'kpi'], say: "Nice question — I measure success by delivery predictability, honestly." }
          ],
          ack: "Great questions, genuinely."
        }
      ],
      outro: "Thanks for your time today. We're interviewing the rest of the shortlist this week, and you'll hear from us either way by Friday. Speak soon!"
    },

    {
      id: 's-salary', icon: '💼', title: '薪酬与福利谈判', accent: 'en-US', level: '进阶 · 高压',
      desc: 'HR Priya 电话沟通 offer：首报价、锚定、还价、非现金项（签约金/股权/远程天数）、收尾。',
      intro: "Hi! I'm Priya from People Ops. Good news — we'd love to offer you the Senior Analyst role. Let me walk you through the numbers.",
      first: 'n1',
      nodes: [
        {
          id: 'n1', q: "So, the offer is a base of seventy thousand, plus a ten percent bonus and the standard benefits package. How does that sound?",
          tip: '永远不要当场接受。先感谢 + 表示兴奋 + 要时间：Could I take 24-48 hours to review?',
          probes: [
            { m: ['thank', 'appreciate', 'excited'], say: "Great, glad to hear it. Is there anything specific you'd like clarified?" },
            { m: ['seventy', '70', 'low'], say: "I understand — let me note your concern about base." },
            { m: ['market', 'benchmark'], say: "We do use market data, actually — happy to discuss the band." }
          ],
          ack: "Understood."
        },
        {
          id: 'n2', q: "What were you hoping for, if you don't mind me asking?",
          tip: '给出带理由的锚点：Based on market data for this role in Berlin, I was expecting something closer to eighty.',
          probes: [
            { m: ['market', 'data', 'benchmark'], say: "That's a reasonable way to look at it." },
            { m: ['eighty', '80'], say: "Eighty is above where we pitched it — that's a bigger gap than I expected." },
            { m: ['flexible'], say: "Flexibility helps. Where do you have room?" }
          ],
          ack: "Let me see what I can do."
        },
        {
          id: 'n3', q: "I can probably get approval for seventy-five — but there's no more room beyond that. Where does that leave us?",
          tip: '接受一部分、换一部分：接受底薪 + 要签约金/股权/加一次 6 个月薪资复议。',
          probes: [
            { m: ['signing', 'sign-on', 'bonus'], say: "A sign-on bonus — that might actually be easier for me to approve." },
            { m: ['equity', 'stock', 'shares'], say: "Equity is possible, yes, subject to board approval." },
            { m: ['review', 'six months', '6 months'], say: "A six-month compensation review, I can probably commit to that." }
          ],
          ack: "OK, I'm making notes."
        },
        {
          id: 'n4', q: "Beyond cash, anything else that matters to you? Remote days, learning budget, start date?",
          tip: '挑你真正想要的高效价 Arguments：远程天数、学习预算、提前入职/延后入职。',
          probes: [
            { m: ['remote', 'hybrid', 'home'], say: "We're two days on site as standard — three I could justify." },
            { m: ['course', 'training', 'conference'], say: "We do have a training budget — usually fifteen hundred a year." }
          ],
          ack: "Noted."
        },
        {
          id: 'n5', q: "So if I put seventy-five in writing today, with the extras we discussed — could you sign by Friday?",
          tip: '给出承诺但留核实空间：I’m prepared to sign once I’ve seen it in writing.',
          probes: [
            { m: ['writing', 'contract', 'written'], say: "Of course — I'll send the written offer this evening." },
            { m: ['friday', 'monday', 'week'], say: "Good, I'll note the timeline." }
          ],
          ack: "Perfect."
        }
      ],
      outro: "Lovely — thanks for being straightforward, it makes my job much easier. The written offer will be in your inbox tonight. Good luck and welcome aboard!"
    },

    {
      id: 's-star', icon: '⭐', title: '行为面试 · STAR', accent: 'en-GB', level: '雅思 6.0-7.0',
      desc: '英式招聘官 Helen：用 STAR 讲一次失败、一次领导力经历、一次跨部门冲突。',
      intro: "Good morning. I'm Helen, hiring manager for operations. I like asking behaviour-based questions, so take your time with examples.",
      first: 'n1',
      nodes: [
        {
          id: 'n1', q: "Tell me about a time you made a mistake at work. What happened, and what did you do about it?",
          tip: '承认具体错误（不要假 vaccine），讲你如何纠正、别人如何受益、你改了什么系统。',
          probes: [
            { m: ['report', 'data', 'error'], say: "Right — and did anyone else catch it before you did?" },
            { m: ['process', 'checklist', 'system'], say: "Systems-level fixes usually stick better. Good." }
          ],
          ack: "Thank you, that's honest."
        },
        {
          id: 'n2', q: "Describe a situation where you had to persuade someone who disagreed with you.",
          tip: '对方立场先复述 → 你的证据 → 折中 → 结果。用具体的 numbers 而不是 "very convincing"。',
          probes: [
            { m: ['data', 'evidence', 'figures'], say: "Evidence tends to win arguments — smart move." },
            { m: ['compromise', 'middle'], say: "A compromise shows maturity. Fine." }
          ],
          ack: "Thanks."
        },
        {
          id: 'n3', q: "What's the most difficult feedback you've ever received?",
          tip: '讲你当时的反应（真实） → 你如何消化 → 三个月后的可量化变化。',
          probes: [
            { m: ['manager', 'review', 'appraisal'], say: "Tough appraisals are often the most useful ones." },
            { m: ['changed', 'improved', 'worked on'], say: "So you acted on it — that's the bit people forget." }
          ],
          ack: "Alright."
        },
        {
          id: 'n4', q: "And finally — a time you had to deliver something with almost no notice.",
          tip: '时间压力题：先问清范围 → 砍到 MVP → 沟通风险 → 交付结果。',
          probes: [
            { m: ['scope', 'prioritis', 'mvp'], say: "Cutting scope first is usually the right call." }
          ],
          ack: "Excellent."
        }
      ],
      outro: "That was a really structured set of answers. We'll be in touch by email with the next steps — thanks for coming in."
    },

    {
      id: 's-standup', icon: '🌐', title: '远程团队 · 每日站会', accent: 'en-US', level: '实用 · 高频',
      desc: '分布式团队站会：同步进展、卡点求助、跨时区协调，练口语连贯性与职场节奏。',
      intro: "Morning everyone! Quick round — sixteen minutes, then we'll break. Marcus, do you want to kick us off? Oh — actually let's start with you.",
      first: 'n1',
      nodes: [
        {
          id: 'n1', q: "What did you get done yesterday, and what's your focus for today?",
          tip: '结构：done → today → blockers。动词用过去式讲昨天，将来时讲今天。',
          probes: [
            { m: ['blocked', 'stuck', 'waiting'], say: "Blocked on what, exactly? Who owns that on their side?" },
            { m: ['shipped', 'merged', 'delivered'], say: "Nice, that unblocked the front-end then." }
          ],
          ack: "Thanks, clear."
        },
        {
          id: 'n2', q: "There's a production issue in checkout — how much of your headspace can we take for it today?",
          tip: '谈容量要诚实且有余地：I can take it after 2pm, roughly three hours.',
          probes: [
            { m: ['bandwidth', 'capacity', 'hours'], say: "Appreciate the honesty about bandwidth." },
            { m: ['prioritis', 'trade-off'], say: "Trade-offs are fine — what slips if pickup this?" }
          ],
          ack: "Understood."
        },
        {
          id: 'n3', q: "We need to overlap more with the Singapore team — any thoughts on shifting your hours?",
          tip: '协商：提出具体时段 + 条件 + 保留彼此收益：I could start twice a week at 7am if we move the retro.',
          probes: [
            { m: ['twice', '7', 'early'], say: "Twice a week is realistic — I'll put it in the rota." }
          ],
          ack: "Good suggestion."
        },
        {
          id: 'n4', q: "Before we wrap — anything anyone should know that we haven't covered?",
          tip: '收尾提点：风险预警/需要某人的帮助/一个小庆祝。用 "Heads up" / "Quick shout-out".',
          probes: [
            { m: ['heads up', 'risk', 'delay'], say: "Thanks for flagging early — much easier to deal with now." }
          ],
          ack: "Perfect, thanks."
        }
      ],
      outro: "Alright, that's time. Notes in the usual doc. Speak to you tomorrow — enjoy the day everyone!"
    },

    {
      id: 's-client', icon: '🤝', title: '客户提案与答疑', accent: 'en-GB', level: '进阶',
      desc: '向海外客户做 3 分钟提案并应对尖锐提问：价值陈述、证据、异议处理、下一步。',
      intro: "Thanks for joining us today. We've read the brief — but before we present, tell us what prompted the review now.",
      first: 'n1',
      nodes: [
        {
          id: 'n1', q: "In ninety seconds: what do you think is actually driving the drop in activation?",
          tip: '先给结论再给证据：My read is onboarding friction, supported by two data points…',
          probes: [
            { m: ['onboarding', 'friction', 'drop-off'], say: "Friction at onboarding — that matches what we suspected." },
            { m: ['data', 'cohort', 'funnel'], say: "Cohort data, good. How recent is it?" }
          ],
          ack: "Interesting."
        },
        {
          id: 'n2', q: "That all sounds plausible. Why should we believe it will work for us specifically?",
          tip: '用类比案例 + 明确边界条件：We ran something similar with a mid-market client; conditions were X.',
          probes: [
            { m: ['similar', 'client', 'case'], say: "That's reassuring — similar size?" },
            { m: ['pilot', 'test', 'trial'], say: "A pilot is a sensible way to de-risk it." }
          ],
          ack: "Fair point."
        },
        {
          id: 'n3', q: "Honestly? Our last agency over-promised. What stops that happening again?",
          tip: '异议处理：承认顾虑 → 给出可验证的承诺（里程碑 + 失败条款） → 转回价值。',
          probes: [
            { m: ['milestone', 'kpi', 'measure'], say: "Measurable milestones — I like that." },
            { m: ['contract', 'clause', 'commit'], say: "You'd put that in writing? Then we're in business." }
          ],
          ack: "Appreciate the candour."
        },
        {
          id: 'n4', q: "What would you need from us to get started within three weeks?",
          tip: '给清单 + 时间点 + 一个明确请求：access by X, a sponsor by Y, kickoff on Z.',
          probes: [
            { m: ['access', 'data access', 'sponsor'], say: "A named sponsor is usually the bottleneck — good call asking now." }
          ],
          ack: "Noted."
        }
      ],
      outro: "This has been genuinely useful. Send us a short proposal with those milestones and we'll review it internally next week."
    },

    {
      id: 's-visa', icon: '🛂', title: '签证 · 外派 · 入职行政', accent: 'en-GB', level: '实用',
      desc: '与 HR / relocation 顾问：签证担保、搬迁包、入职时间、合同细节确认。',
      intro: "Hello — I'm handling your relocation. Apologies in advance, there's a fair bit of paperwork. Shall we go through it together?",
      first: 'n1',
      nodes: [
        {
          id: 'n1', q: "First thing: do you currently hold any work authorisation here, or will we need full sponsorship?",
          tip: '陈述事实 + 给出文件清单 + 主动问时间表：I hold none, so I believe full sponsorship applies.',
          probes: [
            { m: ['sponsorship', 'certificate', 'cos'], say: "Right — we'll issue the certificate of sponsorship once the role is signed off." },
            { m: ['dependant', 'partner', 'family'], say: "Dependants complicate it slightly — we'll handle that separately." }
          ],
          ack: "Clear."
        },
        {
          id: 'n2', q: "Processing takes between eight and twelve weeks. Does that work with your notice period?",
          tip: '对齐时间：我的 notice period 是一个月，可以 X 起全职；若有空档可提议远程贡献。',
          probes: [
            { m: ['notice', 'one month', 'notice period'], say: "Good — one month fits comfortably." },
            { m: ['remote work', 'start remotely'], say: "Starting remotely is possible, though payroll prefers you on the books first." }
          ],
          ack: "Noted."
        },
        {
          id: 'n3', q: "Regarding the relocation package — flights, temporary housing and some shipping. Anything else you need?",
          tip: '礼貌争取：可否把临时住宿延长一周？配偶签证费用能否报销？用 Could we…/Would it be possible to…',
          probes: [
            { m: ['temporary', 'housing', 'accommodation'], say: "I can ask for an extra week of temporary housing, no promises." },
            { m: ['tax', 'shipping', 'insurance'], say: "Shipping insurance is covered, yes." }
          ],
          ack: "Let me check."
        },
        {
          id: 'n4', q: "Any questions before I send the pack over? It'll all be in writing afterwards.",
          tip: '确认关键：谁承担签证律师费用？如果被拒怎么办？租金押金是否预付？',
          probes: [
            { m: ['lawyer', 'legal fee', 'declined'], say: "Legal fees are on us — and if it's refused we appeal once." }
          ],
          ack: "Good question."
        }
      ],
      outro: "That's everything from my side. The pack lands in your inbox today, and I'll keep you updated every Friday regardless of progress. Welcome to the team!"
    }
  ];

  /* ---------------- B. 影子跟读素材（原创仿写文本） ---------------- */
  var passages = [
    {
      id: 'p-bbc-ai', title: 'AI 监管：布鲁塞尔的下一步', source: 'BBC News · 风格仿写（原创）', accent: 'en-GB', level: '6.5-7.0', topic: '科技 / 政策',
      intro: '语速中等，英式播音腔，适合练习吞音与弱读。',
      sentences: [
        "Regulators in Brussels are preparing the next phase of artificial intelligence rules.",
        "The proposals would require companies to publish detailed training data summaries.",
        "Supporters argue that transparency will restore public confidence in the technology.",
        "Critics, however, warn that compliance costs could squeeze smaller developers out of the market.",
        "Officials insist the measures are proportionate and will not stifle innovation.",
        "A final decision is expected before the end of the year."
      ],
      vocab: [
        { w: 'regulator', cn: '监管机构' }, { w: 'proportionate', cn: '适度的' },
        { w: 'compliance', cn: '合规' }, { w: 'squeeze out', cn: '挤出市场' },
        { w: 'stifle', cn: '扼杀' }
      ]
    },
    {
      id: 'p-bbc-economy', title: '通胀回落，但房价仍高', source: 'BBC News · 风格仿写（原创）', accent: 'en-GB', level: '6.0-6.5', topic: '经济 / 住房',
      intro: '典型的数值播报句式，练数字与单位表达。',
      sentences: [
        "Inflation fell to two point three percent last month, its lowest level in almost three years.",
        "Falling energy prices accounted for most of the decline.",
        "Housing costs, however, continued to rise in every region apart from the north east.",
        "Economists predict that mortgage rates will ease gradually over the coming months.",
        "For first-time buyers, though, the picture remains extremely difficult.",
        "The average deposit is now equivalent to a full year of take-home pay."
      ],
      vocab: [
        { w: 'inflation', cn: '通胀' }, { w: ' mortgage', cn: '按揭贷款' },
        { w: 'deposit', cn: '首付' }, { w: 'take-home pay', cn: '到手工资' },
        { w: 'ease', cn: '回落、缓和' }
      ]
    },
    {
      id: 'p-bbc-health', title: '睡眠研究的新发现', source: 'BBC News · 风格仿写（原创）', accent: 'en-GB', level: '6.5-7.0', topic: '健康 / 科研',
      intro: '学术类话题高频词汇密集，适合雅思口语 Part 3。',
      sentences: [
        "A long-running study has found that irregular sleep patterns may matter more than total hours.",
        "Researchers tracked more than eighty thousand adults over seven years.",
        "Those with wildly varying bedtimes faced a significantly higher risk of heart disease.",
        "Interestingly, the effect persisted even after adjusting for age and smoking.",
        "The authors caution that the findings show association, not causation.",
        "Still, they suggest keeping a regular schedule is a low-cost way to protect your health."
      ],
      vocab: [
        { w: 'long-running', cn: '长期的' }, { w: ' persist', cn: '持续存在' },
        { w: 'association', cn: '相关性' }, { w: 'causation', cn: '因果关系' },
        { w: 'adjust for', cn: '校正（变量）' }
      ]
    },
    {
      id: 'p-bbc-climate', title: '海岸小镇的防洪计划', source: 'BBC News · 风格仿写（原创）', accent: 'en-GB', level: '6.5+', topic: '环境 / 社会',
      intro: '环境类话题，含被动语态与数据描述句式。',
      sentences: [
        "The coastal town of Bramley has become an unlikely testing ground for flood defence.",
        "A scheme costing forty million pounds was approved after two years of consultation.",
        "Engineers will raise the sea wall and restore around ninety hectares of salt marsh.",
        "Restored marsh absorbs wave energy far more effectively than concrete barriers.",
        "Residents were initially sceptical, since earlier plans required several homes to be demolished.",
        "Public support has since grown, with seventy percent now backing the approach."
      ],
      vocab: [
        { w: 'testing ground', cn: '试验场' }, { w: 'salt marsh', cn: '盐沼湿地' },
        { w: 'absorb', cn: '吸收' }, { w: 'sceptical', cn: '怀疑的' },
        { w: 'demolish', cn: '拆除' }
      ]
    },
    {
      id: 'p-office', title: '办公室政治（情景剧风格）', source: '剧集台词 · 风格仿写（原创）', accent: 'en-US', level: '6.0', topic: '职场喜剧 / 日常口语',
      intro: '美剧式快节奏口语，重点练连读、省略句和语气。',
      sentences: [
        "Look, I get that you're under pressure, but this is not how we work.",
        "You sent that email to the client before showing it to anyone on the team.",
        "And now they think we can deliver the whole thing by Thursday.",
        "We can't deliver it by Thursday. We can barely deliver it by the twelfth.",
        "So here's what I need from you: tell them the truth, today, in writing.",
        "If you'd rather I send it, I'll send it. But somebody has to."
      ],
      vocab: [
        { w: 'under pressure', cn: '承受压力' }, { w: 'barely', cn: '几乎不' },
        { w: 'in writing', cn: '以书面形式' }, { w: 'I\'d rather', cn: '我宁可' }
      ]
    },
    {
      id: 'p-drama', title: '一场艰难的谈话（剧集风格）', source: '剧集台词 · 风格仿写（原创）', accent: 'en-GB', level: '6.5', topic: '剧情独白 / 语调控制',
      intro: '英式低沉独白，练重读与停顿节奏。',
      sentences: [
        "I've been sitting here for an hour trying to find the right sentence.",
        "There isn't one, apparently.",
        "The truth is I took a job I wasn't ready for, and I told no one.",
        "For eighteen months I pretended that everything was under control.",
        "It wasn't. And the people who trusted me paid for it.",
        "So I'm telling you now, before someone else does it for me."
      ],
      vocab: [
        { w: 'pretend', cn: '假装' }, { w: 'under control', cn: '在掌控中' },
        { w: 'pay for it', cn: '为此付出代价' }, { w: 'apparently', cn: '看来；显然' }
      ]
    },
    {
      id: 'p-ted', title: '为什么我们要重新定义勤奋', source: 'TED 演讲 · 风格仿写（原创）', accent: 'en-US', level: '7.0', topic: '演讲 / 说服',
      intro: '演讲节奏：短句制造停顿，长句铺陈论证。适合练 fluency。',
      sentences: [
        "We have confused hard work with hours worked.",
        "For most of the twentieth century, that confusion was harmless, because output was easy to count.",
        "It isn't anymore.",
        "Today, the value of your work depends on judgement, timing and the quality of your attention.",
        "None of those improve simply because you stayed later.",
        "So let me leave you with this: busyness is visible, but effectiveness is measurable. Choose the second one."
      ],
      vocab: [
        { w: 'confuse A with B', cn: '混淆 A 与 B' }, { w: 'output', cn: '产出' },
        { w: 'judgement', cn: '判断力' }, { w: 'busyness', cn: '瞎忙' },
        { w: 'measurable', cn: '可衡量的' }
      ]
    },
    {
      id: 'p-ted2', title: '关于风险的一句话', source: 'TED 演讲 · 风格仿写（原创）', accent: 'en-US', level: '7.0', topic: '演讲 / 职场心态',
      intro: '适合影子跟读的句子在于逗号后的停顿，注意语流不要断。',
      sentences: [
        "Every meaningful opportunity I have ever taken looked, at the time, like a bad idea.",
        "Moving abroad with no job. Turning down a promotion. Starting again at thirty-four.",
        "The pattern isn't courage.",
        "It's that I stopped asking whether something was safe, and started asking whether I would regret not trying.",
        "Regret has a much longer half-life than fear.",
        "So if you're hesitating about anything right now, that's probably the thing you should do next."
      ],
      vocab: [
        { w: 'meaningful', cn: '有意义的' }, { w: 'promotion', cn: '晋升' },
        { w: 'half-life', cn: '半衰期（比喻持续的时间）' }, { w: 'hesitate', cn: '犹豫' }
      ]
    },
    {
      id: 'p-ielts1', title: '雅思 Part 2 · 描述一次改变计划', source: '雅思口语高分回答 · 原创', accent: 'en-GB', level: '7.0+', topic: '雅思 Part 2',
      intro: '两分钟示范回答结构：铺垫场景 → 转折 → 细节 → 收尾感受。',
      sentences: [
        "I'd like to talk about a time when my plans changed completely, which was the spring before last.",
        "I had been preparing for almost a year to take up a research position in Manchester.",
        "Then, about six weeks before the start date, the funding was withdrawn without much warning.",
        "At first I was furious, mainly because I'd already signed a tenancy agreement and paid the deposit.",
        "Looking back, though, that setback pushed me towards a job I enjoy far more.",
        "So I suppose the lesson was that a closed door isn't always a bad thing."
      ],
      vocab: [
        { w: 'take up', cn: '开始担任' }, { w: 'withdraw funding', cn: '撤回资金' },
        { w: 'tenancy agreement', cn: '租约' }, { w: 'setback', cn: '挫折' },
        { w: 'closed door', cn: '被拒的机会' }
      ]
    },
    {
      id: 'p-ielts2', title: '雅思 Part 3 · 远程办公的利弊', source: '雅思口语高分回答 · 原创', accent: 'en-GB', level: '7.0+', topic: '雅思 Part 3',
      intro: '论述类答题模板：先给立场 → 两个论据 → 让步 → 回扣。',
      sentences: [
        "I'd argue that the benefits outweigh the drawbacks, but it depends heavily on the type of work.",
        "For roles that require deep concentration, removing the commute is transformative.",
        "On the other hand, junior staff seem to learn more slowly when they rarely sit next to experienced colleagues.",
        "That said, companies can design around this by pairing people deliberately.",
        "So I don't think the model itself is the problem.",
        "Rather, it's whether managers actually adapt how they support their teams."
      ],
      vocab: [
        { w: 'outweigh', cn: '超过（利弊相比）' }, { w: 'transformative', cn: '革命性的' },
        { w: 'drawback', cn: '弊端' }, { w: 'pair people deliberately', cn: '有意识地配对搭档' },
        { w: 'adapt', cn: '调整、适应' }
      ]
    }
  ];

  root.App = root.App || {};
  root.App.SCENARIOS = scenarios;
  root.App.PASSAGES = passages;
})(typeof window !== 'undefined' ? window : globalThis);
