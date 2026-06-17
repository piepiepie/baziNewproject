import type { Agent, ChatMessage, Profile, Skill } from "../types";

export const profiles: Profile[] = [
  {
    id: "profile-niuzi",
    nickname: "牛子",
    gender: "男",
    birthplace: "兰州",
    birthAt: "1981-12-20 08:35:00",
    lunarBirth: "辛酉年 十一月廿五 辰时",
    trueSolarTime: "1981-12-20 07:32:57",
    pillars: {
      year: "辛酉",
      month: "庚子",
      day: "壬申",
      hour: "甲辰"
    },
    tenGods: {
      year: "正印",
      month: "偏印",
      day: "日主",
      hour: "食神"
    },
    fortune: "乙未大运（2026-2035）",
    focus: ["事业定位", "财富策略", "知识 IP", "大运流年"]
  }
];

export const skills: Skill[] = [
  {
    id: "bazi-core-reading",
    name: "八字基础解读",
    version: "1.0.0",
    status: "active",
    description: "读取用户档案，分析格局、强弱、喜忌、核心优势。",
    inputSchema: ["profile", "question", "conversationSummary"],
    outputSchema: ["markdownReport", "confidence", "nextQuestions"],
    prompt: "你是命理分析专家。基于八字档案输出结构化 Markdown 报告，避免泛泛而谈。"
  },
  {
    id: "career-wealth-strategy",
    name: "事业财富策略",
    version: "1.0.0",
    status: "active",
    description: "把命盘解读转化为事业方向、财富模式和阶段性行动计划。",
    inputSchema: ["profile", "question", "baziInsight"],
    outputSchema: ["strategy", "timeline", "risks", "actions"],
    prompt: "结合命盘优势与大运窗口，给出可执行的事业和财富策略。"
  },
  {
    id: "report-template-builder",
    name: "综合报告生成器",
    version: "0.9.0",
    status: "active",
    description: "把多个 skill 的输出整理为标题、表格、引用和行动清单。",
    inputSchema: ["skillOutputs", "reportTemplate"],
    outputSchema: ["markdownReport", "sections"],
    prompt: "按指定模板生成完整报告，使用清晰层级、表格和总结。"
  },
  {
    id: "followup-suggestion",
    name: "追问建议生成",
    version: "1.0.0",
    status: "active",
    description: "根据当前回答生成 3 个高价值追问按钮。",
    inputSchema: ["lastAnswer", "profile", "agent"],
    outputSchema: ["suggestions"],
    prompt: "生成短、具体、能推进咨询深度的追问。"
  },
  {
    id: "ziwei-reading",
    name: "紫微斗数解读",
    version: "0.1.0",
    status: "draft",
    description: "预留：十二宫、大限、流年、四化综合分析。",
    inputSchema: ["ziweiChart", "profile", "question"],
    outputSchema: ["palaceAnalysis", "timeline", "markdownReport"],
    prompt: "预留 skill，待接入紫微排盘服务。"
  }
];

export const agents: Agent[] = [
  {
    id: "cantian-master",
    name: "参天大师",
    avatar: "玄",
    description: "综合八字、运势、事业财富与人生策略的主智能体。",
    greeting: "选择一个档案后，我会结合命盘和上下文给你做连续解读。",
    skillIds: ["bazi-core-reading", "career-wealth-strategy", "report-template-builder", "followup-suggestion"],
    modelProvider: "mock"
  },
  {
    id: "career-coach",
    name: "事业教练",
    avatar: "策",
    description: "聚焦事业定位、个人品牌、知识 IP 和执行路线。",
    greeting: "我们先从你的长板、赛道和当前大运窗口开始。",
    skillIds: ["career-wealth-strategy", "followup-suggestion"],
    modelProvider: "mock"
  },
  {
    id: "ziwei-mentor",
    name: "紫微导师",
    avatar: "斗",
    description: "预留紫微斗数智能体，后续接入排盘与十二宫分析。",
    greeting: "紫微模块已预留，接入排盘服务后可启用。",
    skillIds: ["ziwei-reading", "report-template-builder", "followup-suggestion"],
    modelProvider: "mock"
  }
];

export const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "帮我分析这个命盘的性格优点与缺点、事业定位、做事方式、金钱观，以及当前大运怎么发挥长板。"
  },
  {
    id: "m2",
    role: "assistant",
    content: `## 八字综合命盘报告

### 一、命盘总览

**核心格局：羊刃格 -> 羊刃驾杀**

月令子水劫财当令，地支申子辰三合水局，日主壬水极旺。年柱辛酉、月干庚金、日支申金，金水相生，水势很大，适合做需要战略判断、资源整合和持续输出的事情。

| 维度 | 结论 | 现实表现 |
| --- | --- | --- |
| 天赋 | 战略思维、表达转化、聚人能力 | 能看趋势、拆复杂问题、带团队 |
| 短板 | 执行细节、财务规划、情绪内耗 | 容易想得深但启动慢 |
| 当前阶段 | 乙未大运（2026-2035） | 适合输出、建体系、做个人品牌 |

---

### 二、事业与财富策略

从「项目制赚钱」转向「体系化变现」。把你的知识和经验打包成可复用的产品：课程、咨询体系、内容矩阵或高端顾问服务。

> 当前十年不是单纯冲刺，而是把你的经验变成资产的窗口。

### 三、下一步行动

1. 选一个你最能讲透的细分赛道。
2. 固定一个公开输出阵地。
3. 每周沉淀一篇深度内容，并拆成 3-5 条短内容。`,
    actions: ["我适合哪个细分赛道？", "怎么改善自我拉扯？", "生成一份年度报告"]
  }
];
