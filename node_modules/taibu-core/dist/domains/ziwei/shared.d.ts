/**
 * 紫微斗数共享工具函数
 */
import { astro } from 'iztro';
import type { BirthTimeInput, DiZhi, Gender, StarInfo, TrueSolarTimeInfo } from '../shared/types.js';
export type { BirthTimeInput, DiZhi, Gender, StarInfo, TrueSolarTimeInfo } from '../shared/types.js';
export { calculateTrueSolarTime, hourToTimeIndex, resolveTrueSolarDateTime } from '../shared/true-solar.js';
export declare const MUTAGEN_NAMES: readonly ["禄", "权", "科", "忌"];
export type MutagenName = typeof MUTAGEN_NAMES[number];
type Astrolabe = ReturnType<typeof astro.bySolar>;
type IztroStar = {
    name: string;
    type?: string;
    brightness?: string;
    mutagen?: string;
};
/** 天干四化表: stem → [禄星, 权星, 科星, 忌星] */
export declare const STEM_MUTAGEN_TABLE: Record<string, [string, string, string, string]>;
import { DI_ZHI } from '../../data/ganzhi.js';
export { DI_ZHI };
/** 禄存所在地支：按年干查表 */
export declare const LUCUN_TABLE: Record<string, string>;
/** 计算流年虚岁列表 */
export declare function computeLiuNianAges(palaceBranch: DiZhi, birthYearBranch: DiZhi, max?: number): number[];
/**
 * 计算子年斗君地支
 *
 * 公式来源：iztro FunctionalAstrolabe.js 流月算法
 * 「流年地支逆数到生月所在宫位，再从该宫位顺数到生时，为正月所在宫位」
 *
 * 斗君 = 子年正月宫位地支
 *   = DI_ZHI[(13 - lunarMonth + hourBranchIdx) % 12]
 *
 * 其中 hourBranchIdx 为时辰地支绝对索引（子=0, 丑=1, ..., 亥=11）
 * timeIndex 12（晚子时）与 timeIndex 0（早子时）同为子，取 % 12
 */
export declare function computeDouJun(lunarMonth: number, timeIndex: number): string;
/** 将 iztro Star 映射为 StarInfo */
export declare function mapStar(star: IztroStar): StarInfo;
/** 校验出生参数并创建星盘 */
export declare function createAstrolabe(input: BirthTimeInput & {
    gender: Gender;
}): Astrolabe;
/**
 * 创建星盘（支持真太阳时校正）
 *
 * 当提供 longitude 时，先计算真太阳时，再用归一化后的日期与时辰索引排盘。
 */
export declare function createAstrolabeWithTrueSolar(input: BirthTimeInput & {
    gender: Gender;
    longitude?: number;
}): {
    astrolabe: Astrolabe;
    trueSolarTimeInfo?: TrueSolarTimeInfo;
};
//# sourceMappingURL=shared.d.ts.map