import { Solar } from 'lunar-javascript';
import { normalizeDetailLevelBinary } from '../../shared/render-utils.js';
export function renderZiweiHoroscopeCanonicalJSON(result, options = {}) {
    const detailLevel = normalizeDetailLevelBinary(options.detailLevel);
    const parsedTargetDate = (() => {
        const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/u.exec(result.targetDate.trim());
        if (!match)
            return null;
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        return {
            year,
            month,
            day,
            lunarMonthLabel: `农历${Solar.fromYmd(year, month, day).getLunar().getMonthInChinese()}月`,
        };
    })();
    const zodiacMap = {
        子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇',
        午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪',
    };
    const mutagenOrder = ['禄', '权', '科', '忌'];
    const formatTimeNote = (layer) => {
        switch (layer) {
            case '大限':
                if (typeof result.decadal.startAge === 'number' && typeof result.decadal.endAge === 'number') {
                    return `虚岁 ${result.decadal.startAge}~${result.decadal.endAge}`;
                }
                return '-';
            case '流年': {
                const fallbackYear = Number(result.targetDate.slice(0, 4));
                const year = typeof parsedTargetDate?.year === 'number'
                    ? parsedTargetDate.year
                    : (Number.isFinite(fallbackYear) ? fallbackYear : 0);
                const zodiac = zodiacMap[result.yearly.earthlyBranch] || '';
                return zodiac ? `${year}年 (${zodiac}年)` : `${year}年`;
            }
            case '小限':
                return `虚岁 ${result.age.nominalAge}`;
            case '流月':
                return parsedTargetDate?.lunarMonthLabel || '-';
            case '流日':
                return parsedTargetDate ? `${parsedTargetDate.day}日` : '-';
            case '流时':
                return result.hourly.earthlyBranch ? `${result.hourly.earthlyBranch}时` : '-';
            default:
                return '-';
        }
    };
    const formatMutagen = (stars) => mutagenOrder
        .map((mutagen, index) => stars[index] ? `${stars[index]}[化${mutagen}]` : null)
        .filter((value) => !!value);
    const transitGroups = (() => {
        const entries = result.transitStars || [];
        const formatPalace = (palaceName) => palaceName.endsWith('宫') ? palaceName : `${palaceName}宫`;
        const pick = (names) => entries.filter((entry) => names.includes(entry.starName)).map((entry) => `${entry.starName}(${formatPalace(entry.palaceName)})`);
        return {
            吉星分布: pick(['流禄', '流魁', '流钺', '流马']),
            煞星分布: pick(['流羊', '流陀']),
            '桃花/文星': pick(['流昌', '流曲', '流鸾', '流喜']),
        };
    })();
    const periodEntries = [
        { layer: '大限', data: result.decadal },
        { layer: '流年', data: result.yearly },
        { layer: '小限', data: result.age },
        { layer: '流月', data: result.monthly },
        { layer: '流日', data: result.daily },
        ...(detailLevel === 'full' && result.hasExplicitTargetTime && result.hourly.heavenlyStem && result.hourly.earthlyBranch
            ? [{ layer: '流时', data: result.hourly }]
            : []),
    ];
    const json = {
        基本信息: {
            目标日期: result.targetDate,
            五行局: result.fiveElement,
        },
        运限叠宫: periodEntries.map(({ layer, data }) => {
            const entry = {
                层次: layer,
                时间段备注: formatTimeNote(layer),
                宫位索引: data.index,
                干支: `${data.heavenlyStem}${data.earthlyBranch}`,
                落入本命宫位: data.palaceNames[0] ? `${data.palaceNames[0]}宫` : '-',
                运限四化: formatMutagen(data.mutagen),
            };
            if (detailLevel === 'full' && data.palaceNames.length > 0)
                entry.十二宫重排 = [...data.palaceNames];
            return entry;
        }),
    };
    if (detailLevel === 'full') {
        json.基本信息.阳历 = result.solarDate;
        json.基本信息.农历 = result.lunarDate;
        json.基本信息.命主 = result.soul;
        json.基本信息.身主 = result.body;
    }
    if (transitGroups.吉星分布.length || transitGroups.煞星分布.length || transitGroups['桃花/文星'].length) {
        json.流年星曜 = transitGroups;
    }
    if (detailLevel === 'full' && result.yearlyDecStar) {
        if (result.yearlyDecStar.suiqian12.length)
            json.岁前十二星 = result.yearlyDecStar.suiqian12;
        if (result.yearlyDecStar.jiangqian12.length)
            json.将前十二星 = result.yearlyDecStar.jiangqian12;
    }
    return json;
}
// ===== 紫微飞星 =====
