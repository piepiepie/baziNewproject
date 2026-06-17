/**
 * 每日黄历核心引擎
 */
import type { AlmanacInput, AlmanacOutput } from './types.js';
export type { AlmanacInput, AlmanacOutput, } from './types.js';
export type { HourlyFortuneInfo, NineStarInfo, } from '../shared/types.js';
export declare function calculateDailyAlmanac(input: AlmanacInput): Promise<AlmanacOutput>;
//# sourceMappingURL=calculate.d.ts.map