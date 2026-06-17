/**
 * 紫微斗数运限核心引擎
 */
import type { ZiweiHoroscopeInput, ZiweiHoroscopeOutput } from './types.js';
import { createAstrolabeWithTrueSolar } from '../ziwei/shared.js';
export type { ZiweiHoroscopeInput, ZiweiHoroscopeOutput } from './types.js';
type Astrolabe = ReturnType<typeof createAstrolabeWithTrueSolar>['astrolabe'];
export declare function calculateZiweiHoroscopeDataWithAstrolabe(astrolabe: Astrolabe, options?: {
    targetDate?: string | Date;
    targetTimeIndex?: number;
}): ZiweiHoroscopeOutput;
export declare function calculateZiweiHoroscopeData(input: ZiweiHoroscopeInput): ZiweiHoroscopeOutput;
//# sourceMappingURL=calculate.d.ts.map