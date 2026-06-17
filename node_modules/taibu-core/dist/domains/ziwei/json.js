import { formatZiweiCanonicalLunarDate, normalizeDetailLevelBinary } from '../../shared/render-utils.js';
import { sortZiweiPalaces } from './text.js';
function buildZiweiTrueSolarTimeJSON(info) {
    const 跨日偏移 = info.dayOffset > 0
        ? `后${info.dayOffset}日`
        : info.dayOffset < 0
            ? `前${Math.abs(info.dayOffset)}日`
            : '当日';
    return {
        钟表时间: info.clockTime,
        真太阳时: info.trueSolarTime,
        经度: info.longitude,
        校正分钟: info.correctionMinutes,
        真太阳时索引: info.trueTimeIndex,
        跨日偏移,
    };
}
function buildZiweiStarJSON(star) {
    const result = { 星名: star.name };
    if (star.brightness)
        result.亮度 = star.brightness;
    if (star.mutagen)
        result.四化 = star.mutagen;
    if (star.selfMutagen)
        result.离心自化 = star.selfMutagen;
    if (star.oppositeMutagen)
        result.向心自化 = star.oppositeMutagen;
    return result;
}
function buildZiweiBirthYearMutagensJSON(result) {
    if (!result.mutagenSummary?.length)
        return undefined;
    const order = new Map([
        ['禄', 0],
        ['权', 1],
        ['科', 2],
        ['忌', 3],
    ]);
    return {
        天干: result.fourPillars.year.gan,
        四化星曜: [...result.mutagenSummary]
            .sort((left, right) => {
            const leftOrder = order.get(left.mutagen) ?? Number.MAX_SAFE_INTEGER;
            const rightOrder = order.get(right.mutagen) ?? Number.MAX_SAFE_INTEGER;
            return leftOrder - rightOrder;
        })
            .map((item) => ({
            四化: item.mutagen,
            星曜: item.starName,
            宫位: item.palaceName,
        })),
    };
}
export function renderZiweiCanonicalJSON(result, options = {}) {
    const detailLevel = normalizeDetailLevelBinary(options.detailLevel);
    const basicInfo = {
        阳历: result.solarDate,
        农历: formatZiweiCanonicalLunarDate(result) || result.lunarDate,
        四柱: `${result.fourPillars.year.gan}${result.fourPillars.year.zhi} ${result.fourPillars.month.gan}${result.fourPillars.month.zhi} ${result.fourPillars.day.gan}${result.fourPillars.day.zhi} ${result.fourPillars.hour.gan}${result.fourPillars.hour.zhi}`,
        命主: result.soul,
        身主: result.body,
        五行局: result.fiveElement,
    };
    if (result.gender === 'male' || result.gender === 'female') {
        basicInfo.性别 = result.gender === 'male' ? '男' : '女';
    }
    const birthYearMutagens = buildZiweiBirthYearMutagensJSON(result);
    if (birthYearMutagens)
        basicInfo.生年四化 = birthYearMutagens;
    if (detailLevel === 'full') {
        if (result.time)
            basicInfo.时辰 = result.time + (result.timeRange ? `（${result.timeRange}）` : '');
        if (result.douJun)
            basicInfo.斗君 = result.douJun;
        if (result.lifeMasterStar)
            basicInfo.命主星 = result.lifeMasterStar;
        if (result.bodyMasterStar)
            basicInfo.身主星 = result.bodyMasterStar;
        if (result.trueSolarTimeInfo)
            basicInfo.真太阳时 = buildZiweiTrueSolarTimeJSON(result.trueSolarTimeInfo);
    }
    const palaces = sortZiweiPalaces(result.palaces).map((palace) => {
        const base = {
            宫位: palace.name,
            干支: `${palace.heavenlyStem}${palace.earthlyBranch}`,
            是否身宫: palace.isBodyPalace ? '是' : '否',
            是否来因宫: palace.isOriginalPalace ? '是' : '否',
            主星及四化: palace.majorStars.map(buildZiweiStarJSON),
            辅星: palace.minorStars.map(buildZiweiStarJSON),
            大限: palace.decadalRange ? `${palace.decadalRange[0]}~${palace.decadalRange[1]}` : undefined,
        };
        if (detailLevel !== 'full') {
            return base;
        }
        const shensha = [palace.changsheng12, palace.boshi12, palace.jiangqian12, palace.suiqian12].filter(Boolean);
        return {
            ...base,
            宫位索引: palace.index,
            杂曜: (palace.adjStars || []).map(buildZiweiStarJSON),
            神煞: shensha,
            流年虚岁: palace.liuNianAges || [],
            小限虚岁: palace.ages || [],
        };
    });
    const json = { 基本信息: basicInfo, 十二宫位: palaces };
    if (detailLevel === 'full' && result.smallLimit?.length) {
        json.小限 = result.smallLimit.map((item) => ({
            宫位: item.palaceName,
            虚岁: item.ages,
        }));
    }
    return json;
}
// ===== 奇门遁甲 =====
