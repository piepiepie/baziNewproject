/**
 * 大运计算核心引擎
 * 根据出生时间计算完整大运列表，包括：
 * - 大运与原局地支关系
 * - 流年干支及十神、纳音
 * - 流年与原局/大运关系
 * - 关键年份标注（太岁关系）
 * - 小运排列
 */
import type { DayunInput, DayunOutput } from './types.js';
export type { DayunInput, DayunOutput } from './types.js';
export type { LiunianInfo, XiaoyunInfo } from '../shared/types.js';
export declare function calculateDayunData(input: DayunInput): DayunOutput;
//# sourceMappingURL=calculate.d.ts.map