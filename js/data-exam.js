/* ===========================================================
 * 英语能力测评题库（参考英语流利说测评方案：听/读/词/法/口 五维）
 * =========================================================== */
(function (root) {
  'use strict';

  /* 听力理解：TTS 播放后选择题 */
  var LISTENING = [
    {
      id: 'L1', text: 'The meeting has been moved from Tuesday morning to Thursday afternoon.',
      q: '会议改到了什么时候？',
      options: ['周二上午', '周二下午', '周四上午', '周四下午'], a: 3,
      cn: '会议从周二上午改到了周四下午。'
    },
    {
      id: 'L2', text: 'Only two of the twelve applicants passed the first screening.',
      q: '有多少人通过了初筛？',
      options: ['2 人', '6 人', '10 人', '12 人'], a: 0,
      cn: '12 个申请人中只有 2 人通过初筛。'
    },
    {
      id: 'L3', text: 'The firm no longer reimburses travel expenses unless the trip is approved in advance.',
      q: '差旅报销的新规则是？',
      options: ['一律不报销', '提前获批才报销', '报销比例提高', '当场报销'], a: 1,
      cn: '除非行程提前获批，否则不再报销差旅费。'
    },
    {
      id: 'L4', text: 'Sales grew by twenty percent, although profit margins actually fell.',
      q: '关于利润，以下哪项正确？',
      options: ['利润上涨 20%', '利润率下降', '销售额下降', '利润率不变'], a: 1,
      cn: '销售额涨了 20%，但利润率实际上下降了。'
    },
    {
      id: 'L5', text: 'The deadline was brought forward by a week.',
      q: '截止日期发生了什么变化？',
      options: ['推迟一周', '提前一周', '取消', '延长一周'], a: 1,
      cn: '截止日期提前了一周。'
    },
    {
      id: 'L6', text: 'Unless we hear otherwise by Friday, we will assume the plan is approved.',
      q: '周五之前没收到回复会怎样？',
      options: ['计划被取消', '默认计划已获批', '周五开会讨论', '要求重新提交'], a: 1,
      cn: '除非周五前另有消息，否则视为计划已获批。'
    }
  ];

  /* 阅读：短文 + 5 题（B2 水平，原创文本） */
  var READING = {
    id: 'R1',
    title: 'The Quiet Cost of Convenience',
    passage:
      'Food delivery apps promised to give people their evenings back. For office workers in big cities, tapping a phone has largely replaced cooking — and for many, that trade feels entirely rational. Yet economists who study household time use have noticed something awkward: the hours saved in the kitchen are rarely spent resting.\n\nIn a survey of three thousand urban workers, respondents who ordered takeaway more than five times a week reported saving roughly forty minutes each evening. When asked what they did with the extra time, most said they worked longer hours, scrolled through short videos, or did both. Only twelve percent said they used the time for exercise or family. The money cost is more visible: frequent users spent, on average, a quarter more on food than those who cooked.\n\nThe researchers do not argue for abandoning convenience altogether. Their point is narrower: convenience is only a benefit when the time it frees is spent deliberately. Otherwise, the evening that was supposed to be saved quietly disappears.',
    questions: [
      {
        q: 'What is the passage mainly about?',
        options: [
          'The rising price of takeaway food',
          'The hidden trade-off behind time-saving apps',
          'How delivery apps work for restaurants',
          'Why urban workers dislike cooking'
        ], a: 1,
        ex: '主旨题：全文谈“省下的时间没用在刀刃上”的隐性代价。'
      },
      {
        q: 'According to the survey, what did most frequent takeaway users do with the saved time?',
        options: [
          'Exercised or spent time with family',
          'Worked longer or watched short videos',
          'Slept earlier than before',
          'Learned to cook'
        ], a: 1,
        ex: '原文第二段：most said they worked longer hours, scrolled through short videos, or did both。'
      },
      {
        q: 'What does “the money cost is more visible” suggest?',
        options: [
          'People notice the spending more than the time loss',
          'Takeaway is becoming cheaper',
          'Cooking is too expensive for most people',
          'The researchers focused only on money'
        ], a: 0,
        ex: '金钱上的代价更容易被察觉，时间代价则不易察觉。'
      },
      {
        q: 'What do the researchers recommend?',
        options: [
          'Stop using delivery apps entirely',
          'Cook every meal at home',
          'Use freed-up time deliberately rather than abandon convenience',
          'Order takeaway no more than five times a week'
        ], a: 2,
        ex: '末段：不是放弃便利，而是“有意识地花掉省下的时间”。'
      },
      {
        q: 'The word “narrower” in the final paragraph is closest in meaning to…',
        options: ['more limited in scope', 'more physical', 'more radical', 'more traditional'], a: 0,
        ex: 'narrower = 范围更窄的、更限定的。'
      }
    ]
  };

  root.App = root.App || {};
  root.App.EXAM_LISTENING = LISTENING;
  root.App.EXAM_READING = READING;
})(typeof window !== 'undefined' ? window : globalThis);
