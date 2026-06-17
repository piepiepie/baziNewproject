/**
 * 八字计算核心引擎
 */
import type { BaziFiveElementsStats, BaziInput, BaziLiuRiInfo, BaziLiuYueInfo, BaziOutput, BaziShenShaOutput } from './types.js';
import type { HiddenStemInfo, PillarRelation } from '../shared/types.js';
import { getDiShi as getDiShiCore } from '../../shared/utils.js';
export type { BaziFiveElementsStats, BaziInput, BaziLiuRiInfo, BaziLiuYueInfo, BaziOutput, BaziShenShaOutput, PillarInfo, } from './types.js';
export type { HiddenStemInfo, PillarRelation, } from '../shared/types.js';
type PillarShenShaByPosition = {
    year: string[];
    month: string[];
    day: string[];
    hour: string[];
};
type FortuneRuntimeContext = {
    dayStem: string;
    dayBranch: string;
    yearBranch: string;
};
export declare function getNaYin(stem: string, branch: string): string;
export declare const getDiShi: typeof getDiShiCore;
/** 从纳音字符串提取五行（最后一个字：金/木/水/火/土） */
export declare function getNaYinElement(nayin: string): string;
export declare function calculateBaziFiveElementsStats(fourPillars: BaziOutput['fourPillars']): BaziFiveElementsStats;
export declare function buildHiddenStems(branch: string, dayStem: string): HiddenStemInfo[];
export declare function analyzePillarRelations(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string): PillarRelation[];
export declare function calculateBaziPillarShenSha(params: {
    yearStem: string;
    yearBranch: string;
    monthStem: string;
    monthBranch: string;
    dayStem: string;
    dayBranch: string;
    hourStem: string;
    hourBranch: string;
    kongWang: {
        xun: string;
        kongZhi: [string, string];
    };
    yearNaYinElement?: string;
}): PillarShenShaByPosition;
export declare function calculateBaziFortuneShenSha(params: {
    targetBranch: string;
    dayStem: string;
    dayBranch: string;
    yearBranch: string;
}): string[];
export declare function calculateBaziLiuYueData(year: number, context?: FortuneRuntimeContext): BaziLiuYueInfo[];
export declare function calculateBaziLiuRiData(startDate: string, endDate: string, context?: FortuneRuntimeContext): BaziLiuRiInfo[];
export declare function calculateBaziData(input: BaziInput): BaziOutput;
export declare function calculateBaziShenShaData(input: BaziInput): BaziShenShaOutput;
//# sourceMappingURL=calculate.d.ts.map