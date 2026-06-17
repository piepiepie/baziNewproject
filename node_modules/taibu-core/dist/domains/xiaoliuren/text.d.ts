import type { DetailLevel } from '../shared/types.js';
import type { XiaoliurenOutput } from './types.js';
export interface XiaoliurenCanonicalTextOptions {
    /** 输出细节级别 */
    detailLevel?: DetailLevel;
    /** 是否显示诗诀；默认跟随 detailLevel，full=true，default=false */
    showPoem?: boolean;
}
export declare function toXiaoliurenText(output: XiaoliurenOutput, options?: XiaoliurenCanonicalTextOptions): string;
//# sourceMappingURL=text.d.ts.map