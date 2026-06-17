/**
 * 紫微斗数飞星分析核心引擎
 */
import { createAstrolabeWithTrueSolar, MUTAGEN_NAMES, STEM_MUTAGEN_TABLE } from '../ziwei/shared.js';
function buildActualFlights(palace, mutagens) {
    const requested = mutagens.length > 0 ? mutagens : [...MUTAGEN_NAMES];
    const places = palace.mutagedPlaces();
    const stemMutagens = STEM_MUTAGEN_TABLE[palace.heavenlyStem] || ['', '', '', ''];
    const result = [];
    for (const mutagen of requested) {
        const index = MUTAGEN_NAMES.indexOf(mutagen);
        if (index < 0)
            continue;
        result.push({
            mutagen,
            targetPalace: places[index]?.name ?? null,
            starName: stemMutagens[index] || null,
        });
    }
    return result;
}
function processQuery(astrolabe, query, idx) {
    switch (query.type) {
        case 'fliesTo': {
            const palace = astrolabe.palace(query.from);
            if (!palace)
                throw new Error(`宫位 "${query.from}" 不存在`);
            const mutagens = (query.mutagens || []);
            const result = palace.fliesTo(query.to, mutagens);
            return {
                queryIndex: idx,
                type: 'fliesTo',
                result,
                queryTarget: {
                    fromPalace: query.from,
                    toPalace: query.to,
                    mutagens: [...mutagens],
                },
                sourcePalaceGanZhi: `${palace.heavenlyStem}${palace.earthlyBranch}`,
                actualFlights: buildActualFlights(palace, mutagens),
            };
        }
        case 'selfMutaged': {
            const palace = astrolabe.palace(query.palace);
            if (!palace)
                throw new Error(`宫位 "${query.palace}" 不存在`);
            const mutagens = (query.mutagens || MUTAGEN_NAMES);
            const result = palace.selfMutaged(mutagens);
            return {
                queryIndex: idx,
                type: 'selfMutaged',
                result,
                queryTarget: {
                    palace: query.palace,
                    mutagens: [...mutagens],
                },
                sourcePalaceGanZhi: `${palace.heavenlyStem}${palace.earthlyBranch}`,
            };
        }
        case 'mutagedPlaces': {
            const palace = astrolabe.palace(query.palace);
            if (!palace)
                throw new Error(`宫位 "${query.palace}" 不存在`);
            const places = palace.mutagedPlaces();
            const result = MUTAGEN_NAMES.map((m, i) => ({
                mutagen: m,
                targetPalace: places[i]?.name ?? null,
            }));
            return {
                queryIndex: idx,
                type: 'mutagedPlaces',
                result,
                queryTarget: {
                    palace: query.palace,
                },
                sourcePalaceGanZhi: `${palace.heavenlyStem}${palace.earthlyBranch}`,
                actualFlights: buildActualFlights(palace, MUTAGEN_NAMES),
            };
        }
        case 'surroundedPalaces': {
            const surrounded = astrolabe.surroundedPalaces(query.palace);
            if (!surrounded)
                throw new Error(`宫位 "${query.palace}" 不存在`);
            const result = {
                target: { name: surrounded.target.name, index: surrounded.target.index },
                opposite: { name: surrounded.opposite.name, index: surrounded.opposite.index },
                wealth: { name: surrounded.wealth.name, index: surrounded.wealth.index },
                career: { name: surrounded.career.name, index: surrounded.career.index },
            };
            return {
                queryIndex: idx,
                type: 'surroundedPalaces',
                result,
                queryTarget: {
                    palace: query.palace,
                },
            };
        }
        default:
            throw new Error(`未知查询类型: ${query.type}`);
    }
}
export async function calculateZiweiFlyingStar(input) {
    if (!input.queries || !Array.isArray(input.queries) || input.queries.length === 0) {
        throw new Error('queries 不能为空');
    }
    const { astrolabe } = createAstrolabeWithTrueSolar(input);
    const results = input.queries.map((q, i) => processQuery(astrolabe, q, i));
    return { results };
}
