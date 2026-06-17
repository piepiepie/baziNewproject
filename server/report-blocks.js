/**
 * report-blocks.js
 *
 * 把前端硬编码的命理计算与模板文案下沉到后端，为每个用户档案生成结构化 blocks[]。
 * 前端只负责遍历 blocks 数组、按 type 渲染对应组件——零计算、纯展示。
 */

// ─── 五行分类 ───
function elementClass(glyph) {
  // 天干地支
  if ("甲乙寅卯".includes(glyph)) return "wood";
  if ("丙丁巳午".includes(glyph)) return "fire";
  if ("戊己辰戌丑未".includes(glyph)) return "earth";
  if ("庚辛申酉".includes(glyph)) return "metal";
  if ("壬癸亥子".includes(glyph)) return "water";
  // 五行中文名
  if (glyph === "木") return "wood";
  if (glyph === "火") return "fire";
  if (glyph === "土") return "earth";
  if (glyph === "金") return "metal";
  if (glyph === "水") return "water";
  return "earth";
}

function elementName(key) {
  return { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" }[key] || key;
}

function supportElements(key) {
  return { wood: ["water"], fire: ["wood"], earth: ["fire"], metal: ["earth"], water: ["metal"] }[key] || [];
}

function tenGodElement(label) {
  if (["比肩", "劫财"].includes(label)) return "water";
  if (["食神", "伤官"].includes(label)) return "wood";
  if (["偏财", "正财"].includes(label)) return "fire";
  if (["七杀", "正官"].includes(label)) return "earth";
  return "metal";
}

function getZodiac(branch) {
  return { 子: "鼠", 丑: "牛", 寅: "虎", 卯: "兔", 辰: "龙", 巳: "蛇", 午: "马", 未: "羊", 申: "猴", 酉: "鸡", 戌: "狗", 亥: "猪" }[branch] || "生肖";
}

// ─── 基础计算 ───

function getElementStats(profile, chart) {
  const weights = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  // 天干地支权重 ×2
  Object.values(profile.pillars).forEach((pillar) => {
    weights[elementClass(pillar[0])] += 2;
    weights[elementClass(pillar[1])] += 2;
  });

  // 藏干权重
  Object.values(chart?.bazi?.fourPillars || {}).forEach((pillar) => {
    pillar.hiddenStems?.forEach((stem) => {
      weights[elementClass(stem.stem)] += stem.qiType === "本气" ? 1.2 : 0.6;
    });
  });

  const total = Object.values(weights).reduce((sum, v) => sum + v, 0) || 1;
  const keyMap = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };

  return Object.entries(weights).map(([key, value]) => ({
    key,
    label: keyMap[key],
    value,
    percent: Math.round((value / total) * 100),
    element: key
  }));
}

function getTenGodStats(profile, chart) {
  const labels = ["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"];
  const counts = Object.fromEntries(labels.map((l) => [l, 0]));

  Object.values(profile.tenGods).forEach((god) => counts[god] = (counts[god] || 0) + 2);

  Object.values(chart?.bazi?.fourPillars || {}).forEach((pillar) => {
    if (pillar.tenGod) counts[pillar.tenGod] = (counts[pillar.tenGod] || 0) + 1;
    pillar.hiddenStems?.forEach((stem) => counts[stem.tenGod] = (counts[stem.tenGod] || 0) + 0.7);
  });

  const total = Object.values(counts).reduce((sum, v) => sum + v, 0) || 1;

  return labels.map((label) => ({
    key: label,
    label,
    value: counts[label] || 0,
    percent: Math.round(((counts[label] || 0) / total) * 100),
    element: tenGodElement(label)
  }));
}

function getStrengthProfile(dayMaster, elementStats) {
  const dayElement = elementClass(dayMaster);
  const support = supportElements(dayElement);
  const score = elementStats
    .filter((item) => item.element === dayElement || support.includes(item.element))
    .reduce((sum, item) => sum + item.percent, 0);
  const level = score >= 58 ? "strong" : score <= 38 ? "weak" : "balanced";
  return {
    score,
    level,
    label: level === "strong" ? "身旺" : level === "weak" ? "身弱" : "中和",
    title: level === "strong" ? "身旺，宜泄耗制化" : level === "weak" ? "身弱，宜生扶护身" : "中和，宜顺势成局"
  };
}

function getUsefulGods(dayMaster, level) {
  const dayElement = elementClass(dayMaster);
  const cycles = ["wood", "fire", "earth", "metal", "water"];
  const index = cycles.indexOf(dayElement);
  const produces = cycles[(index + 1) % cycles.length];
  const controls = cycles[(index + 2) % cycles.length];
  const supports = cycles[(index + 4) % cycles.length];

  const primary = level === "strong"
    ? [elementName(produces), elementName(controls)]
    : level === "weak"
      ? [elementName(supports), elementName(dayElement)]
      : [elementName(produces), elementName(supports)];

  const avoid = level === "strong"
    ? [elementName(supports), elementName(dayElement)]
    : [elementName(controls), elementName(produces)];

  return { primary, avoid };
}

function getShenShaGroups(chart) {
  const all = Object.values(chart?.bazi?.fourPillars || {}).flatMap((pillar) => pillar.shenSha || []);
  const unique = Array.from(new Set(all)).filter(Boolean);

  if (!unique.length) {
    return [
      { title: "桃花多多", items: ["桃花", "红艳", "天喜"] },
      { title: "聪明伶俐", items: ["文昌贵人", "太极贵人", "华盖"] },
      { title: "领导才能", items: ["将星"] },
      { title: "贵人相助", items: ["天德贵人", "月德贵人", "福星贵人"] }
    ];
  }

  return [
    { title: "贵人相助", items: unique.filter((item) => item.includes("贵人")).slice(0, 6) },
    { title: "才华气质", items: unique.filter((item) => ["华盖", "文昌", "天喜", "桃花", "红艳"].some((key) => item.includes(key))).slice(0, 6) },
    { title: "行动与权柄", items: unique.filter((item) => ["将星", "驿马", "羊刃", "禄"].some((key) => item.includes(key))).slice(0, 6) },
    { title: "其他提示", items: unique.slice(0, 8) }
  ].map((group) => ({ ...group, items: group.items.length ? group.items : ["待补充"] }));
}

function getPatternProfile(profile, chart, strength) {
  const dayStem = chart?.bazi?.dayMaster || profile.pillars.day[0];
  const branches = Object.values(profile.pillars).map((pillar) => pillar[1]);
  const fourPillars = chart?.bazi?.fourPillars || {};
  const monthGod = profile.tenGods.month;

  const hasYangRen = Object.values(fourPillars).some((p) => p.shenSha?.some((name) => name.includes("羊刃")));
  const hasSevenKill = Object.values(fourPillars).some((p) => p.tenGod === "七杀" || p.hiddenStems?.some((s) => s.tenGod === "七杀"));
  const hasWaterCombo = ["申", "子", "辰"].every((b) => branches.includes(b));

  let name = `${monthGod || strength.label}成格`;
  if (hasYangRen && hasSevenKill) name = "羊刃格，宜驾杀成权";
  if (hasWaterCombo) name = "三合成局，宜顺势疏导";

  const tags = Array.from(new Set([
    hasYangRen ? "羊刃" : "月令",
    hasSevenKill ? "七杀" : monthGod,
    hasWaterCombo ? "申子辰三合" : strength.label,
    ...(profile.focus || [])
  ].filter(Boolean))).slice(0, 8);

  return {
    name,
    subtitle: `${dayStem}日主 · ${strength.label} · ${profile.fortune}`,
    description: `${name}。此格局来自月令、日主强弱、地支成局、十神透藏和神煞共同判断；适合把旺处转成秩序，把才华与资源落到长期目标上。`,
    tags
  };
}

function getYinYang(profile) {
  const chars = Object.values(profile.pillars).join("");
  const yang = Array.from(chars).filter((c) => "甲丙戊庚壬子寅辰午申戌".includes(c)).length;
  const yin = Math.max(chars.length - yang, 0);
  const percent = Math.round((yang / Math.max(chars.length, 1)) * 100);
  return { yang, yin, percent };
}

// ─── 日柱详解 ───
function getDayPillarDetail(profile, chart) {
  const day = profile.pillars.day;
  const pillar = chart?.bazi?.fourPillars?.day;
  const hiddenStemLabels = pillar?.hiddenStems?.map((s) => s.tenGod).join("、") || "藏干待排盘";
  const tenGodLabel = profile.tenGods.day;
  const diShi = pillar?.diShi || "待排盘";
  const naYin = pillar?.naYin || "纳音待排盘";

  return {
    ganZhi: day,
    tenGod: tenGodLabel,
    diShi,
    naYin,
    hiddenGods: hiddenStemLabels,
    description: `${diShi}，用于判断内在稳定性、行动韧性和自我认同。`
  };
}

// ─── 主函数 ───

function generateReportBlocks(profile, chart) {
  const elementStats = getElementStats(profile, chart);
  const tenGodStats = getTenGodStats(profile, chart);
  const dayMaster = chart?.bazi?.dayMaster || profile.pillars.day[0];
  const strength = getStrengthProfile(dayMaster, elementStats);
  const useful = getUsefulGods(dayMaster, strength.level);
  const shenShaGroups = getShenShaGroups(chart);
  const pattern = getPatternProfile(profile, chart, strength);
  const yinYang = getYinYang(profile);
  const dayPillar = getDayPillarDetail(profile, chart);
  const yearBranch = profile.pillars.year[1];
  const zodiac = getZodiac(yearBranch);

  // 日柱对应的十神关系字符串
  const dayHiddenGods = chart?.bazi?.fourPillars?.day?.hiddenStems?.map((s) => s.tenGod).join("、") || "藏干待排盘";
  const dayTenGodRel = `${profile.tenGods.day}坐${dayHiddenGods}`;

  return {
    profileId: profile.id,
    generatedAt: new Date().toISOString(),
    dayMaster: elementName(elementClass(dayMaster)),
    blocks: [
      // 1. 格局
      {
        id: "pattern",
        type: "pattern",
        title: "格局",
        summary: pattern.description,
        data: {
          name: pattern.name,
          subtitle: pattern.subtitle,
          description: pattern.description,
          tags: pattern.tags
        }
      },

      // 2. 五行
      {
        id: "elements",
        type: "elements",
        title: "五行",
        summary: `五行统计来自天干、地支和藏干权重。当前最需要关注的是${useful.primary.join("、")}，用于平衡命局结构并形成稳定输出。`,
        data: {
          stats: elementStats.map((item) => ({
            key: item.key,
            label: item.label,
            percent: item.percent,
            element: item.element
          })),
          usefulPrimary: useful.primary
        }
      },

      // 3. 十神
      {
        id: "ten_gods",
        type: "ten_gods",
        title: "十神",
        summary: "十神用于观察行动模式、资源来源、表达方式和财官结构。比例越高，说明该类能量越容易在性格和现实选择里显化。",
        data: {
          stats: tenGodStats.map((item) => ({
            key: item.key,
            label: item.label,
            percent: item.percent,
            element: item.element
          }))
        }
      },

      // 4. 神煞
      {
        id: "shen_sha",
        type: "shen_sha",
        title: "神煞",
        summary: "神煞为命盘辅助标签，需结合格局和十神整体判断。",
        data: {
          groups: shenShaGroups
        }
      },

      // 5. 命局强弱
      {
        id: "strength",
        type: "strength",
        title: "命局强弱",
        summary: `综合同党、生扶、月令和地支根气估算，判断为${strength.label}。`,
        data: {
          dayMaster: elementName(elementClass(dayMaster)),
          level: strength.level,
          label: strength.label,
          score: strength.score,
          description: "综合同党、生扶、月令和地支根气估算"
        }
      },

      // 6. 喜用神
      {
        id: "useful_gods",
        type: "useful_gods",
        title: "喜用神",
        summary: `结合当前${profile.fortune}，喜用神会决定职业方向、内容表达、环境选择和年度策略。`,
        data: {
          primary: useful.primary,
          avoid: useful.avoid,
          primaryElements: useful.primary.map((name) => ({ name, element: elementClass(name) })),
          fortune: profile.fortune
        }
      },

      // 7. 阴阳
      {
        id: "yin_yang",
        type: "yin_yang",
        title: "阴阳",
        summary: `阳性 ${yinYang.yang} 个，阴性 ${yinYang.yin} 个。阴阳比例用于观察外放程度、决策速度和情绪调节方式。`,
        data: {
          yang: yinYang.yang,
          yin: yinYang.yin,
          percent: yinYang.percent
        }
      },

      // 8. 生肖
      {
        id: "zodiac",
        type: "zodiac",
        title: "生肖",
        summary: `${zodiac}年出生的人，年柱代表外在身份、早年环境和社会第一印象。结合四柱整体，生肖只做辅助入口。`,
        data: {
          zodiac,
          branch: yearBranch,
          description: `${zodiac}年出生的人，年柱代表外在身份、早年环境和社会第一印象。结合四柱整体，生肖只做辅助入口，最终仍以完整命盘结构为准。`
        }
      },

      // 9. 日柱详解
      {
        id: "day_pillar",
        type: "day_pillar",
        title: "日柱详解",
        summary: "日柱是命主的自我核心，由日干、日支、藏干、星运和纳音规则生成。",
        data: {
          ganZhi: dayPillar.ganZhi,
          diShi: dayPillar.diShi,
          naYin: dayPillar.naYin,
          tenGodRel: dayTenGodRel,
          description: `${dayPillar.diShi}，用于判断内在稳定性、行动韧性和自我认同。`
        }
      },

      // 10. 调候
      {
        id: "adjustment",
        type: "adjustment",
        title: "调候",
        summary: `调候关注命局气候，不只看五行多少。当前建议优先补足${useful.primary.join("、")}相关的环境、职业属性和行为节奏。`,
        data: {
          usefulPrimary: useful.primary
        }
      },

      // 11. 阴阳五行流通
      {
        id: "flow",
        type: "flow",
        title: "阴阳五行流通",
        summary: `流通图用于观察天干地支之间的生克路径。当前优先让${useful.primary.join("、")}形成稳定通关，再做事业与关系策略。`,
        data: {
          pillars: [
            { label: "年柱", gan: profile.pillars.year[0], zhi: profile.pillars.year[1] },
            { label: "月柱", gan: profile.pillars.month[0], zhi: profile.pillars.month[1] },
            { label: "日柱", gan: profile.pillars.day[0], zhi: profile.pillars.day[1] },
            { label: "时柱", gan: profile.pillars.hour[0], zhi: profile.pillars.hour[1] }
          ],
          usefulPrimary: useful.primary
        }
      }
    ],

    // 个性报告文案（包含日主变量替换）
    personality: generatePersonalityReport(profile, chart, dayMaster, strength.label, useful)
  };
}

/**
 * 生成个性报告——文案中替换{dayMaster}、{fortune}、{label}等占位符
 */
function generatePersonalityReport(profile, chart, dayMaster, label, useful) {
  const fortune = profile.fortune;
  const dayMasterName = dayMaster;

  return {
    summary: `命主为${dayMasterName}日主，生于${profile.pillars.month[1]}月，自坐${profile.pillars.day[1]}金长生之地。整体气质偏理性、深思、洞察强，外表平静，内在能量流动很快，适合处理复杂信息、战略判断和长期规划。\n\n当前处在${fortune}，大运把表达、产品化和组织能力推到台前。你的优势不是单点执行，而是把复杂经验提炼成方法，再用稳定输出影响别人。`,

    strengths: [
      { title: "悟性极高，洞察力强", text: "能快速看透问题本质，并把零散信息整理成框架。" },
      { title: "内心强大，韧劲十足", text: "遇到压力不容易彻底放弃，越到关键时刻越能扛事。" },
      { title: "重情重义，愿意托底", text: "对认可的人有保护欲，也容易成为团队里的主心骨。" }
    ],

    weaknesses: [
      { title: "思虑过重，行动迟缓", text: "想得太深时，会反复推演，导致启动变慢。" },
      { title: "清高孤傲，不善变通", text: "标准高，容易对低质量沟通失去耐心。" },
      { title: "财务规划需要外部约束", text: "赚钱更多靠能力和资源整合，不能只靠临场感觉。" }
    ],

    talent: {
      talent: "战略思维、表达转化、学习吸收、聚人破局",
      positioning: "洞察型战略家，适合站在高处定方向、做体系",
      workStyle: "启动快、判断准，但需要用节奏管理细节落地",
      currentPhase: `${fortune}，适合知识 IP、咨询产品和长期资产化`
    },

    ziwei: generateZiweiExcerpt(chart)
  };
}

function generateZiweiExcerpt(chart) {
  const palaces = chart?.ziwei?.palaces || [];
  const bodyPalace = palaces.find((item) => item.isBodyPalace);
  const soul = chart?.ziwei?.soul || "待排盘";
  const body = chart?.ziwei?.body || "待排盘";
  const fiveElement = chart?.ziwei?.fiveElement || "待排盘";

  const excerpt = `命主 ${soul}，身主 ${body}，五行局 ${fiveElement}。${
    bodyPalace
      ? `身宫落在${bodyPalace.name}，大限 ${(bodyPalace.decadalRange || []).join("-")}，可重点观察${(bodyPalace.sanFangSiZheng || []).join("、")}。`
      : "完成紫微排盘后，将显示身宫、大限与三方四正。"
  }`;

  return {
    excerpt,
    soul,
    body,
    fiveElement,
    bodyPalace: bodyPalace
      ? {
          name: bodyPalace.name,
          decadalRange: bodyPalace.decadalRange,
          sanFangSiZheng: bodyPalace.sanFangSiZheng
        }
      : null,
    topPalaces: palaces.slice(0, 4).map((palace) => ({
      name: palace.name,
      stemBranch: `${palace.heavenlyStem}${palace.earthlyBranch}`,
      stars: [...(palace.majorStars || []), ...(palace.minorStars || [])].slice(0, 3).map((star) => star.name).join("、") || "无主星"
    }))
  };
}

module.exports = {
  generateReportBlocks,
  // 导出辅助函数供测试
  elementClass,
  getElementStats,
  getTenGodStats,
  getStrengthProfile,
  getUsefulGods,
  getShenShaGroups,
  getPatternProfile,
  getYinYang
};
