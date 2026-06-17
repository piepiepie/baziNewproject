/**
 * 塔罗牌核心引擎
 */
import type { TarotCardDefinition, TarotInput, TarotOutput, TarotSpreadDefinition } from './types.js';
export type { TarotCardDefinition, TarotCardResult, TarotInput, TarotOutput, TarotSpreadDefinition, } from './types.js';
export declare const TAROT_CARDS: TarotCardDefinition[];
export declare const TAROT_SPREADS: TarotSpreadDefinition[];
export declare function calculateTarotData(input: TarotInput): Promise<TarotOutput>;
//# sourceMappingURL=calculate.d.ts.map