import { Solar } from 'lunar-javascript';
import { GUA_CI, HEXAGRAMS, XIANG_CI, YAO_CI } from '../../data/hexagrams.js';
import { XUN_KONG_TABLE as RAW_XUN_KONG_TABLE } from '../../data/shensha.js';
import { createSeededRng, resolveSeed } from '../../shared/seeded-rng.js';
import { calculateBranchShenSha, calculateGlobalShenSha } from '../shared/shensha.js';
import { getKongWang as getKongWangByPillarSource } from '../../shared/utils.js';
// ── 卦象 Map 索引（O(1) 查找） ──
const HEXAGRAM_BY_CODE = new Map(HEXAGRAMS.map(h => [h.code, h]));
const HEXAGRAM_BY_NAME = new Map(HEXAGRAMS.map(h => [h.name, h]));
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const LIU_QIN_TARGETS = ['父母', '兄弟', '子孙', '妻财', '官鬼'];
export const XUN_KONG_TABLE = RAW_XUN_KONG_TABLE;
export const WANG_SHUAI_LABELS = {
    wang: '旺',
    xiang: '相',
    xiu: '休',
    qiu: '囚',
    si: '死',
};
export const KONG_WANG_LABELS = {
    not_kong: '',
    kong_static: '空',
    kong_changing: '动空',
    kong_ri_chong: '冲空',
    kong_yue_jian: '临建',
};
export const SPECIAL_STATUS_LABELS = {
    none: '',
    anDong: '暗动',
    riPo: '日破',
    yuePo: '月破',
};
export const MOVEMENT_LABELS = {
    static: '静',
    changing: '明动',
    hidden_moving: '暗动',
    day_break: '日破',
};
export const HUA_TYPE_LABELS = {
    huaJin: '化进',
    huaTui: '化退',
    huiTouSheng: '回头生',
    huiTouKe: '回头克',
    huaKong: '化空',
    huaMu: '化墓',
    huaJue: '化绝',
    fuYin: '伏吟',
    fanYin: '反吟',
    none: '',
};
export const YONG_SHEN_STATUS_LABELS = {
    resolved: '已定主用',
    ambiguous: '并看',
    from_changed: '变爻取用',
    from_temporal: '月日代用',
    from_fushen: '伏神取用',
    missing: '未稳取到',
};
export const YAO_POSITION_NAMES = ['一爻', '二爻', '三爻', '四爻', '五爻', '六爻'];
/**
 * 传统爻位名：阳爻用九、阴爻用六，初/二/三/四/五/上
 */
export function traditionalYaoName(pos, type) {
    const yinYang = type === 1 ? '九' : '六';
    if (pos === 1)
        return `初${yinYang}`;
    if (pos === 6)
        return `上${yinYang}`;
    const posLabels = ['初', '二', '三', '四', '五', '上'];
    return `${yinYang}${posLabels[pos - 1]}`;
}
/** 格式化干支时间为标准文本 */
export function formatGanZhiTime(gz) {
    return `${gz.year.gan}${gz.year.zhi}年 ${gz.month.gan}${gz.month.zhi}月 ${gz.day.gan}${gz.day.zhi}日 ${gz.hour.gan}${gz.hour.zhi}时`;
}
/**
 * 卦级分析行（六冲/六合/冲合转换/反吟伏吟/三合/半合/全局神煞）
 * 返回纯文本行数组，调用方自行决定前缀
 */
export function formatGuaLevelLines(analysis) {
    const parts = [];
    const { liuChongGuaInfo, liuHeGuaInfo, chongHeTransition, guaFanFuYin, sanHeAnalysis } = analysis;
    if (liuChongGuaInfo?.isLiuChongGua) {
        parts.push(`六冲卦：是${liuChongGuaInfo.description ? `（${liuChongGuaInfo.description}）` : ''}`);
    }
    if (liuHeGuaInfo?.isLiuHeGua) {
        parts.push(`六合卦：是${liuHeGuaInfo.description ? `（${liuHeGuaInfo.description}）` : ''}`);
    }
    if (chongHeTransition && chongHeTransition.type !== 'none' && chongHeTransition.description) {
        parts.push(`冲合转换：${chongHeTransition.description}`);
    }
    if (guaFanFuYin) {
        if (guaFanFuYin.isFanYin)
            parts.push(`反吟：${guaFanFuYin.description || '是'}`);
        if (guaFanFuYin.isFuYin)
            parts.push(`伏吟：${guaFanFuYin.description || '是'}`);
    }
    if (sanHeAnalysis) {
        if (sanHeAnalysis.hasFullSanHe && sanHeAnalysis.fullSanHeList?.length) {
            for (const sh of sanHeAnalysis.fullSanHeList) {
                parts.push(`三合局：${sh.name}→${sh.result}${sh.description ? `（${sh.description}）` : ''}`);
            }
        }
        else if (sanHeAnalysis.hasFullSanHe && sanHeAnalysis.fullSanHe) {
            parts.push(`三合局：${sanHeAnalysis.fullSanHe.name}→${sanHeAnalysis.fullSanHe.result}${sanHeAnalysis.fullSanHe.description ? `（${sanHeAnalysis.fullSanHe.description}）` : ''}`);
        }
        if (sanHeAnalysis.hasBanHe && sanHeAnalysis.banHe?.length) {
            for (const bh of sanHeAnalysis.banHe) {
                parts.push(`半合：${bh.branches.join('')}→${bh.result}（${bh.type}）`);
            }
        }
    }
    return parts;
}
/** 按位置降序排列爻（上爻→初爻） */
export function sortYaosDescending(yaos) {
    return [...yaos].sort((a, b) => b.position - a.position);
}
const ACTION_LABELS = {
    sheng: '生',
    ke: '克',
    fu: '扶',
    chong: '冲',
    he: '合',
    po: '破',
    none: '',
};
const DIZHI_WUXING = {
    子: '水',
    丑: '土',
    寅: '木',
    卯: '木',
    辰: '土',
    巳: '火',
    午: '火',
    未: '土',
    申: '金',
    酉: '金',
    戌: '土',
    亥: '水',
};
const WUXING_SHENG = {
    木: '火',
    火: '土',
    土: '金',
    金: '水',
    水: '木',
};
const WUXING_KE = {
    木: '土',
    土: '水',
    水: '火',
    火: '金',
    金: '木',
};
const WUXING_BEI_SHENG = {
    火: '木',
    土: '火',
    金: '土',
    水: '金',
    木: '水',
};
const WUXING_BEI_KE = {
    土: '木',
    水: '土',
    火: '水',
    金: '火',
    木: '金',
};
const WUXING_MU = {
    木: '未',
    火: '戌',
    土: '戌',
    金: '丑',
    水: '辰',
};
const WUXING_JUE = {
    木: '申',
    火: '亥',
    土: '亥',
    金: '寅',
    水: '巳',
};
const LIU_SHEN_CONFIG = {
    甲乙: ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'],
    丙丁: ['朱雀', '勾陈', '螣蛇', '白虎', '玄武', '青龙'],
    戊: ['勾陈', '螣蛇', '白虎', '玄武', '青龙', '朱雀'],
    己: ['螣蛇', '白虎', '玄武', '青龙', '朱雀', '勾陈'],
    庚辛: ['白虎', '玄武', '青龙', '朱雀', '勾陈', '螣蛇'],
    壬癸: ['玄武', '青龙', '朱雀', '勾陈', '螣蛇', '白虎'],
};
const WANG_SHUAI_TABLE = {
    寅: { 木: 'wang', 火: 'xiang', 水: 'xiu', 金: 'qiu', 土: 'si' },
    卯: { 木: 'wang', 火: 'xiang', 水: 'xiu', 金: 'qiu', 土: 'si' },
    辰: { 土: 'wang', 金: 'xiang', 火: 'xiu', 木: 'qiu', 水: 'si' },
    巳: { 火: 'wang', 土: 'xiang', 木: 'xiu', 水: 'qiu', 金: 'si' },
    午: { 火: 'wang', 土: 'xiang', 木: 'xiu', 水: 'qiu', 金: 'si' },
    未: { 土: 'wang', 金: 'xiang', 火: 'xiu', 木: 'qiu', 水: 'si' },
    申: { 金: 'wang', 水: 'xiang', 土: 'xiu', 火: 'qiu', 木: 'si' },
    酉: { 金: 'wang', 水: 'xiang', 土: 'xiu', 火: 'qiu', 木: 'si' },
    戌: { 土: 'wang', 金: 'xiang', 火: 'xiu', 木: 'qiu', 水: 'si' },
    亥: { 水: 'wang', 木: 'xiang', 金: 'xiu', 土: 'qiu', 火: 'si' },
    子: { 水: 'wang', 木: 'xiang', 金: 'xiu', 土: 'qiu', 火: 'si' },
    丑: { 土: 'wang', 金: 'xiang', 火: 'xiu', 木: 'qiu', 水: 'si' },
};
const LIU_CHONG = {
    子: '午',
    丑: '未',
    寅: '申',
    卯: '酉',
    辰: '戌',
    巳: '亥',
    午: '子',
    未: '丑',
    申: '寅',
    酉: '卯',
    戌: '辰',
    亥: '巳',
};
const LIU_HE = {
    子: { partner: '丑', result: '土' },
    丑: { partner: '子', result: '土' },
    寅: { partner: '亥', result: '木' },
    亥: { partner: '寅', result: '木' },
    卯: { partner: '戌', result: '火' },
    戌: { partner: '卯', result: '火' },
    辰: { partner: '酉', result: '金' },
    酉: { partner: '辰', result: '金' },
    巳: { partner: '申', result: '水' },
    申: { partner: '巳', result: '水' },
    午: { partner: '未', result: '火' },
    未: { partner: '午', result: '火' },
};
const XIANG_PO = {
    子: '酉',
    酉: '子',
    丑: '辰',
    辰: '丑',
    寅: '亥',
    亥: '寅',
    卯: '午',
    午: '卯',
    巳: '申',
    申: '巳',
    未: '戌',
    戌: '未',
};
const SAN_HE_TABLE = [
    { branches: ['申', '子', '辰'], result: '水', name: '申子辰合水局' },
    { branches: ['亥', '卯', '未'], result: '木', name: '亥卯未合木局' },
    { branches: ['寅', '午', '戌'], result: '火', name: '寅午戌合火局' },
    { branches: ['巳', '酉', '丑'], result: '金', name: '巳酉丑合金局' },
];
const BAN_HE_TABLE = [
    { branches: ['申', '子'], result: '水', type: 'sheng' },
    { branches: ['亥', '卯'], result: '木', type: 'sheng' },
    { branches: ['寅', '午'], result: '火', type: 'sheng' },
    { branches: ['巳', '酉'], result: '金', type: 'sheng' },
    { branches: ['子', '辰'], result: '水', type: 'mu' },
    { branches: ['卯', '未'], result: '木', type: 'mu' },
    { branches: ['午', '戌'], result: '火', type: 'mu' },
    { branches: ['酉', '丑'], result: '金', type: 'mu' },
];
const WUXING_CHANG_SHENG_TABLE = {
    木: { 亥: '长生', 子: '沐浴', 丑: '冠带', 寅: '临官', 卯: '帝旺', 辰: '衰', 巳: '病', 午: '死', 未: '墓', 申: '绝', 酉: '胎', 戌: '养' },
    火: { 寅: '长生', 卯: '沐浴', 辰: '冠带', 巳: '临官', 午: '帝旺', 未: '衰', 申: '病', 酉: '死', 戌: '墓', 亥: '绝', 子: '胎', 丑: '养' },
    土: { 寅: '长生', 卯: '沐浴', 辰: '冠带', 巳: '临官', 午: '帝旺', 未: '衰', 申: '病', 酉: '死', 戌: '墓', 亥: '绝', 子: '胎', 丑: '养' },
    金: { 巳: '长生', 午: '沐浴', 未: '冠带', 申: '临官', 酉: '帝旺', 戌: '衰', 亥: '病', 子: '死', 丑: '墓', 寅: '绝', 卯: '胎', 辰: '养' },
    水: { 申: '长生', 酉: '沐浴', 戌: '冠带', 亥: '临官', 子: '帝旺', 丑: '衰', 寅: '病', 卯: '死', 辰: '墓', 巳: '绝', 午: '胎', 未: '养' },
};
const CHANG_SHENG_STRENGTH = {
    长生: 'strong',
    沐浴: 'medium',
    冠带: 'strong',
    临官: 'strong',
    帝旺: 'strong',
    衰: 'medium',
    病: 'weak',
    死: 'weak',
    墓: 'weak',
    绝: 'weak',
    胎: 'medium',
    养: 'medium',
};
export const TRIGRAM_NA_JIA = {
    乾: { element: '金', lower: ['子', '寅', '辰'], upper: ['午', '申', '戌'] },
    坎: { element: '水', lower: ['寅', '辰', '午'], upper: ['申', '戌', '子'] },
    艮: { element: '土', lower: ['辰', '午', '申'], upper: ['戌', '子', '寅'] },
    震: { element: '木', lower: ['子', '寅', '辰'], upper: ['午', '申', '戌'] },
    巽: { element: '木', lower: ['丑', '亥', '酉'], upper: ['未', '巳', '卯'] },
    离: { element: '火', lower: ['卯', '丑', '亥'], upper: ['酉', '未', '巳'] },
    坤: { element: '土', lower: ['未', '巳', '卯'], upper: ['丑', '亥', '酉'] },
    兑: { element: '金', lower: ['巳', '卯', '丑'], upper: ['亥', '酉', '未'] },
};
const ALL_BA_GONG = {
    '111111': { name: '乾', element: '金', order: 0 },
    '011111': { name: '乾', element: '金', order: 1 },
    '001111': { name: '乾', element: '金', order: 2 },
    '000111': { name: '乾', element: '金', order: 3 },
    '000011': { name: '乾', element: '金', order: 4 },
    '000001': { name: '乾', element: '金', order: 5 },
    '000101': { name: '乾', element: '金', order: 6 },
    '111101': { name: '乾', element: '金', order: 7 },
    '010010': { name: '坎', element: '水', order: 0 },
    '110010': { name: '坎', element: '水', order: 1 },
    '100010': { name: '坎', element: '水', order: 2 },
    '101010': { name: '坎', element: '水', order: 3 },
    '101110': { name: '坎', element: '水', order: 4 },
    '101100': { name: '坎', element: '水', order: 5 },
    '101000': { name: '坎', element: '水', order: 6 },
    '010000': { name: '坎', element: '水', order: 7 },
    '001001': { name: '艮', element: '土', order: 0 },
    '101001': { name: '艮', element: '土', order: 1 },
    '111001': { name: '艮', element: '土', order: 2 },
    '110001': { name: '艮', element: '土', order: 3 },
    '110101': { name: '艮', element: '土', order: 4 },
    '110111': { name: '艮', element: '土', order: 5 },
    '110011': { name: '艮', element: '土', order: 6 },
    '001011': { name: '艮', element: '土', order: 7 },
    '100100': { name: '震', element: '木', order: 0 },
    '000100': { name: '震', element: '木', order: 1 },
    '010100': { name: '震', element: '木', order: 2 },
    '011100': { name: '震', element: '木', order: 3 },
    '011000': { name: '震', element: '木', order: 4 },
    '011010': { name: '震', element: '木', order: 5 },
    '011110': { name: '震', element: '木', order: 6 },
    '100110': { name: '震', element: '木', order: 7 },
    '011011': { name: '巽', element: '木', order: 0 },
    '111011': { name: '巽', element: '木', order: 1 },
    '101011': { name: '巽', element: '木', order: 2 },
    '100011': { name: '巽', element: '木', order: 3 },
    '100111': { name: '巽', element: '木', order: 4 },
    '100101': { name: '巽', element: '木', order: 5 },
    '100001': { name: '巽', element: '木', order: 6 },
    '011001': { name: '巽', element: '木', order: 7 },
    '101101': { name: '离', element: '火', order: 0 },
    '001101': { name: '离', element: '火', order: 1 },
    '011101': { name: '离', element: '火', order: 2 },
    '010101': { name: '离', element: '火', order: 3 },
    '010001': { name: '离', element: '火', order: 4 },
    '010011': { name: '离', element: '火', order: 5 },
    '010111': { name: '离', element: '火', order: 6 },
    '101111': { name: '离', element: '火', order: 7 },
    '000000': { name: '坤', element: '土', order: 0 },
    '100000': { name: '坤', element: '土', order: 1 },
    '110000': { name: '坤', element: '土', order: 2 },
    '111000': { name: '坤', element: '土', order: 3 },
    '111100': { name: '坤', element: '土', order: 4 },
    '111110': { name: '坤', element: '土', order: 5 },
    '111010': { name: '坤', element: '土', order: 6 },
    '000010': { name: '坤', element: '土', order: 7 },
    '110110': { name: '兑', element: '金', order: 0 },
    '010110': { name: '兑', element: '金', order: 1 },
    '000110': { name: '兑', element: '金', order: 2 },
    '001110': { name: '兑', element: '金', order: 3 },
    '001010': { name: '兑', element: '金', order: 4 },
    '001000': { name: '兑', element: '金', order: 5 },
    '001100': { name: '兑', element: '金', order: 6 },
    '110100': { name: '兑', element: '金', order: 7 },
};
const BA_GONG_BEN_GUA = {
    乾: '111111',
    坎: '010010',
    艮: '001001',
    震: '100100',
    巽: '011011',
    离: '101101',
    坤: '000000',
    兑: '110110',
};
const SHI_YING_TABLE = {
    0: [6, 3],
    1: [1, 4],
    2: [2, 5],
    3: [3, 6],
    4: [4, 1],
    5: [5, 2],
    6: [4, 1],
    7: [3, 6],
};
const HUA_JIN_MAP = {
    亥: '子',
    寅: '卯',
    巳: '午',
    申: '酉',
    丑: '辰',
    辰: '未',
    未: '戌',
    戌: '丑',
};
const HUA_TUI_MAP = {
    子: '亥',
    卯: '寅',
    午: '巳',
    酉: '申',
    辰: '丑',
    未: '辰',
    戌: '未',
    丑: '戌',
};
function getHexagramByCode(code) {
    return HEXAGRAM_BY_CODE.get(code);
}
function getHexagramByName(name) {
    return HEXAGRAM_BY_NAME.get(name) || HEXAGRAMS.find((item) => item.name.includes(name));
}
function isValidHexagramCode(code) {
    return /^[01]{6}$/.test(code);
}
export function findHexagram(input) {
    if (isValidHexagramCode(input)) {
        return getHexagramByCode(input);
    }
    return getHexagramByName(input);
}
export function normalizeYongShenTargets(targets) {
    if (!targets || targets.length === 0) {
        return [];
    }
    const unique = new Set();
    for (const target of targets) {
        if (typeof target === 'string' && LIU_QIN_TARGETS.includes(target)) {
            unique.add(target);
        }
    }
    return Array.from(unique);
}
export function hasInvalidYongShenTargets(targets) {
    if (!targets || targets.length === 0) {
        return false;
    }
    return targets.some((target) => typeof target !== 'string' || !LIU_QIN_TARGETS.includes(target));
}
function resolveYongShenTargets(question, targets) {
    if (!question.trim()) {
        throw new Error('请先明确问题后再解卦');
    }
    const normalized = normalizeYongShenTargets(targets);
    if (normalized.length === 0) {
        throw new Error('请至少选择一个分析目标');
    }
    return normalized;
}
function getLiuShen(dayGan) {
    if ('甲乙'.includes(dayGan))
        return LIU_SHEN_CONFIG.甲乙;
    if ('丙丁'.includes(dayGan))
        return LIU_SHEN_CONFIG.丙丁;
    if (dayGan === '戊')
        return LIU_SHEN_CONFIG.戊;
    if (dayGan === '己')
        return LIU_SHEN_CONFIG.己;
    if ('庚辛'.includes(dayGan))
        return LIU_SHEN_CONFIG.庚辛;
    return LIU_SHEN_CONFIG.壬癸;
}
function getLiuQin(gongElement, yaoElement) {
    if (gongElement === yaoElement)
        return '兄弟';
    if (WUXING_SHENG[yaoElement] === gongElement)
        return '父母';
    if (WUXING_SHENG[gongElement] === yaoElement)
        return '子孙';
    if (WUXING_KE[gongElement] === yaoElement)
        return '妻财';
    if (WUXING_KE[yaoElement] === gongElement)
        return '官鬼';
    return '兄弟';
}
function findPalace(code) {
    return ALL_BA_GONG[code];
}
export function getPalaceInfo(code) {
    return findPalace(code);
}
export function getShiYingPosition(code) {
    const palace = findPalace(code);
    const [shi, ying] = SHI_YING_TABLE[palace?.order ?? 0] ?? [6, 3];
    return { shi, ying };
}
export function getNaJiaByHexagram(hexagramCode, position) {
    const hexagram = getHexagramByCode(hexagramCode);
    if (!hexagram || position < 1 || position > 6) {
        return '子';
    }
    const isLower = position <= 3;
    const trigramName = isLower ? hexagram.lowerTrigram : hexagram.upperTrigram;
    const trigram = TRIGRAM_NA_JIA[trigramName];
    if (!trigram) {
        return '子';
    }
    return isLower ? trigram.lower[position - 1] : trigram.upper[position - 4];
}
function buildDerivedHexagramInfo(code) {
    const hexagram = findHexagram(code);
    if (!hexagram)
        return undefined;
    return {
        name: hexagram.name,
        guaCi: GUA_CI[hexagram.name],
        xiangCi: XIANG_CI[hexagram.name],
    };
}
export function calculateDerivedHexagrams(hexagramCode) {
    if (!isValidHexagramCode(hexagramCode)) {
        return {};
    }
    const lowerTrigram = hexagramCode[1] + hexagramCode[2] + hexagramCode[3];
    const upperTrigram = hexagramCode[2] + hexagramCode[3] + hexagramCode[4];
    const nuclearCode = lowerTrigram + upperTrigram;
    const oppositeCode = hexagramCode.split('').map((c) => (c === '1' ? '0' : '1')).join('');
    const reversedCode = hexagramCode.split('').reverse().join('');
    return {
        nuclearHexagram: buildDerivedHexagramInfo(nuclearCode),
        oppositeHexagram: buildDerivedHexagramInfo(oppositeCode),
        reversedHexagram: buildDerivedHexagramInfo(reversedCode),
    };
}
export function calculateGuaShen(hexagramCode) {
    if (!isValidHexagramCode(hexagramCode)) {
        return { branch: '子', absent: true };
    }
    const { shi } = getShiYingPosition(hexagramCode);
    const shiLineType = Number.parseInt(hexagramCode[shi - 1] ?? '', 10);
    if (Number.isNaN(shiLineType)) {
        return { branch: '子', absent: true };
    }
    const startIndex = shiLineType === 1 ? 0 : 6;
    const targetBranchIndex = (startIndex + (shi - 1)) % 12;
    const targetBranch = DIZHI[targetBranchIndex] ?? '子';
    for (let pos = 1; pos <= 6; pos += 1) {
        const naJia = getNaJiaByHexagram(hexagramCode, pos);
        if (naJia === targetBranch) {
            return { branch: targetBranch, linePosition: pos };
        }
    }
    return { branch: targetBranch, absent: true };
}
function getXunFromGanZhi(gan, zhi) {
    const ganIndex = TIANGAN.indexOf(gan);
    const zhiIndex = DIZHI.indexOf(zhi);
    const xunStartZhiIndex = (zhiIndex - ganIndex + 12) % 12;
    const xunNames = {
        0: '甲子旬',
        2: '甲寅旬',
        4: '甲辰旬',
        6: '甲午旬',
        8: '甲申旬',
        10: '甲戌旬',
    };
    return xunNames[xunStartZhiIndex] || '甲子旬';
}
export function calculateGanZhiTime(date) {
    const solar = Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    eightChar.setSect?.(1);
    const dayGan = eightChar.getDayGan();
    const dayZhi = eightChar.getDayZhi();
    return {
        year: {
            gan: eightChar.getYearGan(),
            zhi: eightChar.getYearZhi(),
        },
        month: {
            gan: eightChar.getMonthGan(),
            zhi: eightChar.getMonthZhi(),
        },
        day: {
            gan: dayGan,
            zhi: dayZhi,
        },
        hour: {
            gan: eightChar.getTimeGan(),
            zhi: eightChar.getTimeZhi(),
        },
        xun: getXunFromGanZhi(dayGan, dayZhi),
    };
}
export function getKongWang(dayGan, dayZhi) {
    const kongWang = getKongWangByPillarSource(dayGan, dayZhi);
    return {
        xun: kongWang.xun,
        kongDizhi: kongWang.kongZhi,
    };
}
export function calculateKongWangByPillar(ganZhiTime) {
    return {
        year: getKongWang(ganZhiTime.year.gan, ganZhiTime.year.zhi),
        month: getKongWang(ganZhiTime.month.gan, ganZhiTime.month.zhi),
        day: getKongWang(ganZhiTime.day.gan, ganZhiTime.day.zhi),
        hour: getKongWang(ganZhiTime.hour.gan, ganZhiTime.hour.zhi),
    };
}
export function checkYaoKongWang(yaoZhi, kongWang, monthZhi, dayZhi, isChanging) {
    if (!kongWang.kongDizhi.includes(yaoZhi)) {
        return 'not_kong';
    }
    if (yaoZhi === monthZhi) {
        return 'kong_yue_jian';
    }
    if (LIU_CHONG[yaoZhi] === dayZhi) {
        return 'kong_ri_chong';
    }
    if (isChanging) {
        return 'kong_changing';
    }
    return 'kong_static';
}
export function getZhiAction(sourceZhi, targetZhi) {
    if (LIU_CHONG[sourceZhi] === targetZhi) {
        return 'chong';
    }
    if (LIU_HE[sourceZhi]?.partner === targetZhi) {
        return 'he';
    }
    if (XIANG_PO[sourceZhi] === targetZhi) {
        return 'po';
    }
    const sourceWuXing = DIZHI_WUXING[sourceZhi];
    const targetWuXing = DIZHI_WUXING[targetZhi];
    if (sourceWuXing === targetWuXing) {
        return 'fu';
    }
    if (WUXING_SHENG[sourceWuXing] === targetWuXing) {
        return 'sheng';
    }
    if (WUXING_KE[sourceWuXing] === targetWuXing) {
        return 'ke';
    }
    return 'none';
}
export function getYaoInfluence(yaoZhi, monthZhi, dayZhi) {
    const monthAction = getZhiAction(monthZhi, yaoZhi);
    const dayAction = getZhiAction(dayZhi, yaoZhi);
    const parts = [];
    if (monthAction !== 'none')
        parts.push(`月${ACTION_LABELS[monthAction]}`);
    if (dayAction !== 'none')
        parts.push(`日${ACTION_LABELS[dayAction]}`);
    return {
        monthAction,
        dayAction,
        description: parts.length > 0 ? parts.join('、') : '无特殊作用',
    };
}
function getStrengthLevel(strength, kongWangState) {
    if (strength.specialStatus === 'riPo' || strength.specialStatus === 'yuePo' || kongWangState === 'kong_static') {
        return 'weak';
    }
    if (strength.specialStatus === 'anDong') {
        return 'strong';
    }
    if (strength.wangShuai === 'wang' || strength.wangShuai === 'xiang') {
        return 'strong';
    }
    if (strength.wangShuai === 'xiu' || kongWangState === 'kong_changing' || kongWangState === 'kong_ri_chong' || kongWangState === 'kong_yue_jian') {
        return 'moderate';
    }
    return 'weak';
}
export function calculateYaoStrength(yaoWuXing, monthZhi, isChanging, kongWangState, influence, yaoZhi) {
    const wangShuai = WANG_SHUAI_TABLE[monthZhi][yaoWuXing];
    const evidence = [`月令${WANG_SHUAI_LABELS[wangShuai]}`];
    const isWangXiang = wangShuai === 'wang' || wangShuai === 'xiang';
    let specialStatus = 'none';
    if (influence.monthAction === 'sheng')
        evidence.push('月生');
    if (influence.monthAction === 'fu')
        evidence.push('月扶');
    if (influence.monthAction === 'ke')
        evidence.push('月克');
    if (influence.monthAction === 'chong')
        evidence.push('月冲');
    if (influence.dayAction === 'sheng')
        evidence.push('日生');
    if (influence.dayAction === 'fu')
        evidence.push('日扶');
    if (influence.dayAction === 'ke')
        evidence.push('日克');
    if (isChanging)
        evidence.push('明动');
    // 月破：爻的地支被月建冲，不论旺衰，整月无力（比日破更严重）
    if (LIU_CHONG[yaoZhi] === monthZhi && !isChanging) {
        specialStatus = 'yuePo';
        evidence.push('月破（被月建冲，整月无力）');
    }
    // 日破/暗动：仅在未被月破时判定
    if (specialStatus === 'none' && influence.dayAction === 'chong' && !isChanging) {
        if (isWangXiang) {
            specialStatus = 'anDong';
            evidence.push('旺相逢冲为暗动');
        }
        else {
            specialStatus = 'riPo';
            evidence.push('休囚逢冲为日破');
        }
    }
    if (kongWangState === 'kong_static')
        evidence.push('静空');
    if (kongWangState === 'kong_changing')
        evidence.push('动空');
    if (kongWangState === 'kong_ri_chong')
        evidence.push('冲空');
    if (kongWangState === 'kong_yue_jian')
        evidence.push('临建不空');
    const baseStrong = specialStatus === 'anDong' || isWangXiang || (wangShuai === 'xiu' && influence.dayAction === 'sheng');
    const isStrong = specialStatus !== 'riPo' && specialStatus !== 'yuePo' && kongWangState !== 'kong_static' && baseStrong;
    return {
        wangShuai,
        isStrong,
        specialStatus,
        evidence,
    };
}
function getYaoMovementState(yao, strength) {
    if (yao.change === 'changing') {
        return 'changing';
    }
    if (strength.specialStatus === 'anDong') {
        return 'hidden_moving';
    }
    if (strength.specialStatus === 'riPo' || strength.specialStatus === 'yuePo') {
        return 'day_break';
    }
    return 'static';
}
function getChangSheng(wuXing, diZhi) {
    return WUXING_CHANG_SHENG_TABLE[wuXing][diZhi];
}
function analyzeYaoChange(originalZhi, changedZhi, originalWuXing, changedWuXing, kongWang) {
    if (originalZhi === changedZhi) {
        return { huaType: 'fuYin', originalZhi, changedZhi, description: '伏吟：变爻与本爻同支，事多反复' };
    }
    if (LIU_CHONG[originalZhi] === changedZhi) {
        return { huaType: 'fanYin', originalZhi, changedZhi, description: '反吟：变爻与本爻相冲，事态多反复' };
    }
    // 化墓化绝是五行本质关系，优先于化空（时间性条件）
    if (WUXING_MU[originalWuXing] === changedZhi) {
        return { huaType: 'huaMu', originalZhi, changedZhi, description: '化墓：变爻入墓，事情受阻' };
    }
    if (WUXING_JUE[originalWuXing] === changedZhi) {
        return { huaType: 'huaJue', originalZhi, changedZhi, description: '化绝：变爻入绝，后劲不足' };
    }
    if (kongWang.kongDizhi.includes(changedZhi)) {
        return { huaType: 'huaKong', originalZhi, changedZhi, description: '化空：变爻落空，需待填实' };
    }
    if (WUXING_SHENG[changedWuXing] === originalWuXing) {
        return { huaType: 'huiTouSheng', originalZhi, changedZhi, description: '回头生：变爻回生本爻' };
    }
    if (WUXING_KE[changedWuXing] === originalWuXing) {
        return { huaType: 'huiTouKe', originalZhi, changedZhi, description: '回头克：变爻回克本爻' };
    }
    if (HUA_JIN_MAP[originalZhi] === changedZhi) {
        return { huaType: 'huaJin', originalZhi, changedZhi, description: '化进：按进神配对，后势较前推进' };
    }
    if (HUA_TUI_MAP[originalZhi] === changedZhi) {
        return { huaType: 'huaTui', originalZhi, changedZhi, description: '化退：按退神配对，后势较前回退' };
    }
    return { huaType: 'none', originalZhi, changedZhi, description: '' };
}
function calculateChangedYaoDetail(hexagramCode, changedCode, position, gongElement, originalYao, kongWang) {
    const changedNaJia = getNaJiaByHexagram(changedCode, position);
    const changedWuXing = DIZHI_WUXING[changedNaJia];
    const changedLiuQin = getLiuQin(gongElement, changedWuXing);
    const relation = analyzeYaoChange(originalYao.naJia, changedNaJia, originalYao.wuXing, changedWuXing, kongWang);
    return {
        position,
        type: parseInt(changedCode[position - 1] || '0', 10),
        liuQin: changedLiuQin,
        naJia: changedNaJia,
        wuXing: changedWuXing,
        liuShen: originalYao.liuShen,
        yaoCi: YAO_CI[getHexagramByCode(hexagramCode)?.name || '']?.[position - 1],
        relation: HUA_TYPE_LABELS[relation.huaType] || '平',
    };
}
export function calculateFullYaoInfo(yaos, hexagramCode, dayStem) {
    const palace = findPalace(hexagramCode);
    const gongElement = palace?.element || '土';
    const { shi, ying } = getShiYingPosition(hexagramCode);
    const liuShenList = getLiuShen(dayStem);
    return yaos.map((yao, index) => {
        const naJia = getNaJiaByHexagram(hexagramCode, yao.position);
        const wuXing = DIZHI_WUXING[naJia];
        return {
            ...yao,
            liuQin: getLiuQin(gongElement, wuXing),
            liuShen: liuShenList[index] || liuShenList[0],
            naJia,
            wuXing,
            isShiYao: yao.position === shi,
            isYingYao: yao.position === ying,
        };
    });
}
function analyzeSanHe(fullYaos, changedYaos, monthZhi, dayZhi) {
    const sources = [];
    for (const yao of fullYaos) {
        if (yao.change === 'changing') {
            sources.push({ zhi: yao.naJia, position: yao.position, source: 'dong' });
        }
    }
    for (const yao of changedYaos) {
        sources.push({ zhi: yao.naJia, position: yao.position || 0, source: 'bian' });
    }
    sources.push({ zhi: monthZhi, position: 0, source: 'yue' });
    sources.push({ zhi: dayZhi, position: 0, source: 'ri' });
    const allZhi = sources.map((item) => item.zhi);
    const fullSanHeList = SAN_HE_TABLE.map((sanHe) => {
        if (!sanHe.branches.every((branch) => allZhi.includes(branch))) {
            return null;
        }
        const matchingSources = sources.filter((item) => sanHe.branches.includes(item.zhi));
        const positions = matchingSources
            .filter((item) => item.source !== 'yue' && item.source !== 'ri')
            .map((item) => item.position)
            .filter((value, index, arr) => value > 0 && arr.indexOf(value) === index);
        if (positions.length < 2) {
            return null;
        }
        const activeBranches = new Set(matchingSources.filter((s) => s.source === 'dong' || s.source === 'bian').map((s) => s.zhi));
        const allThreeActive = sanHe.branches.every((b) => activeBranches.has(b));
        const resultWangShuai = WANG_SHUAI_TABLE[monthZhi][sanHe.result];
        const resultIsWang = resultWangShuai === 'wang' || resultWangShuai === 'xiang';
        const conditions = [];
        if (!allThreeActive)
            conditions.push('有支非动爻参与');
        if (!resultIsWang)
            conditions.push(`合化${sanHe.result}在月令${WANG_SHUAI_LABELS[resultWangShuai]}，未得令`);
        return {
            name: sanHe.name,
            result: sanHe.result,
            positions,
            description: conditions.length > 0
                ? `见${sanHe.name}三支，但${conditions.join('、')}，暂作合局迹象参考，未必成局。`
                : `${sanHe.name}三支皆动且合化${sanHe.result}得令，可论成局。`,
            isFull: allThreeActive && resultIsWang,
        };
    }).filter((item) => Boolean(item));
    if (fullSanHeList.length > 0) {
        const primary = fullSanHeList.find((item) => item.isFull) ?? fullSanHeList[0];
        return {
            hasFullSanHe: fullSanHeList.some((item) => item.isFull),
            fullSanHe: {
                name: primary.name,
                result: primary.result,
                positions: primary.positions,
                description: primary.description,
            },
            fullSanHeList: fullSanHeList.map((item) => ({
                name: item.name,
                result: item.result,
                positions: item.positions,
                description: item.description,
            })),
            hasBanHe: false,
        };
    }
    const banHe = BAN_HE_TABLE.map((item) => {
        if (!item.branches.every((branch) => allZhi.includes(branch))) {
            return null;
        }
        const positions = sources
            .filter((source) => source.source !== 'yue' && source.source !== 'ri' && item.branches.includes(source.zhi))
            .map((source) => source.position)
            .filter((value, index, arr) => value > 0 && arr.indexOf(value) === index);
        if (positions.length === 0) {
            return null;
        }
        return {
            branches: item.branches,
            result: item.result,
            type: item.type,
            positions,
        };
    }).filter((item) => Boolean(item));
    return {
        hasFullSanHe: false,
        hasBanHe: banHe.length > 0,
        banHe: banHe.length > 0 ? banHe : undefined,
    };
}
function checkLiuChongGua(fullYaos) {
    const pair1 = LIU_CHONG[fullYaos[0]?.naJia] === fullYaos[3]?.naJia;
    const pair2 = LIU_CHONG[fullYaos[1]?.naJia] === fullYaos[4]?.naJia;
    const pair3 = LIU_CHONG[fullYaos[2]?.naJia] === fullYaos[5]?.naJia;
    if (pair1 && pair2 && pair3) {
        return {
            isLiuChongGua: true,
            description: '卦体三对相冲，事态多变、难稳，应期往往偏急。',
        };
    }
    const count = [pair1, pair2, pair3].filter(Boolean).length;
    if (count >= 2) {
        return {
            isLiuChongGua: false,
            description: `卦中有${count}对爻相冲，需重视变动因素，不宜单凭此点断散。`,
        };
    }
    return { isLiuChongGua: false };
}
function checkGuaFanFuYin(changedCode, baseYaos) {
    if (!changedCode) {
        return { isFanYin: false, isFuYin: false };
    }
    // 卦级伏吟：本卦变卦六爻地支全同（含本变同卦的情况）
    const changedYaos = Array.from({ length: 6 }, (_, i) => getNaJiaByHexagram(changedCode, i + 1));
    const allSame = baseYaos.every((yao, i) => yao.naJia === changedYaos[i]);
    if (allSame) {
        return {
            isFanYin: false,
            isFuYin: true,
            description: '卦变伏吟：本卦与变卦六爻地支全同，主事多拖延、反复不顺、呻吟之象。',
        };
    }
    // 卦级反吟：本卦变卦六爻地支全冲
    const allChong = baseYaos.every((yao, i) => LIU_CHONG[yao.naJia] === changedYaos[i]);
    if (allChong) {
        return {
            isFanYin: true,
            isFuYin: false,
            description: '卦变反吟：本卦与变卦六爻相冲，主事态大幅反复、来回不定。',
        };
    }
    return { isFanYin: false, isFuYin: false };
}
function isLiuHeGuaPattern(yaos) {
    if (yaos.length < 6)
        return false;
    return LIU_HE[yaos[0].naJia]?.partner === yaos[3].naJia
        && LIU_HE[yaos[1].naJia]?.partner === yaos[4].naJia
        && LIU_HE[yaos[2].naJia]?.partner === yaos[5].naJia;
}
function isLiuChongGuaPattern(yaos) {
    if (yaos.length < 6)
        return false;
    return LIU_CHONG[yaos[0].naJia] === yaos[3].naJia
        && LIU_CHONG[yaos[1].naJia] === yaos[4].naJia
        && LIU_CHONG[yaos[2].naJia] === yaos[5].naJia;
}
function checkLiuHeGua(fullYaos) {
    if (isLiuHeGuaPattern(fullYaos)) {
        return {
            isLiuHeGua: true,
            description: '卦体三对相合，事态趋缓、有合好之象，但也须防合而不化、事迟不决。',
        };
    }
    return { isLiuHeGua: false };
}
function checkChongHeTransition(baseYaos, changedCode) {
    if (!changedCode) {
        return { type: 'none' };
    }
    const changedYaos = Array.from({ length: 6 }, (_, i) => ({
        naJia: getNaJiaByHexagram(changedCode, i + 1),
    }));
    const benIsChong = isLiuChongGuaPattern(baseYaos);
    const benIsHe = isLiuHeGuaPattern(baseYaos);
    const bianIsChong = isLiuChongGuaPattern(changedYaos);
    const bianIsHe = isLiuHeGuaPattern(changedYaos);
    if (benIsChong && bianIsHe) {
        return {
            type: 'chong_to_he',
            description: '六冲变六合：事态由散转聚、先坏后好，有回旋余地。',
        };
    }
    if (benIsHe && bianIsChong) {
        return {
            type: 'he_to_chong',
            description: '六合变六冲：事态由合转散、先好后坏，需防变故。',
        };
    }
    return { type: 'none' };
}
function calculateFuShen(hexagramCode, fullYaos, target, gongElement, monthZhi, dayZhi, kongWang) {
    if (fullYaos.some((yao) => yao.liuQin === target)) {
        return [];
    }
    const palace = findPalace(hexagramCode);
    const benGuaCode = palace ? BA_GONG_BEN_GUA[palace.name] : undefined;
    if (!benGuaCode) {
        return [];
    }
    const fuShenList = [];
    for (let position = 1; position <= 6; position++) {
        const naJia = getNaJiaByHexagram(benGuaCode, position);
        const wuXing = DIZHI_WUXING[naJia];
        const liuQin = getLiuQin(gongElement, wuXing);
        if (liuQin !== target) {
            continue;
        }
        const feiShen = fullYaos.find((item) => item.position === position);
        if (!feiShen) {
            continue;
        }
        const monthWuXing = DIZHI_WUXING[monthZhi];
        const dayWuXing = DIZHI_WUXING[dayZhi];
        let availabilityStatus = 'conditional';
        let availabilityReason = '伏神可参考，但仍待出伏或得助后方能实用。';
        const fuShenHasMonthDaySupport = WUXING_SHENG[monthWuXing] === wuXing || WUXING_SHENG[dayWuXing] === wuXing
            || monthWuXing === wuXing || dayWuXing === wuXing;
        if (WUXING_KE[feiShen.wuXing] === wuXing) {
            if (fuShenHasMonthDaySupport) {
                availabilityStatus = 'conditional';
                availabilityReason = '飞神克伏神，但伏神得月日生扶，克力减轻，仍可参看。';
            }
            else {
                availabilityStatus = 'blocked';
                availabilityReason = '飞神克伏神，又无月日生扶，当前仍伏而难用。';
            }
        }
        else if (kongWang.kongDizhi.includes(naJia)) {
            availabilityStatus = 'blocked';
            availabilityReason = '伏神落空，须待冲空填实。';
        }
        else if (feiShen.change === 'changing' || WUXING_SHENG[feiShen.wuXing] === wuXing || WUXING_SHENG[monthWuXing] === wuXing || WUXING_SHENG[dayWuXing] === wuXing) {
            availabilityStatus = 'available';
            availabilityReason = '伏神得飞神发动或月日生扶，可暂取用。';
        }
        fuShenList.push({
            liuQin,
            wuXing,
            naJia,
            feiShenPosition: position,
            feiShenLiuQin: feiShen.liuQin,
            availabilityStatus,
            availabilityReason,
        });
    }
    return fuShenList;
}
/**
 * 计算伏神与飞神的生克关系描述
 */
function describeFuFeiRelation(fuWuXing, feiWuXing) {
    if (fuWuXing === feiWuXing)
        return '比和';
    if (WUXING_SHENG[feiWuXing] === fuWuXing)
        return '飞生伏';
    if (WUXING_SHENG[fuWuXing] === feiWuXing)
        return '伏生飞';
    if (WUXING_KE[feiWuXing] === fuWuXing)
        return '飞克伏';
    if (WUXING_KE[fuWuXing] === feiWuXing)
        return '伏克飞';
    return '';
}
/**
 * 计算每爻位的飞伏神信息
 * 对比本卦与本宫首卦（八纯卦），找出本卦中缺失的六亲对应的伏神
 */
function calculatePerYaoFuShen(hexagramCode, baseYaos, gongElement) {
    const result = new Map();
    const palace = findPalace(hexagramCode);
    const benGuaCode = palace ? BA_GONG_BEN_GUA[palace.name] : undefined;
    if (!benGuaCode || benGuaCode === hexagramCode) {
        // 本宫首卦就是自己（八纯卦），不存在伏神
        return result;
    }
    // 收集本卦中已出现的六亲
    const visibleLiuQin = new Set(baseYaos.map(y => y.liuQin));
    // 遍历本宫首卦的每个爻位
    for (let position = 1; position <= 6; position++) {
        const benGuaNaJia = getNaJiaByHexagram(benGuaCode, position);
        const benGuaWuXing = DIZHI_WUXING[benGuaNaJia];
        const benGuaLiuQin = getLiuQin(gongElement, benGuaWuXing);
        // 只有当本卦中缺少该六亲时，才标注伏神
        if (!visibleLiuQin.has(benGuaLiuQin)) {
            const feiShen = baseYaos.find(y => y.position === position);
            if (feiShen) {
                const relation = describeFuFeiRelation(benGuaWuXing, feiShen.wuXing);
                result.set(position, {
                    liuQin: benGuaLiuQin,
                    naJia: benGuaNaJia,
                    wuXing: benGuaWuXing,
                    relation,
                });
            }
        }
    }
    return result;
}
function buildVisibleCandidate(yao) {
    const level = getStrengthLevel(yao.strength, yao.kongWangState);
    const evidence = [...yao.strength.evidence];
    if (yao.isShiYao)
        evidence.push('世位');
    if (yao.isYingYao)
        evidence.push('应位');
    if (yao.kongWangState !== 'not_kong')
        evidence.push(KONG_WANG_LABELS[yao.kongWangState] || '空亡');
    if (yao.changedYao?.relation)
        evidence.push(yao.changedYao.relation);
    const strengthLabel = level === 'strong' ? '旺相可取' : level === 'moderate' ? '平常可参' : '衰弱受制';
    return {
        liuQin: yao.liuQin,
        naJia: yao.naJia,
        changedNaJia: yao.changedYao?.naJia,
        huaType: yao.changeAnalysis?.huaType,
        element: yao.wuXing,
        position: yao.position,
        source: 'visible',
        strength: level,
        strengthLabel,
        movementState: yao.movementState,
        movementLabel: yao.movementLabel,
        isShiYao: yao.isShiYao,
        isYingYao: yao.isYingYao,
        kongWangState: yao.kongWangState,
        evidence,
    };
}
function buildChangedCandidate(yao, monthZhi, dayZhi, kongWang) {
    if (!yao.changedYao) {
        return null;
    }
    const changedNaJia = yao.changedYao.naJia;
    const changedWuXing = yao.changedYao.wuXing;
    const influence = getYaoInfluence(changedNaJia, monthZhi, dayZhi);
    const kongWangState = checkYaoKongWang(changedNaJia, kongWang, monthZhi, dayZhi, false);
    const strength = calculateYaoStrength(changedWuXing, monthZhi, true, kongWangState, influence, changedNaJia);
    const level = getStrengthLevel(strength, kongWangState);
    const evidence = [`第${yao.position}爻变出用神`, ...strength.evidence];
    if (yao.isShiYao)
        evidence.push('世位');
    if (yao.isYingYao)
        evidence.push('应位');
    if (yao.changeAnalysis?.description)
        evidence.push(yao.changeAnalysis.description);
    const strengthLabel = level === 'strong' ? '变出得力' : level === 'moderate' ? '变出可参' : '变出待定';
    return {
        liuQin: yao.changedYao.liuQin,
        naJia: changedNaJia,
        changedNaJia: changedNaJia,
        huaType: yao.changeAnalysis?.huaType,
        element: changedWuXing,
        position: yao.position,
        source: 'changed',
        strength: level,
        strengthLabel,
        movementState: 'changing',
        movementLabel: '变出',
        isShiYao: yao.isShiYao,
        isYingYao: yao.isYingYao,
        kongWangState,
        evidence,
    };
}
function buildTemporalCandidates(target, gongElement, monthZhi, dayZhi) {
    const pushCandidate = (candidates, branch, label, strength, strengthLabel) => {
        const index = candidates.findIndex((item) => item.naJia === branch);
        const evidence = [`用神${target}不上卦`, `以${label}${branch}代用`];
        if (index >= 0) {
            candidates[index] = {
                ...candidates[index],
                strength: candidates[index].strength === 'strong' ? 'strong' : strength,
                strengthLabel: candidates[index].strength === 'strong' ? candidates[index].strengthLabel : strengthLabel,
                evidence: Array.from(new Set([...candidates[index].evidence, ...evidence])),
            };
            return;
        }
        const element = DIZHI_WUXING[branch];
        candidates.push({
            liuQin: target,
            naJia: branch,
            element,
            source: 'temporal',
            strength,
            strengthLabel,
            movementState: 'static',
            movementLabel: label,
            isShiYao: false,
            isYingYao: false,
            kongWangState: 'not_kong',
            evidence,
        });
    };
    const candidates = [];
    const monthTarget = getLiuQin(gongElement, DIZHI_WUXING[monthZhi]);
    const dayTarget = getLiuQin(gongElement, DIZHI_WUXING[dayZhi]);
    if (monthTarget === target) {
        pushCandidate(candidates, monthZhi, '月建', 'strong', '月建代用');
    }
    if (dayTarget === target) {
        pushCandidate(candidates, dayZhi, '日辰', monthTarget === target && dayZhi === monthZhi ? 'strong' : 'moderate', monthTarget === target && dayZhi === monthZhi ? '月日同临代用' : '日辰代用');
    }
    return candidates;
}
function buildFuShenCandidate(fuShen, kongWang, attachedYao) {
    const strength = fuShen.availabilityStatus === 'available' ? 'moderate' : fuShen.availabilityStatus === 'conditional' ? 'weak' : 'unknown';
    // 伏神自身地支的空亡状态（非飞神所在爻的空亡）
    const fuShenIsKong = kongWang.kongDizhi.includes(fuShen.naJia);
    const fuShenKongWangState = fuShenIsKong ? 'kong_static' : 'not_kong';
    return {
        liuQin: fuShen.liuQin,
        naJia: fuShen.naJia,
        element: fuShen.wuXing,
        position: fuShen.feiShenPosition,
        source: 'fushen',
        strength,
        strengthLabel: fuShen.availabilityStatus === 'available' ? '伏神可取' : fuShen.availabilityStatus === 'conditional' ? '伏神待出' : '伏神难取',
        movementState: 'static',
        movementLabel: fuShen.availabilityStatus === 'available' ? '伏中可参' : '伏藏待时',
        isShiYao: attachedYao?.isShiYao ?? false,
        isYingYao: attachedYao?.isYingYao ?? false,
        kongWangState: fuShenKongWangState,
        evidence: [`用神${fuShen.liuQin}不上卦`, fuShen.availabilityReason],
    };
}
function getSourceRank(source) {
    switch (source) {
        case 'visible':
            return 3;
        case 'changed':
            return 2;
        case 'temporal':
            return 1;
        case 'fushen':
        default:
            return 0;
    }
}
function getSupportRank(candidate) {
    const joined = candidate.evidence.join('、');
    let rank = 0;
    if (joined.includes('月令旺'))
        rank += 4;
    else if (joined.includes('月令相'))
        rank += 3;
    else if (joined.includes('月令休'))
        rank += 2;
    else if (joined.includes('月令囚'))
        rank += 1;
    if (joined.includes('月生'))
        rank += 3;
    if (joined.includes('月扶'))
        rank += 2;
    if (joined.includes('日生'))
        rank += 2;
    if (joined.includes('日扶'))
        rank += 1;
    if (joined.includes('月克'))
        rank -= 3;
    if (joined.includes('日克'))
        rank -= 2;
    if (joined.includes('月冲'))
        rank -= 2;
    if (joined.includes('日冲'))
        rank -= 1;
    if (joined.includes('月建代用'))
        rank += 4;
    if (joined.includes('日辰代用'))
        rank += 2;
    return rank;
}
// Spec 比较顺序：明现/伏藏 > 旺衰(月日生克) > 空亡真假 > 动静吉凶 > 化进退/回头生克 > 世应 > 爻位
function candidateRank(candidate) {
    // 1. 明现/变出/月日/伏神优先级
    const sourceRank = getSourceRank(candidate.source);
    // 2. 旺衰等级（含月日生克结果）
    const strengthRank = candidate.strength === 'strong' ? 3 : candidate.strength === 'moderate' ? 2 : candidate.strength === 'weak' ? 1 : 0;
    const supportRank = getSupportRank(candidate);
    // 3. 空亡真假
    const kongRank = candidate.kongWangState === 'not_kong' || candidate.kongWangState === undefined ? 3 : candidate.kongWangState === 'kong_ri_chong' || candidate.kongWangState === 'kong_yue_jian' ? 2 : candidate.kongWangState === 'kong_changing' ? 1 : 0;
    // 4. 动静吉凶（动优于静，但日破/月破降级）
    const movementRank = candidate.movementState === 'changing' ? 3 : candidate.movementState === 'hidden_moving' ? 2 : candidate.movementState === 'static' ? 1 : 0;
    // 5. 化变吉凶：回头生/化进 > 无化 > 化退/回头克/化墓/化绝/化空
    const huaRank = getHuaRank(candidate.huaType);
    // 6. 世应
    const shiRank = candidate.isShiYao ? 1 : 0;
    const yingRank = candidate.isYingYao ? 1 : 0;
    // 7. 爻位兜底
    const positionRank = typeof candidate.position === 'number' ? 7 - candidate.position : 0;
    return [sourceRank, strengthRank, supportRank, kongRank, movementRank, huaRank, shiRank, yingRank, positionRank];
}
function candidateBusinessRank(candidate) {
    return candidateRank(candidate).slice(0, -1);
}
function getHuaRank(huaType) {
    if (!huaType || huaType === 'none')
        return 2; // 无化变，中性
    switch (huaType) {
        case 'huiTouSheng': return 4; // 回头生，利
        case 'huaJin': return 3; // 化进，利
        case 'fuYin': return 2; // 伏吟，中性偏滞
        case 'huaTui': return 1; // 化退，不利
        case 'fanYin': return 1; // 反吟，不利
        case 'huiTouKe': return 0; // 回头克，凶
        case 'huaKong': return 0; // 化空，凶
        case 'huaMu': return 0; // 化墓，凶
        case 'huaJue': return 0; // 化绝，凶
        default: return 2;
    }
}
function compareCandidate(a, b) {
    const left = candidateRank(a);
    const right = candidateRank(b);
    for (let index = 0; index < left.length; index += 1) {
        if (left[index] !== right[index]) {
            return right[index] - left[index];
        }
    }
    return 0;
}
function sameRank(a, b) {
    if (!a || !b)
        return false;
    // “并看”只在核心业务因子无法分出高下时触发；
    // 末位爻位仅作兜底排序，不应阻断 ambiguous。
    const left = candidateBusinessRank(a);
    const right = candidateBusinessRank(b);
    return left.every((value, index) => value === right[index]);
}
function buildYongShenGroups(fullYaos, fuShenByTarget, targets, gongElement, monthZhi, dayZhi, kongWang) {
    const yaoName = (pos) => {
        if (!pos)
            return '';
        const yao = fullYaos.find((y) => y.position === pos);
        return yao ? `${traditionalYaoName(pos, yao.type)}爻` : `${pos}爻`;
    };
    return targets.map((target) => {
        const visibleCandidates = fullYaos
            .filter((yao) => yao.liuQin === target)
            .map(buildVisibleCandidate)
            .sort(compareCandidate);
        if (visibleCandidates.length > 0) {
            const selected = visibleCandidates[0];
            const candidates = visibleCandidates.slice(1);
            const ambiguous = sameRank(selected, candidates[0]);
            return {
                targetLiuQin: target,
                selectionStatus: ambiguous ? 'ambiguous' : 'resolved',
                selectionNote: ambiguous
                    ? `同类${target}并见，当前并看${[selected, candidates[0]].filter(Boolean).map((item) => `${item.strengthLabel}${item.position ? `${yaoName(item.position)}` : ''}`).join(' / ')}。`
                    : `以${selected.position ? yaoName(selected.position) : '当前所见'}${target}为主用神，优先参考其旺衰、动静与空亡。`,
                selected,
                candidates,
            };
        }
        const changedCandidates = fullYaos
            .filter((yao) => yao.changedYao?.liuQin === target)
            .map((yao) => buildChangedCandidate(yao, monthZhi, dayZhi, kongWang))
            .filter((candidate) => Boolean(candidate))
            .sort(compareCandidate);
        if (changedCandidates.length > 0) {
            const selected = changedCandidates[0];
            const candidates = changedCandidates.slice(1);
            const ambiguous = sameRank(selected, candidates[0]);
            return {
                targetLiuQin: target,
                selectionStatus: ambiguous ? 'ambiguous' : 'from_changed',
                selectionNote: ambiguous
                    ? `本卦无${target}而多爻变出同类，当前需并看其动变、旺衰与化变去向。`
                    : `本卦无${target}而${yaoName(selected.position) || '变爻'}变出用神，依”变者显也”先取变爻。`,
                selected,
                candidates,
            };
        }
        const temporalCandidates = buildTemporalCandidates(target, gongElement, monthZhi, dayZhi).sort(compareCandidate);
        if (temporalCandidates.length > 0) {
            const selected = temporalCandidates[0];
            return {
                targetLiuQin: target,
                selectionStatus: 'from_temporal',
                selectionNote: `本卦与变爻未稳见${target}，先以月建/日辰代用，再观卦内后续应机。`,
                selected,
                candidates: temporalCandidates.slice(1),
            };
        }
        const fuShenList = fuShenByTarget.get(target) || [];
        const fuShenCandidates = fuShenList
            .map((item) => buildFuShenCandidate(item, kongWang, fullYaos.find((yao) => yao.position === item.feiShenPosition)))
            .sort(compareCandidate);
        if (fuShenCandidates.length > 0) {
            const selected = fuShenCandidates[0];
            return {
                targetLiuQin: target,
                selectionStatus: 'from_fushen',
                selectionNote: `飞爻、变爻与月日均未稳取到${target}，转取伏神；当前需结合“出伏/生扶/冲空”条件并看。`,
                selected,
                candidates: fuShenCandidates.slice(1),
            };
        }
        return {
            targetLiuQin: target,
            selectionStatus: 'missing',
            selectionNote: `卦中未见${target}，本次无法稳定取用。`,
            selected: {
                liuQin: target,
                element: '土',
                source: 'visible',
                strength: 'unknown',
                strengthLabel: '未取到',
                movementState: 'static',
                movementLabel: '静',
                isShiYao: false,
                isYingYao: false,
                evidence: ['卦中未见目标六亲'],
            },
            candidates: [],
        };
    });
}
function calculateShenSystem(group, fullYaos, gongElement) {
    const yongShenElement = group.selected.element;
    const yuanWuXing = WUXING_BEI_SHENG[yongShenElement];
    const jiWuXing = WUXING_BEI_KE[yongShenElement];
    const chouWuXing = WUXING_BEI_KE[yuanWuXing];
    const findMember = (wuXing) => {
        const liuQin = getLiuQin(gongElement, wuXing);
        const positions = fullYaos.filter((yao) => yao.liuQin === liuQin).map((yao) => yao.position);
        return positions.length > 0 ? { liuQin, wuXing, positions } : undefined;
    };
    return {
        yuanShen: findMember(yuanWuXing),
        jiShen: findMember(jiWuXing),
        chouShen: findMember(chouWuXing),
    };
}
function calculateTimeRecommendations(groups) {
    const recommendations = [];
    for (const group of groups) {
        const selected = group.selected;
        if (group.selectionStatus === 'missing') {
            recommendations.push({
                targetLiuQin: group.targetLiuQin,
                type: 'critical',
                trigger: '先明确取用后再断应期',
                basis: ['目标六亲未能稳定落点'],
                description: `本卦暂未稳取到${group.targetLiuQin}，此时不宜强断具体应期。`,
            });
            continue;
        }
        const shouldAddGenericFavorable = Boolean(selected.naJia
            && group.selectionStatus !== 'from_fushen'
            && group.selectionStatus !== 'from_temporal'
            && selected.strength !== 'weak'
            && selected.strength !== 'unknown'
            && selected.movementState !== 'day_break'
            && selected.kongWangState !== 'kong_static');
        if (shouldAddGenericFavorable && selected.naJia) {
            recommendations.push({
                targetLiuQin: group.targetLiuQin,
                type: 'favorable',
                earthlyBranch: selected.naJia,
                trigger: `逢${selected.naJia}日/月`,
                basis: [`用神纳甲${selected.naJia}`, selected.strengthLabel],
                description: `用神${group.targetLiuQin}逢${selected.naJia}日/月时更容易显事，应以当时旺衰再复核。`,
            });
        }
        if (selected.source === 'fushen') {
            recommendations.push({
                targetLiuQin: group.targetLiuQin,
                type: 'critical',
                trigger: '待出伏',
                basis: ['用神伏藏', group.selectionNote],
                description: `当前取的是伏神${group.targetLiuQin}，要看其何时出伏、得助或飞神发动。`,
            });
        }
        if (selected.kongWangState === 'kong_static' && selected.naJia) {
            recommendations.push({
                targetLiuQin: group.targetLiuQin,
                type: 'critical',
                earthlyBranch: selected.naJia,
                trigger: `待${LIU_CHONG[selected.naJia]}冲空或逢建填实`,
                basis: ['用神静空'],
                description: `用神${group.targetLiuQin}静空，通常先看冲空、填实、临建之后再应。`,
            });
        }
        if (selected.kongWangState === 'kong_changing' && selected.naJia) {
            recommendations.push({
                targetLiuQin: group.targetLiuQin,
                type: 'critical',
                earthlyBranch: selected.naJia,
                trigger: `动空待${LIU_CHONG[selected.naJia]}冲实或出空`,
                basis: ['用神动空'],
                description: `用神${group.targetLiuQin}虽动而仍在空地，宜看冲实、出空或后续得助之机。`,
            });
        }
        if (selected.kongWangState === 'kong_ri_chong' || selected.kongWangState === 'kong_yue_jian') {
            recommendations.push({
                targetLiuQin: group.targetLiuQin,
                type: 'critical',
                earthlyBranch: selected.naJia,
                trigger: selected.kongWangState === 'kong_ri_chong' ? '冲空转实' : '临建不空',
                basis: [selected.kongWangState === 'kong_ri_chong' ? '日冲起空' : '月建填实'],
                description: `用神${group.targetLiuQin}${selected.kongWangState === 'kong_ri_chong' ? '得日冲而空起' : '临月建而不作真空'}，可视作由空转实的重要条件。`,
            });
        }
        if (selected.movementState === 'changing' || selected.movementState === 'hidden_moving') {
            const isChanging = selected.movementState === 'changing';
            const changedBranch = isChanging ? selected.changedNaJia : undefined;
            const triggerText = isChanging ? '明动发动之期' : '暗动被引发之期';
            const basis = [selected.movementLabel];
            let desc = `用神${group.targetLiuQin}${selected.movementLabel}，近期容易出现实际动作或关键转折。`;
            if (changedBranch) {
                basis.push(`变爻地支${changedBranch}`);
                desc += `变爻指向${changedBranch}，逢${changedBranch}日/月可为应期参考。`;
            }
            recommendations.push({
                targetLiuQin: group.targetLiuQin,
                type: 'critical',
                earthlyBranch: changedBranch || selected.naJia,
                trigger: triggerText,
                basis,
                description: desc,
            });
        }
        if (selected.movementState === 'day_break' || selected.strength === 'weak') {
            recommendations.push({
                targetLiuQin: group.targetLiuQin,
                type: 'unfavorable',
                earthlyBranch: selected.naJia,
                trigger: '未得生扶之前',
                basis: [selected.movementLabel, selected.strengthLabel],
                description: `当前${group.targetLiuQin}偏弱或受破，未见生扶、出空、回头生等转机前，不宜过早定成。`,
            });
        }
    }
    return recommendations;
}
function buildWarnings(groups, sanHeAnalysis, guaFanFuYin, chongHeTransition) {
    const warnings = [];
    if (guaFanFuYin.isFuYin && guaFanFuYin.description) {
        warnings.push(guaFanFuYin.description);
    }
    if (guaFanFuYin.isFanYin && guaFanFuYin.description) {
        warnings.push(guaFanFuYin.description);
    }
    if (chongHeTransition.type !== 'none' && chongHeTransition.description) {
        warnings.push(chongHeTransition.description);
    }
    for (const group of groups) {
        if (group.selectionStatus === 'ambiguous') {
            warnings.push(`用神${group.targetLiuQin}同类并见，需并看而非强取一爻。`);
        }
        if (group.selected.kongWangState === 'kong_static') {
            warnings.push(`用神${group.targetLiuQin}静空，须待填实或出空。`);
        }
        if (group.selected.movementState === 'day_break') {
            const isYuePo = group.selected.evidence.some(e => e.includes('月破'));
            if (isYuePo) {
                warnings.push(`用神${group.targetLiuQin}月破，整月无力，须过月方可论吉凶。`);
            }
            else {
                warnings.push(`用神${group.targetLiuQin}日破，先看能否得助赢救。`);
            }
        }
    }
    if (sanHeAnalysis.fullSanHeList && sanHeAnalysis.fullSanHeList.length > 0) {
        warnings.push(...sanHeAnalysis.fullSanHeList.map((item) => item.description));
    }
    else if (sanHeAnalysis.fullSanHe) {
        warnings.push(sanHeAnalysis.fullSanHe.description);
    }
    if (sanHeAnalysis.hasBanHe) {
        warnings.push('卦中见半合，只能作辅助证据，不能单独代替用神旺衰。');
    }
    return warnings;
}
export function performFullAnalysis(yaos, hexagramCode, changedCode, question, date, options) {
    const targets = resolveYongShenTargets(question, options?.yongShenTargets);
    const ganZhiTime = calculateGanZhiTime(date);
    const monthZhi = ganZhiTime.month.zhi;
    const dayZhi = ganZhiTime.day.zhi;
    const kongWangByPillar = calculateKongWangByPillar(ganZhiTime);
    const kongWang = kongWangByPillar.day;
    const palace = findPalace(hexagramCode);
    const gongElement = palace?.element || '土';
    const baseYaos = calculateFullYaoInfo(yaos, hexagramCode, ganZhiTime.day.gan);
    const fullYaos = baseYaos.map((yao) => {
        const influence = getYaoInfluence(yao.naJia, monthZhi, dayZhi);
        const kongWangState = checkYaoKongWang(yao.naJia, kongWang, monthZhi, dayZhi, yao.change === 'changing');
        const strength = calculateYaoStrength(yao.wuXing, monthZhi, yao.change === 'changing', kongWangState, influence, yao.naJia);
        const movementState = getYaoMovementState(yao, strength);
        const changSheng = getChangSheng(yao.wuXing, monthZhi);
        return {
            ...yao,
            isChanging: yao.change === 'changing',
            movementState,
            movementLabel: MOVEMENT_LABELS[movementState],
            kongWangState,
            influence,
            strength,
            changedYao: null,
            shenSha: [],
            changSheng: {
                stage: changSheng,
                strength: CHANG_SHENG_STRENGTH[changSheng],
            },
        };
    });
    const changedYaoDetails = [];
    if (changedCode) {
        for (const yao of baseYaos) {
            if (yao.change !== 'changing') {
                continue;
            }
            const changed = calculateChangedYaoDetail(hexagramCode, changedCode, yao.position, gongElement, yao, kongWang);
            changedYaoDetails.push(changed);
            const target = fullYaos.find((item) => item.position === yao.position);
            if (target) {
                target.changedYao = changed;
                target.changeAnalysis = analyzeYaoChange(yao.naJia, changed.naJia, yao.wuXing, changed.wuXing, kongWang);
            }
        }
    }
    const shenShaContext = {
        yearStem: ganZhiTime.year.gan,
        yearBranch: ganZhiTime.year.zhi,
        monthStem: ganZhiTime.month.gan,
        monthBranch: ganZhiTime.month.zhi,
        dayStem: ganZhiTime.day.gan,
        dayBranch: ganZhiTime.day.zhi,
        hourStem: ganZhiTime.hour.gan,
        hourBranch: ganZhiTime.hour.zhi,
        kongWang: {
            xun: kongWang.xun,
            kongZhi: [kongWang.kongDizhi[0], kongWang.kongDizhi[1]],
        },
    };
    for (const yao of fullYaos) {
        yao.shenSha = calculateBranchShenSha(shenShaContext, yao.naJia);
    }
    // 计算每爻位的飞伏神
    const perYaoFuShen = calculatePerYaoFuShen(hexagramCode, baseYaos, gongElement);
    for (const yao of fullYaos) {
        const fs = perYaoFuShen.get(yao.position);
        if (fs) {
            yao.fuShen = fs;
        }
    }
    const fuShenByTarget = new Map();
    for (const target of targets) {
        fuShenByTarget.set(target, calculateFuShen(hexagramCode, baseYaos, target, gongElement, monthZhi, dayZhi, kongWang));
    }
    const yongShen = buildYongShenGroups(fullYaos, fuShenByTarget, targets, gongElement, monthZhi, dayZhi, kongWang);
    const shenSystemByYongShen = yongShen.map((group) => ({
        targetLiuQin: group.targetLiuQin,
        ...calculateShenSystem(group, fullYaos, gongElement),
    }));
    const sanHeAnalysis = analyzeSanHe(baseYaos, changedYaoDetails, monthZhi, dayZhi);
    const liuChongGuaInfo = checkLiuChongGua(baseYaos);
    const liuHeGuaInfo = checkLiuHeGua(baseYaos);
    const chongHeTransition = checkChongHeTransition(baseYaos, changedCode);
    const guaFanFuYin = checkGuaFanFuYin(changedCode, baseYaos);
    const timeRecommendations = calculateTimeRecommendations(yongShen);
    const globalShenSha = calculateGlobalShenSha(shenShaContext);
    const warnings = buildWarnings(yongShen, sanHeAnalysis, guaFanFuYin, chongHeTransition);
    const fuShen = Array.from(fuShenByTarget.values()).flat();
    return {
        ganZhiTime,
        kongWang,
        kongWangByPillar,
        fullYaos,
        yongShen,
        fuShen: fuShen.length > 0 ? fuShen : undefined,
        shenSystemByYongShen,
        globalShenSha,
        timeRecommendations,
        liuChongGuaInfo,
        liuHeGuaInfo,
        chongHeTransition,
        guaFanFuYin,
        sanHeAnalysis,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
export function getHexagramContext(code) {
    const hexagram = getHexagramByCode(code);
    return {
        hexagram,
        palace: findPalace(code),
        guaCi: hexagram ? GUA_CI[hexagram.name] : undefined,
        xiangCi: hexagram ? XIANG_CI[hexagram.name] : undefined,
    };
}
const NUMBER_TO_TRIGRAM = {
    1: '乾', 2: '兑', 3: '离', 4: '震',
    5: '巽', 6: '坎', 7: '艮', 8: '坤',
};
const TRIGRAM_LINES = {
    乾: [1, 1, 1], 兑: [1, 1, 0], 离: [1, 0, 1], 震: [1, 0, 0],
    巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0],
};
function calculateChangedLines(mainCode, changedCode) {
    const lines = [];
    for (let index = 0; index < 6; index += 1) {
        if (mainCode[index] !== changedCode[index]) {
            lines.push(index + 1);
        }
    }
    return lines;
}
function calculateChangedHexagram(code, changedLines) {
    const chars = code.split('');
    for (const line of changedLines) {
        const index = line - 1;
        chars[index] = chars[index] === '1' ? '0' : '1';
    }
    return chars.join('');
}
function divine(rng) {
    const yaos = [];
    const changedLines = [];
    for (let index = 0; index < 6; index += 1) {
        const coins = [
            rng() > 0.5 ? 3 : 2,
            rng() > 0.5 ? 3 : 2,
            rng() > 0.5 ? 3 : 2,
        ];
        const sum = coins.reduce((left, right) => left + right, 0);
        let type;
        let change = 'stable';
        if (sum === 6) {
            type = 0;
            change = 'changing';
        }
        else if (sum === 7) {
            type = 1;
        }
        else if (sum === 8) {
            type = 0;
        }
        else {
            type = 1;
            change = 'changing';
        }
        if (change === 'changing') {
            changedLines.push(index + 1);
        }
        yaos.push({
            type,
            change,
            position: index + 1,
        });
    }
    return {
        yaos,
        hexagramCode: yaos.map((item) => item.type).join(''),
        changedLines,
    };
}
function divineByTime(date) {
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();
    const yearBranch = lunar.getYearShengXiao();
    const zodiacToBranch = {
        鼠: 1, 牛: 2, 虎: 3, 兔: 4, 龙: 5, 蛇: 6,
        马: 7, 羊: 8, 猴: 9, 鸡: 10, 狗: 11, 猪: 12,
    };
    const yearBranchNum = zodiacToBranch[yearBranch] || 1;
    const lunarMonth = Math.abs(lunar.getMonth());
    const lunarDay = lunar.getDay();
    const hour = date.getHours();
    const hourBranchIndex = Math.floor((hour + 1) / 2) % 12;
    const hourBranchNum = hourBranchIndex + 1;
    let upperNum = (yearBranchNum + lunarMonth + lunarDay) % 8;
    if (upperNum === 0)
        upperNum = 8;
    let lowerNum = (yearBranchNum + lunarMonth + lunarDay + hourBranchNum) % 8;
    if (lowerNum === 0)
        lowerNum = 8;
    let movingLine = (yearBranchNum + lunarMonth + lunarDay + hourBranchNum) % 6;
    if (movingLine === 0)
        movingLine = 6;
    const upperTrigram = NUMBER_TO_TRIGRAM[upperNum];
    const lowerTrigram = NUMBER_TO_TRIGRAM[lowerNum];
    const lowerLines = TRIGRAM_LINES[lowerTrigram];
    const upperLines = TRIGRAM_LINES[upperTrigram];
    const lines = [...lowerLines, ...upperLines];
    const hexagramCode = lines.join('');
    const changedLines = [movingLine];
    const yaos = lines.map((line, index) => ({
        type: line,
        change: (index + 1) === movingLine ? 'changing' : 'stable',
        position: index + 1,
    }));
    return { yaos, hexagramCode, changedLines };
}
function divineByNumber(numbers) {
    if (numbers.length < 2 || numbers.length > 3) {
        throw new Error('数字起卦需要提供2或3个数字');
    }
    if (!numbers.every((value) => Number.isInteger(value) && value > 0)) {
        throw new Error('数字起卦的 numbers 必须是正整数');
    }
    let upperNum;
    let lowerNum;
    let movingLine;
    if (numbers.length === 2) {
        upperNum = numbers[0] % 8;
        if (upperNum === 0)
            upperNum = 8;
        lowerNum = numbers[1] % 8;
        if (lowerNum === 0)
            lowerNum = 8;
        movingLine = (numbers[0] + numbers[1]) % 6;
        if (movingLine === 0)
            movingLine = 6;
    }
    else {
        upperNum = numbers[0] % 8;
        if (upperNum === 0)
            upperNum = 8;
        lowerNum = numbers[1] % 8;
        if (lowerNum === 0)
            lowerNum = 8;
        movingLine = numbers[2] % 6;
        if (movingLine === 0)
            movingLine = 6;
    }
    const upperTrigram = NUMBER_TO_TRIGRAM[upperNum];
    const lowerTrigram = NUMBER_TO_TRIGRAM[lowerNum];
    const lowerLines = TRIGRAM_LINES[lowerTrigram];
    const upperLines = TRIGRAM_LINES[upperTrigram];
    const lines = [...lowerLines, ...upperLines];
    const hexagramCode = lines.join('');
    const changedLines = [movingLine];
    const yaos = lines.map((line, index) => ({
        type: line,
        change: (index + 1) === movingLine ? 'changing' : 'stable',
        position: index + 1,
    }));
    return { yaos, hexagramCode, changedLines };
}
function toLiuyaoOutput(params) {
    const { question, hexagramCode, changedCode, analysisDate, yaos } = params;
    const baseHexagram = findHexagram(hexagramCode);
    const changedHexagram = changedCode ? findHexagram(changedCode) : undefined;
    const basePalace = getPalaceInfo(hexagramCode);
    const changedPalace = changedCode ? getPalaceInfo(changedCode) : undefined;
    if (!baseHexagram) {
        throw new Error(`未找到卦象：${hexagramCode}`);
    }
    const analysis = performFullAnalysis(yaos, hexagramCode, changedCode, question, analysisDate, { yongShenTargets: params.selectedTargets });
    const fullYaos = analysis.fullYaos.map((item) => {
        const { change: omittedChange, ...yao } = item;
        void omittedChange;
        return {
            ...yao,
            yaoCi: YAO_CI[baseHexagram.name]?.[yao.position - 1],
        };
    });
    const { nuclearHexagram, oppositeHexagram, reversedHexagram } = calculateDerivedHexagrams(hexagramCode);
    const guaShen = calculateGuaShen(hexagramCode);
    return {
        question,
        hexagramName: baseHexagram.name,
        hexagramGong: basePalace?.name || '',
        hexagramElement: baseHexagram.element,
        hexagramBrief: baseHexagram.nature,
        guaCi: GUA_CI[baseHexagram.name],
        xiangCi: XIANG_CI[baseHexagram.name],
        changedHexagramName: changedHexagram?.name,
        changedHexagramGong: changedPalace?.name,
        changedHexagramElement: changedHexagram?.element,
        changedGuaCi: changedHexagram ? GUA_CI[changedHexagram.name] : undefined,
        changedXiangCi: changedHexagram ? XIANG_CI[changedHexagram.name] : undefined,
        ganZhiTime: analysis.ganZhiTime,
        kongWang: analysis.kongWang,
        kongWangByPillar: analysis.kongWangByPillar,
        fullYaos,
        yongShen: analysis.yongShen,
        fuShen: analysis.fuShen,
        shenSystemByYongShen: analysis.shenSystemByYongShen,
        globalShenSha: analysis.globalShenSha,
        liuChongGuaInfo: analysis.liuChongGuaInfo,
        liuHeGuaInfo: analysis.liuHeGuaInfo,
        chongHeTransition: analysis.chongHeTransition,
        guaFanFuYin: analysis.guaFanFuYin,
        sanHeAnalysis: analysis.sanHeAnalysis,
        warnings: analysis.warnings,
        timeRecommendations: analysis.timeRecommendations,
        nuclearHexagram,
        oppositeHexagram,
        reversedHexagram,
        guaShen,
    };
}
export async function calculateLiuyaoData(input) {
    const question = typeof input.question === 'string' ? input.question.trim() : '';
    if (!question) {
        throw new Error('请先明确问题后再解卦');
    }
    if (hasInvalidYongShenTargets(input.yongShenTargets)) {
        throw new Error('yongShenTargets 含非法值');
    }
    const selectedTargets = normalizeYongShenTargets(input.yongShenTargets);
    if (selectedTargets.length === 0) {
        throw new Error('请至少选择一个分析目标');
    }
    const { method = 'auto', hexagramName, changedHexagramName, date, } = input;
    if (!date) {
        throw new Error('date 为必填项，请提供占卜日期时间（格式：YYYY-MM-DDTHH:MM 或 YYYY-MM-DD HH:MM:SS）');
    }
    const trimmedDate = date.trim();
    const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d{1,3})?([zZ]|[+-]\d{2}:\d{2})?$/;
    if (!DATE_TIME_RE.test(trimmedDate)) {
        throw new Error('date 格式无效，必须包含时间，请使用 YYYY-MM-DDTHH:MM[:SS] 或带时区偏移的 ISO 时间');
    }
    const normalizedDateInput = trimmedDate.replace(' ', 'T');
    const analysisDate = new Date(normalizedDateInput);
    if (Number.isNaN(analysisDate.getTime())) {
        throw new Error('date 日期无效，请检查年月日时分是否合理');
    }
    const dateKey = `${analysisDate.getFullYear()}-${String(analysisDate.getMonth() + 1).padStart(2, '0')}-${String(analysisDate.getDate()).padStart(2, '0')}T${String(analysisDate.getHours()).padStart(2, '0')}`;
    const seed = resolveSeed(input.seed, `${dateKey}|${question}|${method}|${hexagramName || ''}|${changedHexagramName || ''}`, input.seedScope);
    const rng = createSeededRng(seed);
    let yaos;
    let hexagramCode;
    let changedCode;
    let changedLines = [];
    if (method === 'select') {
        if (!hexagramName) {
            throw new Error('select 模式必须提供 hexagramName');
        }
        const baseHexagram = findHexagram(hexagramName);
        if (!baseHexagram) {
            throw new Error(`未找到卦象：${hexagramName}`);
        }
        hexagramCode = baseHexagram.code;
        if (changedHexagramName) {
            const changedHexagram = findHexagram(changedHexagramName);
            if (!changedHexagram) {
                throw new Error(`未找到变卦：${changedHexagramName}`);
            }
            changedCode = changedHexagram.code;
            changedLines = calculateChangedLines(hexagramCode, changedCode);
        }
        yaos = hexagramCode.split('').map((char, index) => ({
            type: Number.parseInt(char, 10),
            change: changedLines.includes(index + 1) ? 'changing' : 'stable',
            position: index + 1,
        }));
    }
    else if (method === 'time') {
        const result = divineByTime(analysisDate);
        yaos = result.yaos;
        hexagramCode = result.hexagramCode;
        changedLines = result.changedLines;
        if (changedLines.length > 0) {
            changedCode = calculateChangedHexagram(hexagramCode, changedLines);
        }
    }
    else if (method === 'number') {
        if (!input.numbers || input.numbers.length < 2) {
            throw new Error('数字起卦需要提供 numbers 数组（2或3个数字）');
        }
        const result = divineByNumber(input.numbers);
        yaos = result.yaos;
        hexagramCode = result.hexagramCode;
        changedLines = result.changedLines;
        if (changedLines.length > 0) {
            changedCode = calculateChangedHexagram(hexagramCode, changedLines);
        }
    }
    else {
        const result = divine(rng);
        yaos = result.yaos;
        hexagramCode = result.hexagramCode;
        changedLines = result.changedLines;
        if (changedLines.length > 0) {
            changedCode = calculateChangedHexagram(hexagramCode, changedLines);
        }
    }
    const output = toLiuyaoOutput({
        question,
        hexagramCode,
        changedCode,
        analysisDate,
        yaos,
        changedLines,
        selectedTargets,
    });
    return {
        ...output,
        seed: method === 'auto' || input.seed || input.seedScope ? seed : undefined,
    };
}
