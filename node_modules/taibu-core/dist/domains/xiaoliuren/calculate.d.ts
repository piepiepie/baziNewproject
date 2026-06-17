/**
 * 小六壬排盘核心引擎
 *
 * 六种状态按固定顺序循环：大安→留连→速喜→赤口→小吉→空亡
 * 1. 月上起大安，顺数到所占农历月
 * 2. 从月上落位起，顺数到所占农历日
 * 3. 从日上落位起，顺数到所占时辰
 */
import type { XiaoliurenInput, XiaoliurenOutput } from './types.js';
export type { XiaoliurenInput, XiaoliurenOutput, XiaoliurenStatus, XiaoliurenStatusInfo } from './types.js';
/**
 * 小六壬排盘主函数
 */
export declare function calculateXiaoliurenData(input: XiaoliurenInput): XiaoliurenOutput;
//# sourceMappingURL=calculate.d.ts.map