/**
 * 共享工具函数和常量
 *
 * 干支基础常量统一从 ../data/ganzhi.ts 汇总导出。
 */
export { DI_ZHI, GAN_WUXING, getStemYinYang, STEM_ELEMENTS, TIAN_GAN, YI_MA_MAP, ZHI_WUXING } from '../data/ganzhi.js';
export type { DiZhi, TianGan } from '../data/ganzhi.js';
export declare const WU_XING_ORDER: string[];
export declare function getElementRelation(from: string, to: string): string;
export declare function calculateTenGod(dayStem: string, targetStem: string): string;
export declare function getKongWang(dayGan: string, dayZhi: string): {
    xun: string;
    kongZhi: [string, string];
};
export declare function getDiShi(dayStem: string, branch: string): string;
//# sourceMappingURL=utils.d.ts.map