/* ===========================================================
 * 语法模块：专题知识 + 随堂练习（针对雅思写作/口语 + 职场英文）
 * =========================================================== */
(function (root) {
  'use strict';

  var topics = [
    {
      id: 'g01', title: '现在完成时 vs 一般过去时', level: '核心',
      brief: '雅思口语 Part 1/2 最容易失分的时态。过去时讲「何时发生」，完成时讲「到此刻为止的结果或经历」，不与具体过去时间状语连用。',
      points: [
        { t: '规则 1', d: '与 yesterday / in 2019 / last year 等明确过去时间连用时，只能用一般过去时。' },
        { t: '规则 2', d: '强调「经历」用 ever/never + 现在完成时：I have never worked abroad.' },
        { t: '规则 3', d: '强调「持续到现在」用 for/since + 现在完成时，动词需可持续：I have lived here since 2018.' },
        { t: '加分句', d: '完成时 + recently / so far / up to now 是口语地道标记：So far I have led two launches.' }
      ],
      quiz: [
        { type: 'choice', q: 'I ___ in Berlin since 2019.', options: ['live', 'lived', 'have lived', 'am living'], a: 2, ex: 'since + 持续到现在的动作 → 现在完成时。' },
        { type: 'choice', q: 'Which sentence is CORRECT?', options: ['I have seen her yesterday.', 'I saw her yesterday.', 'I have saw her yesterday.', 'I seen her yesterday.'], a: 1, ex: 'yesterday 是明确过去时间，必须用一般过去时 saw。' },
        { type: 'fill', q: 'So far we ___ (deliver) three versions of the product.', a: ['have delivered'], ex: 'so far + 现在完成时；deliver 过去分词 delivered。' },
        { type: 'choice', q: 'She ___ her current role for two years now.', options: ['has held', 'held', 'holds', 'is holding'], a: 0, ex: 'for + 一段时间到现在，用现在完成时；hold 的过去分词 held。' },
        { type: 'fill', q: 'I ___ (never / work) in a fully remote team before this job.', a: ['have never worked'], ex: 'never + 现在完成时表经历。' }
      ]
    },
    {
      id: 'g02', title: '被动语态与学术客观语气', level: '核心',
      brief: '雅思图表作文、流程图的骨架；职场汇报中弱化执行者、突出结果时也常用。',
      points: [
        { t: '结构', d: 'be + 过去分词，时态体现在 be 上：is carried out / was measured / has been upgraded。' },
        { t: '规则', d: '及物动词才有被动；happen / arise / occur / belong 无被动。' },
        { t: '加分句', d: 'It is widely assumed that… / The data were collected over a six-month period.' },
        { t: '职场用法', d: 'The report will be circulated on Friday.（比 I will send 更中性）' }
      ],
      quiz: [
        { type: 'choice', q: 'The results ___ analysed by two independent teams.', options: ['were', 'was', 'has', 'been'], a: 0, ex: 'results 复数 → were analysed。' },
        { type: 'choice', q: 'Which verb has NO passive form?', options: ['measure', 'happen', 'record', 'collect'], a: 1, ex: 'happen 为不及物动词，无被动。' },
        { type: 'fill', q: 'The new policy will ___ (implement) in April.', a: ['be implemented'], ex: '将来被动：will be + 过去分词。' },
        { type: 'choice', q: 'Choose the most academic version:', options: ['People measured the samples daily.', 'The samples were measured daily.', 'They measured samples every day.', 'We measured the samples every day.'], a: 1, ex: '被动语态去掉执行者，更符合学术客观性。' },
        { type: 'choice', q: 'Much remains ___ about this mechanism.', options: ['to learn', 'to be learned', 'to learning', 'learn'], a: 1, ex: 'something remains to be done 为固定结构。' }
      ]
    },
    {
      id: 'g03', title: '定语从句：限定性 / 非限定性', level: '核心',
      brief: '口语 Part 2 描述人物、地点、经历时最自然的扩展手段，也是写作 CC/ GRA 的加分项。',
      points: [
        { t: '限定性', d: '不加逗号，去掉后句意不完整：The team that I joined was small.' },
        { t: '非限定性', d: '加逗号补充说明，不可用 that，可用 which / who：My manager, who is based in Dublin, joined in 2019.' },
        { t: '省略', d: '关系词作宾语可省略：The project (that) I led saved 20%.' },
        { t: '加分句', d: '介词前置更正式：the company for which I worked / the level at which prices stabilised.' }
      ],
      quiz: [
        { type: 'choice', q: 'My colleague, ___ speaks Japanese, handled the negotiation.', options: ['that', 'who', 'which', 'whose'], a: 1, ex: '非限定定语从句不能用 that，指人用 who。' },
        { type: 'choice', q: 'The company ___ I used to work for restructured.', options: ['who', 'which', 'whose', 'what'], a: 1, ex: '指代物用 which/that，介词后置时只能用 which。' },
        { type: 'fill', q: 'This is the candidate ___ CV impressed us most.', a: ['whose'], ex: '表示所属关系用 whose。' },
        { type: 'choice', q: 'Identify the CORRECT non-defining clause punctuated properly:', options: ['The report which was published last week was positive.', 'The report, which was published last week, was positive.', 'The report that was published last week was positive.', 'The report that was published last week was, positive.'], a: 1, ex: '非限定从句前后都要用逗号隔开。' },
        { type: 'choice', q: 'The platform ___ we rely on handles 40% of traffic.', options: ['what', 'that', 'where', 'whose'], a: 1, ex: 'rely on 的宾语 → 关系代词 that/which，作宾语可省。' }
      ]
    },
    {
      id: 'g04', title: '条件句：真实 / 虚拟 / 混合', level: '进阶',
      brief: '面试里谈「如果我来这是我的节奏」，写作里推演后果，都需要准确的条件句。',
      points: [
        { t: '一类', d: '可能发生：If we ship this week, we will hit the deadline.' },
        { t: '二类', d: '假设/现在相反：If I were given the role, I would restructure reporting.（注意 I were）' },
        { t: '三类', d: '过去相反：If we had tested earlier, we would have avoided the outage.' },
        { t: '混合', d: 'If I had taken that offer, I would be in Singapore now.' }
      ],
      quiz: [
        { type: 'choice', q: 'If I ___ in your position, I would ask for a written offer.', options: ['am', 'was', 'were', 'be'], a: 2, ex: '二类条件句，习惯用 If I were。' },
        { type: 'choice', q: 'If we had budgeted properly, we ___ this shortfall.', options: ['will avoid', 'would avoid', 'would have avoided', 'avoided'], a: 2, ex: '三类条件句：had done + would have done。' },
        { type: 'fill', q: 'If it rains tomorrow, we ___ (cancel) the site visit.', a: ['will cancel'], ex: '一类条件句：主句用将来时。' },
        { type: 'choice', q: 'If he ___ that course, he would be managing a team now.', options: ['took', 'had taken', 'takes', 'has taken'], a: 1, ex: '混合条件：过去行为影响现在结果 → had taken + would be。' },
        { type: 'choice', q: 'Which is the most natural reply in a salary negotiation?', options: ['If you increase base, I will sign today.', 'If you increased base, I sign today.', 'I would be prepared to sign today, provided the base reflected market rate.', 'Unless base increase, I will sign today.'], a: 2, ex: 'provided (that) + 从句，语气专业且不生硬。' }
      ]
    },
    {
      id: 'g05', title: '非谓语动词：分词与不定式', level: '进阶',
      brief: '压缩信息、提升句子密度，是 IELTS Writing GRA 拿 7 的关键。',
      points: [
        { t: 'ing 分词', d: '主动/同时：Employees working remotely report higher satisfaction.' },
        { t: 'ed 分词', d: '被动/完成：The data collected last month were inconclusive.' },
        { t: '垂悬错误', d: '分词逻辑主语须与主句主语一致：✗ Walking into the office, the noise was unbearable. ✓ Walking into the office, I found the noise unbearable.' },
        { t: '加分句', d: 'Having completed the migration, we turned to performance tuning.' }
      ],
      quiz: [
        { type: 'choice', q: '___ the report, she spotted three errors.', options: ['Read', 'Reading', 'To read', 'Having read'], a: 3, ex: '「读完之后」→ 完成式分词 Having read。' },
        { type: 'choice', q: 'Find the dangling modifier:', options: ['Reviewing the data, the trend became obvious.', 'Reviewing the data, we found the trend obvious.', 'Having reviewed the data, we changed the plan.', 'The data, reviewed twice, were consistent.'], a: 0, ex: 'trend 不会 review，主语不一致。' },
        { type: 'fill', q: 'The guidelines ___ (issue) last month apply to all contractors.', a: ['issued'], ex: '被动含义 → 过去分词作后置定语 issued。' },
        { type: 'choice', q: 'Employees ___ for promotion must submit a portfolio.', options: ['consider', 'considering', 'are considered', 'considered'], a: 3, ex: '被动：被考虑的 → considered。' },
        { type: 'choice', q: 'He resigned ___ time for his family.', options: ['making', 'to make', 'made', 'having made'], a: 1, ex: '表目的用不定式 to make。' }
      ]
    },
    {
      id: 'g06', title: '主谓一致与集合名词', level: '基础',
      brief: '口语里最容易「漏 s」和「多加 s」的地方，直接影响 GRA 观感。',
      points: [
        { t: '第三人称', d: 'He manages / She works / The company hires（别漏 -s）。' },
        { t: '不可数', d: 'information / advice / equipment / research / staff 作单数：The research is inconclusive.' },
        { t: '集合名词', d: '英式可复数：The team are arguing → 备考建议统一按美式单数处理更安全。' },
        { t: '就近一致', d: 'A number of applicants are waiting; the number of vacancies is small.' }
      ],
      quiz: [
        { type: 'choice', q: 'The team ___ currently recruiting two engineers.', options: ['is', 'are', 'were', 'be'], a: 0, ex: '备考建议按美式把集合名词视为单数。' },
        { type: 'choice', q: 'Choose the CORRECT sentence.', options: ['The informations are useful.', 'A lot of advices were given.', 'This equipment is expensive.', 'Many research were published.'], a: 2, ex: 'equipment 不可数 → is。' },
        { type: 'fill', q: 'A number of candidates ___ (be) still waiting.', a: ['are'], ex: 'a number of + 复数名词 → 复数动词。' },
        { type: 'choice', q: 'My manager ___ feedback every Friday.', options: ['give', 'giving', 'gives', 'given'], a: 2, ex: '第三人称单数现在时 → gives。' },
        { type: 'choice', q: 'Neither the director nor the assistants ___ available.', options: ['is', 'are', 'was being', 'has been'], a: 1, ex: '就近原则：靠近动词的是复数 assistants。' }
      ]
    },
    {
      id: 'g07', title: '冠词与量词', level: '基础',
      brief: '中文母语者的系统性失分点：抽象/泛指零冠词、具体/首次提及用 a/an、双方共知用 the。',
      points: [
        { t: '零冠词', d: '泛指复数或抽象： Machines replace routine tasks. / Education matters.' },
        { t: 'the 的用法', d: '唯一、双方已知、最高级、序数：the internet, the CEO, the best candidate.' },
        { t: '职业', d: 'I am an engineer.（可数名词单数不能裸奔）' },
        { t: '常见错', d: '✗ the society ✗ in the future(美式常无 the) → in future' }
      ],
      quiz: [
        { type: 'fill', q: 'I am ___ engineer at a mid-sized fintech.', a: ['an'], ex: 'engineer 以元音音素开头 → an。' },
        { type: 'choice', q: '___ employees benefit most from flexible hours?', options: ['The', 'A', 'No article', 'An'], a: 2, ex: '泛指复数零冠词：Employees benefit most…' },
        { type: 'choice', q: 'She was ___ best candidate we interviewed.', options: ['a', 'an', 'the', 'no article'], a: 2, ex: '最高级前用 the。' },
        { type: 'choice', q: '“Every \(blank) counts.” In the sentence “My role covers engineering and product analytics”, what goes before “product analytics”?', options: ['the', 'a', 'no article', 'an'], a: 2, ex: '并列泛指的抽象名词前用零冠词。' },
        { type: 'choice', q: 'Pick the sentence with CORRECT article use:', options: ['The remote work improves retention.', 'Remote work improves retention.', 'A remote work improves retention.', 'The remote works improve retention.'], a: 1, ex: '泛指概念 → 零冠词。' }
      ]
    },
    {
      id: 'g08', title: '衔接与连接词', level: '核心',
      brief: '雅思写作 CC 与口语 FC 的直接得分点；面试回答里用对了会显著更「有条理」。',
      points: [
        { t: '递进', d: 'moreover / in addition / what is more' },
        { t: '对比', d: 'by contrast / whereas / nevertheless / conversely' },
        { t: '因果', d: 'consequently / hence / as a result / owing to' },
        { t: '考场提醒', d: '别滥用 moreover；一篇 Task 2 用 3-4 个高级连接词足够，其余靠指代词衔接。' }
      ],
      quiz: [
        { type: 'choice', q: 'Urban rents are rising; ___, rural rents continue to fall.', options: ['therefore', 'conversely', 'moreover', 'hence'], a: 1, ex: '对比关系用 conversely / by contrast。' },
        { type: 'fill', q: 'Demand fell sharply; ___ consequence, prices dropped.', a: ['in'], ex: '固定搭配 in consequence = 因此。' },
        { type: 'choice', q: 'Which is NOT a comparison marker?', options: ['whereas', 'owing to', 'by contrast', 'conversely'], a: 1, ex: 'owing to 表原因。' },
        { type: 'choice', q: 'Best opening for Part 2 describing a change:', options: ['In contrast to five years ago, I now…', 'Owing to I changed job…', 'Despite of the change…', 'Although but things changed…'], a: 0, ex: 'In contrast to 正确；B 少主语，C despite 不接 of，D 双重连词。' },
        { type: 'choice', q: 'Staff lack ___, most leave within a year.', options: ['Not only…', 'For example…', 'As a result…', 'In addition…'], a: 2, ex: '结果关系 → As a result。' }
      ]
    },
    {
      id: 'g09', title: '强调句与倒装', level: '高阶',
      brief: '少量使用即可提分的「句型武器」：It is … that … / Not only … / Rarely …',
      points: [
        { t: '强调句', d: 'It is clear communication that keeps remote teams aligned.' },
        { t: '否定倒装', d: 'Not only did we cut costs, but we also improved quality.' },
        { t: 'ONLY 倒装', d: 'Only after the audit did they realise the gap.' },
        { t: '考场提醒', d: '倒装属高风险操作，口语用 1 句、写作用 1 句足矣，写错扣分更狠。' }
      ],
      quiz: [
        { type: 'choice', q: 'Not only ___ deadlines, but he also mentored juniors.', options: ['he met', 'did he meet', 'he meets', 'met he'], a: 1, ex: '否定词置句首需助动词倒装：did he meet。' },
        { type: 'fill', q: 'It was my manager ___ encouraged me to apply.', a: ['who', 'that'], ex: '强调人用 who/that 均可。' },
        { type: 'choice', q: 'Only after the review ___ the real issue.', options: ['they spotted', 'did they spot', 'they did spot', 'spotted'], a: 1, ex: 'Only after 置句首 → 部分倒装。' },
        { type: 'choice', q: 'Which is a correct cleft sentence?', options: ['It is the culture what keeps staff.', 'It is the culture that keeps staff.', 'It is the culture keeps staff.', 'That is the culture keeps staff.'], a: 1, ex: '强调句：It is + 被强调部分 + that + 其余。' },
        { type: 'choice', q: 'Rarely ___ such enthusiasm among new hires.', options: ['we have seen', 'have we seen', 'we see', 'did we saw'], a: 1, ex: 'Rarely 开头需倒装，且 did 后须动词原形。' }
      ]
    },
    {
      id: 'g10', title: '情态动词的推测与委婉', level: '进阶',
      brief: '职场沟通的灵魂：must / may / might + 完成时表推测，would / could 表委婉。',
      points: [
        { t: '确定推测', d: 'He must have missed the email.（一定…过了）' },
        { t: '可能推测', d: 'She might have overlooked the deadline.' },
        { t: '委婉请求', d: 'Would you be able to clarify the reporting line?' },
        { t: '谈判语气', d: 'I would be happy to revisit base once targets are agreed.（比 I want more 高级得多）' }
      ],
      quiz: [
        { type: 'choice', q: 'He ___ have missed the briefing; he wasn’t in the room.', options: ['must', 'must to', 'should to', 'can to'], a: 0, ex: 'must have done 表对过去的肯定推测。' },
        { type: 'choice', q: 'Most polite way to ask your interviewer:', options: ['Tell me the salary.', 'Could you share the salary band for this role?', 'I want to know salary now.', 'Salary please.'], a: 1, ex: 'Could you share… 委婉且职业。' },
        { type: 'fill', q: 'I ___ (would) be grateful if you could confirm the start date.', a: ['would'], ex: 'I would be grateful if… 标准书面请求。' },
        { type: 'choice', q: 'They ___ have known about the cut; the memo was sent last week.', options: ['should', 'must not', 'must to', 'may have not'], a: 0, ex: 'should have known 表「本应知道」。' },
        { type: 'choice', q: 'Negotiation line with correct modality:', options: ['I can consider eighty if base is negotiable.', 'I would consider eighty provided base reflected market.', 'I must consider eighty or leave.', 'I shall consider eighty.'], a: 1, ex: 'would + provided 从句是专业谈判句式。' }
      ]
    },
    {
      id: 'g11', title: '数据描述句型（图表作文）', level: '核心',
      brief: 'Task 1 必备：趋势、倍数、占比、波动的成套表达，直接套用即可。',
      points: [
        { t: '趋势', d: 'There was a sharp rise in… / … climbed steadily / … plateaued' },
        { t: '程度副词', d: 'slightly / moderately / sharply / dramatically / marginally' },
        { t: '占比', d: 'accounted for 38% / constituted the largest share / ranged from 12% to 47%' },
        { t: '倍数', d: 'three times as high as / double the figure for 2015' }
      ],
      quiz: [
        { type: 'choice', q: 'The figure ___ sharply between 2010 and 2015.', options: ['rose', 'raised', 'risen', 'rose up'], a: 0, ex: 'rise 为不及物，过去式 rose；raise 及物。' },
        { type: 'fill', q: 'Renewables accounted ___ 38% of total output.', a: ['for'], ex: 'account for 固定搭配。' },
        { type: 'choice', q: 'The number of applications was three times ___ the previous year.', options: ['as high as', 'so high as', 'more higher', 'as higher as'], a: 0, ex: '倍数表达：three times as high as。' },
        { type: 'choice', q: 'Which describes a very small change?', options: ['marginally', 'dramatically', 'considerably', 'substantially'], a: 0, ex: 'marginally = 轻微地。' },
        { type: 'choice', q: 'Best sentence for a plateau:', options: ['It went up and stayed.', 'The figure remained stable at around 40%.', 'The figure became flatly 40%.', 'It stopped into 40%.'], a: 1, ex: 'remained stable at around + 数值。' }
      ]
    },
    {
      id: 'g12', title: '中式英语纠偏', level: '实战',
      brief: '高频「字面翻译」错误清单，改掉这十几条，口语分数能立刻上一个档。',
      points: [
        { t: '✗ I very like it', d: '✓ I like it very much / I’m really into it' },
        { t: '✗ I am interesting in it', d: '✓ I am interested in it' },
        { t: '✗ improve my English level', d: '✓ improve my English（level 冗余）' },
        { t: '✗ Although…but…', d: '✓ Although…,… 或 …, but…（二选一）' },
        { t: '✗ I have 25 years old', d: '✓ I am 25 years old / I am 25' }
      ],
      quiz: [
        { type: 'choice', q: 'Correct the sentence: Although she was junior, but she led the audit.', options: ['Although she was junior, she led the audit.', 'Although she was junior, but she leads the audit.', 'But although she junior, she led.', 'Although she junior but led.'], a: 0, ex: '英语中 although 与 but 不能同时使用。' },
        { type: 'choice', q: 'I look forward to ___ from you.', options: ['hear', 'hearing', 'heard', 'be heard'], a: 1, ex: 'look forward to 的 to 是介词，接动名词。' },
        { type: 'choice', q: 'Which is correct?', options: ['I very much agree? No. I very like it.', 'I like it very much.', 'I very like it.', 'I like very it.'], a: 1, ex: 'very 修饰 much/adj，不能直接放在 verb 前，用 like … very much。' },
        { type: 'fill', q: 'My responsibilities include ___ (coordinate) cross-team reviews.', a: ['coordinating'], ex: 'include + doing。' },
        { type: 'choice', q: 'Best correction of “I have 25 years old”:', options: ['I am 25 years old.', 'I have 25 years.', 'I am having 25.', 'I get 25 years old.'], a: 0, ex: '年龄用 be，不用 have。' }
      ]
    },
    {
      id: 'g13', title: '面试高频句型（STAR）', level: '实战',
      brief: '把经历讲清楚的可复用骨架：Situation–Task–Action–Result，用于行为面试。',
      points: [
        { t: 'Situation', d: 'A couple of years ago our churn rate was rising steadily.' },
        { t: 'Task', d: 'My role was to identify drivers and propose a fix within a month.' },
        { t: 'Action', d: 'I ran interviews with twelve customers and rebuilt the reporting layer.' },
        { t: 'Result', d: 'As a result, churn fell by nine points, which translated into roughly £400k in retained revenue.' }
      ],
      quiz: [
        { type: 'choice', q: 'Which phrase introduces the RESULT best?', options: ['To cut a long story short, I did stuff.', 'As a result, retention improved by nine points.', 'And then it finished.', 'That was the end.'], a: 1, ex: 'As a result + 量化结果 是 STAR 收尾标配。' },
        { type: 'fill', q: 'I was ___ (responsible) for onboarding new analysts.', a: ['responsible'], ex: 'be responsible for 负责某事。' },
        { type: 'choice', q: 'My role ___ to rebuild the reporting layer.', options: ['were', 'was', 'are', 'have been'], a: 1, ex: 'role 单数 → was。' },
        { type: 'choice', q: 'Quantified impact, keep or drop the redundancy?', options: ['improvedefficiency by 20%', 'improved efficiency by 20%', 'improve efficiency 20%', 'efficiency improved 20%'], a: 1, ex: 'improve efficiency by 20%（注意空格与 by）。' },
        { type: 'choice', q: 'Opening a STAR answer in an interview:', options: ['I am a very good leader.', 'Sure — I’d take the restructure last spring as an example.', 'Everything since maybe 2019.', 'Yes I do.'], a: 1, ex: '先搭场景再讲故事。' }
      ]
    },
    {
      id: 'g14', title: '职场邮件与谈判语气', level: '实战',
      brief: '从 offer 沟通、入职协调到日常汇报，一套可复用的正式但不生硬的话术。',
      points: [
        { t: '开口', d: 'Thanks for getting back to me — I appreciate the offer.' },
        { t: '提出诉求', d: 'I was wondering whether there is any flexibility on the base salary.' },
        { t: '设条件', d: 'If you could move to eighty, I’d be happy to sign this week.' },
        { t: '收尾', d: 'I’m keen to make this work — would Tuesday work for a quick call?' }
      ],
      quiz: [
        { type: 'choice', q: 'Softening a request:', options: ['Send me the contract.', 'Could you possibly send the contract when convenient?', 'I need contract.', 'Contract send please.'], a: 1, ex: 'Could you possibly… 是最常用的软化句式。' },
        { type: 'fill', q: 'I’m writing to ___ (follow) up on our conversation.', a: ['follow'], ex: 'to + 动词原形 follow up。' },
        { type: 'choice', q: 'Best way to anchor a number politely:', options: ['I want ninety.', 'Based on market data for this role, I was expecting something closer to ninety.', 'Ninety or nothing.', 'Pay me ninety please.'], a: 1, ex: '引用市场数据 + 委婉锚定。' },
        { type: 'choice', q: 'Closing line that is neither weak nor rude:', options: ['Whatever you decide.', 'I’m keen to make this work — is Tuesday convenient for a short call?', 'Reply fast.', 'No deal otherwise.'], a: 1, ex: '表达合作意愿 + 给出可执行下一步。' },
        { type: 'choice', q: 'Referring to a competing offer without threatening:', options: ['I have a better offer, pay more.', 'I do have another offer on the table, though this role is my preference.', 'Pay more or I leave.', 'Another company will pay.'], a: 1, ex: '陈述事实 + 表达偏好，是专业做法。' }
      ]
    }
  ];

  root.App = root.App || {};
  root.App.GRAMMAR = topics;
})(typeof window !== 'undefined' ? window : globalThis);
