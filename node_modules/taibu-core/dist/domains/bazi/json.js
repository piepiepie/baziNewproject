import { normalizeDetailLevelBinary } from '../../shared/render-utils.js';
import { GAN_WUXING } from '../../shared/utils.js';
function buildTrueSolarTimeJSON(info) {
    return {
        钟表时间: info.clockTime,
        真太阳时: info.trueSolarTime,
        经度: info.longitude,
        校正分钟: info.correctionMinutes,
    };
}
function buildHiddenStemJSON(item) {
    return {
        天干: item.stem,
        十神: item.tenGod,
        ...(item.qiType ? { 气性: item.qiType } : {}),
    };
}
function buildBranchRelationJSON(item) {
    return {
        类型: item.type,
        地支: [...item.branches],
        描述: item.description,
    };
}
function buildLiunianItemJSON(item) {
    return {
        流年: item.year,
        年龄: item.age,
        干支: item.ganZhi,
        天干: item.gan,
        地支: item.zhi,
        十神: item.tenGod || '-',
        ...(item.nayin ? { 纳音: item.nayin } : {}),
        藏干: item.hiddenStems?.length
            ? item.hiddenStems.map(buildHiddenStemJSON)
            : [],
        ...(item.diShi ? { 地势: item.diShi } : {}),
        ...(item.shenSha?.length ? { 神煞: [...item.shenSha] } : {}),
        ...(item.branchRelations?.length ? { 原局关系: item.branchRelations.map(buildBranchRelationJSON) } : {}),
        ...(item.taiSui?.length ? { 太岁关系: [...item.taiSui] } : {}),
    };
}
function buildLeanHiddenStemItems(items) {
    return items?.map((item) => ({ stem: item.stem, tenGod: item.tenGod })) || [];
}
function buildDayunItemJSON(item) {
    return {
        起运年份: item.startYear,
        ...(typeof item.startAge === 'number' ? { 起运年龄: item.startAge } : {}),
        干支: item.ganZhi,
        ...(item.stem ? { 天干: item.stem } : {}),
        ...(item.branch ? { 地支: item.branch } : {}),
        十神: item.tenGod || '-',
        ...(item.branchTenGod ? { 地支主气十神: item.branchTenGod } : {}),
        藏干: item.hiddenStems?.length
            ? item.hiddenStems.map(buildHiddenStemJSON)
            : [],
        ...(item.diShi ? { 地势: item.diShi } : {}),
        ...(item.naYin ? { 纳音: item.naYin } : {}),
        ...(item.shenSha?.length ? { 神煞: [...item.shenSha] } : {}),
        ...(item.branchRelations?.length ? { 原局关系: item.branchRelations.map(buildBranchRelationJSON) } : {}),
        ...(item.liunianList?.length ? { 流年列表: item.liunianList.map(buildLiunianItemJSON) } : {}),
    };
}
function buildBaziCanonicalPillarShenSha(item) {
    return item.shenSha?.length ? [...item.shenSha] : [];
}
function buildBaziCanonicalRelations(result) {
    const posBranchMap = {
        '年支': result.fourPillars.year.branch,
        '月支': result.fourPillars.month.branch,
        '日支': result.fourPillars.day.branch,
        '时支': result.fourPillars.hour.branch,
    };
    const relationParts = [];
    const seen = new Set();
    const pushUnique = (value) => {
        if (!value || seen.has(value))
            return;
        seen.add(value);
        relationParts.push(value);
    };
    for (const relation of result.relations) {
        if (relation.type === '刑') {
            const branches = [...new Set(relation.pillars.map((pillar) => posBranchMap[pillar]))].join('');
            pushUnique(`${branches}刑（${relation.description}）`);
        }
        else {
            pushUnique(relation.description);
        }
    }
    for (const item of result.tianGanChongKe) {
        pushUnique(`${item.stemA}${item.stemB}冲克`);
    }
    for (const item of result.tianGanWuHe) {
        pushUnique(`${item.stemA}${item.stemB}合${item.resultElement}`);
    }
    for (const item of result.diZhiBanHe) {
        pushUnique(`${item.branches.join('')}半合${item.resultElement}`);
    }
    for (const item of result.diZhiSanHui) {
        pushUnique(`${item.branches.join('')}三会${item.resultElement}`);
    }
    return relationParts;
}
// ===== 八字 =====
export function renderBaziCanonicalJSON(chart, options = {}) {
    const detailLevel = normalizeDetailLevelBinary(options.detailLevel);
    const { dayun } = options;
    const basicInfo = {
        性别: chart.gender === 'male' ? '男' : '女',
        日主: chart.dayMaster,
        ...(detailLevel === 'full' ? { 命主五行: `${chart.dayMaster}${GAN_WUXING[chart.dayMaster.charAt(0)] || ''}` } : {}),
    };
    if (detailLevel === 'full' && chart.kongWang?.kongZhi?.length)
        basicInfo.空亡 = [...chart.kongWang.kongZhi];
    if (chart.birthPlace)
        basicInfo.出生地 = chart.birthPlace;
    if (chart.trueSolarTimeInfo)
        basicInfo.真太阳时 = buildTrueSolarTimeJSON(chart.trueSolarTimeInfo);
    if (detailLevel === 'full' && chart.taiYuan)
        basicInfo.胎元 = chart.taiYuan;
    if (detailLevel === 'full' && chart.mingGong)
        basicInfo.命宫 = chart.mingGong;
    const fourPillars = [
        ['年柱', chart.fourPillars.year],
        ['月柱', chart.fourPillars.month],
        ['日柱', chart.fourPillars.day],
        ['时柱', chart.fourPillars.hour],
    ].map(([label, pillar]) => {
        const entry = {
            柱: label,
            干支: `${pillar.stem}${pillar.branch}`,
            天干十神: pillar.tenGod || '-',
            藏干: pillar.hiddenStems.map((item) => buildHiddenStemJSON({
                stem: item.stem,
                tenGod: item.tenGod || '-',
                ...(detailLevel === 'full' ? { qiType: item.qiType } : {}),
            })),
            地势: pillar.diShi || '-',
            ...(detailLevel === 'full' && pillar.naYin ? { 纳音: pillar.naYin } : {}),
            ...(detailLevel === 'full' && pillar.shenSha?.length ? { 神煞: buildBaziCanonicalPillarShenSha(pillar) } : {}),
        };
        if (pillar.kongWang?.isKong)
            entry.空亡 = '是';
        return entry;
    });
    const relations = buildBaziCanonicalRelations(chart);
    const json = { 基本信息: basicInfo, 四柱: fourPillars, 干支关系: relations };
    if (dayun) {
        json.大运 = {
            起运信息: `${dayun.startAge}岁（${dayun.startAgeDetail}）`,
            大运列表: dayun.list.map((item) => buildDayunItemJSON({
                startYear: item.startYear,
                startAge: item.startAge,
                ganZhi: item.ganZhi,
                stem: detailLevel === 'full' ? item.stem : undefined,
                branch: detailLevel === 'full' ? item.branch : undefined,
                tenGod: item.tenGod,
                branchTenGod: detailLevel === 'full' ? item.branchTenGod : undefined,
                hiddenStems: detailLevel === 'full' ? item.hiddenStems : buildLeanHiddenStemItems(item.hiddenStems),
                diShi: detailLevel === 'full' ? item.diShi : undefined,
                naYin: detailLevel === 'full' ? item.naYin : undefined,
                shenSha: detailLevel === 'full' ? item.shenSha : undefined,
                branchRelations: detailLevel === 'full' ? item.branchRelations : undefined,
                liunianList: detailLevel === 'full' ? item.liunianList : undefined,
            })),
        };
    }
    return json;
}
// ===== 六爻 =====
