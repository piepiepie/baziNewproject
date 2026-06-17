/**
 * 紫微斗数运限核心引擎
 */
import { createAstrolabeWithTrueSolar, DI_ZHI, LUCUN_TABLE } from '../ziwei/shared.js';
/** 流昌/流曲查表：年干 → [流昌地支, 流曲地支] */
const FLOW_CHANG_QU_TABLE = {
    '甲': ['巳', '酉'], '乙': ['午', '申'], '丙': ['申', '午'],
    '丁': ['酉', '巳'], '戊': ['申', '午'], '己': ['酉', '巳'],
    '庚': ['亥', '卯'], '辛': ['子', '寅'], '壬': ['寅', '子'],
    '癸': ['卯', '亥'],
};
/** 流魁查表（天魁）：年干 → 地支 */
const FLOW_KUI_TABLE = {
    '甲': '丑', '戊': '丑', '庚': '丑',
    '乙': '子', '己': '子',
    '丙': '亥', '丁': '亥',
    '壬': '卯', '癸': '卯',
    '辛': '午',
};
/** 流钺查表（天钺）：年干 → 地支 */
const FLOW_YUE_TABLE = {
    '甲': '未', '戊': '未', '庚': '未',
    '乙': '申', '己': '申',
    '丙': '酉', '丁': '酉',
    '壬': '巳', '癸': '巳',
    '辛': '寅',
};
/** 流马查表（天马）：年支 → 地支 */
const FLOW_MA_TABLE = {
    '寅': '申', '午': '申', '戌': '申',
    '申': '寅', '子': '寅', '辰': '寅',
    '巳': '亥', '酉': '亥', '丑': '亥',
    '亥': '巳', '卯': '巳', '未': '巳',
};
/** 流鸾查表（红鸾）：年支 → 地支 */
const FLOW_LUAN_TABLE = {
    '子': '卯', '丑': '寅', '寅': '丑', '卯': '子',
    '辰': '亥', '巳': '戌', '午': '酉', '未': '申',
    '申': '未', '酉': '午', '戌': '巳', '亥': '辰',
};
/** 计算流年星曜 */
function computeTransitStars(flowYearStem, flowYearBranch, palaces) {
    const result = [];
    const findPalace = (branch) => palaces.find(p => p.earthlyBranch === branch)?.name ?? branch;
    // 流禄：same as 禄存 table
    const liuLuBranch = LUCUN_TABLE[flowYearStem];
    if (!liuLuBranch)
        return result;
    result.push({ starName: '流禄', palaceName: findPalace(liuLuBranch) });
    // 流羊：流禄 +1 palace
    const luIdx = DI_ZHI.indexOf(liuLuBranch);
    if (luIdx >= 0) {
        const yangBranch = DI_ZHI[(luIdx + 1) % 12];
        result.push({ starName: '流羊', palaceName: findPalace(yangBranch) });
        // 流陀：流禄 -1 palace
        const tuoBranch = DI_ZHI[(luIdx - 1 + 12) % 12];
        result.push({ starName: '流陀', palaceName: findPalace(tuoBranch) });
    }
    // 流昌 & 流曲
    const changQu = FLOW_CHANG_QU_TABLE[flowYearStem];
    if (changQu) {
        result.push({ starName: '流昌', palaceName: findPalace(changQu[0]) });
        result.push({ starName: '流曲', palaceName: findPalace(changQu[1]) });
    }
    // 流魁（天魁）
    const kuiBranch = FLOW_KUI_TABLE[flowYearStem];
    if (kuiBranch) {
        result.push({ starName: '流魁', palaceName: findPalace(kuiBranch) });
    }
    // 流钺（天钺）
    const yueBranch = FLOW_YUE_TABLE[flowYearStem];
    if (yueBranch) {
        result.push({ starName: '流钺', palaceName: findPalace(yueBranch) });
    }
    // 流马（天马）
    const maBranch = FLOW_MA_TABLE[flowYearBranch];
    if (maBranch) {
        result.push({ starName: '流马', palaceName: findPalace(maBranch) });
    }
    // 流鸾（红鸾）
    const luanBranch = FLOW_LUAN_TABLE[flowYearBranch];
    if (luanBranch) {
        result.push({ starName: '流鸾', palaceName: findPalace(luanBranch) });
        // 流喜（天喜）= 红鸾对宫（+6）
        const luanIdx = DI_ZHI.indexOf(luanBranch);
        if (luanIdx >= 0) {
            const xiBranch = DI_ZHI[(luanIdx + 6) % 12];
            result.push({ starName: '流喜', palaceName: findPalace(xiBranch) });
        }
    }
    return result;
}
function mapPeriod(item) {
    return {
        index: item.index ?? 0,
        name: item.name ?? '',
        heavenlyStem: item.heavenlyStem ?? '',
        earthlyBranch: item.earthlyBranch ?? '',
        palaceNames: item.palaceNames ?? [],
        mutagen: item.mutagen ?? [],
        ...(typeof item.startAge === 'number' ? { startAge: item.startAge } : {}),
        ...(typeof item.endAge === 'number' ? { endAge: item.endAge } : {}),
    };
}
function resolveTargetDateLabel(targetDate) {
    if (typeof targetDate === 'string' && targetDate) {
        return targetDate;
    }
    if (targetDate instanceof Date) {
        return targetDate.toISOString().slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
}
export function calculateZiweiHoroscopeDataWithAstrolabe(astrolabe, options = {}) {
    const { targetDate, targetTimeIndex } = options;
    const horoscope = astrolabe.horoscope(targetDate, targetTimeIndex);
    const targetDateLabel = resolveTargetDateLabel(targetDate);
    // 流年星曜：from flow year stem + branch
    const flowYearStem = horoscope.yearly?.heavenlyStem ?? '';
    const flowYearBranch = horoscope.yearly?.earthlyBranch ?? '';
    const palaceList = astrolabe.palaces.map(p => ({
        name: p.name,
        earthlyBranch: p.earthlyBranch,
    }));
    const transitStars = (flowYearStem && flowYearBranch)
        ? computeTransitStars(flowYearStem, flowYearBranch, palaceList)
        : undefined;
    // P2: 岁前十二星 & 将前十二星
    const yearlyData = horoscope.yearly;
    let yearlyDecStar;
    if (yearlyData?.yearlyDecStar) {
        const { jiangqian12, suiqian12 } = yearlyData.yearlyDecStar;
        if ((jiangqian12 && jiangqian12.length > 0) || (suiqian12 && suiqian12.length > 0)) {
            yearlyDecStar = {
                jiangqian12: jiangqian12 || [],
                suiqian12: suiqian12 || [],
            };
        }
    }
    const nominalAge = horoscope.age?.nominalAge ?? 0;
    const decadalAgeRange = astrolabe.palaces
        .map((palace) => palace.decadal?.range)
        .find((range) => Array.isArray(range) && range.length === 2 && nominalAge >= range[0] && nominalAge <= range[1]);
    return {
        solarDate: astrolabe.solarDate || '',
        lunarDate: astrolabe.lunarDate || '',
        soul: astrolabe.soul || '',
        body: astrolabe.body || '',
        fiveElement: astrolabe.fiveElementsClass || '',
        targetDate: targetDateLabel,
        hasExplicitTargetTime: typeof targetTimeIndex === 'number',
        decadal: mapPeriod({
            ...(horoscope.decadal ?? {}),
            startAge: decadalAgeRange?.[0],
            endAge: decadalAgeRange?.[1],
        }),
        age: { ...mapPeriod(horoscope.age ?? {}), nominalAge: horoscope.age?.nominalAge ?? 0 },
        yearly: mapPeriod(horoscope.yearly ?? {}),
        monthly: mapPeriod(horoscope.monthly ?? {}),
        daily: mapPeriod(horoscope.daily ?? {}),
        hourly: mapPeriod(horoscope.hourly ?? {}),
        transitStars,
        yearlyDecStar,
    };
}
export function calculateZiweiHoroscopeData(input) {
    const { astrolabe } = createAstrolabeWithTrueSolar(input);
    return calculateZiweiHoroscopeDataWithAstrolabe(astrolabe, {
        targetDate: input.targetDate,
        targetTimeIndex: input.targetTimeIndex,
    });
}
