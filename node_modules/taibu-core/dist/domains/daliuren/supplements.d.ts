/**
 * 大六壬补充计算 — 库未覆盖的部分
 * 包括：课体细分、课名、十二长生、五行旺衰、桃花、游都
 */
import { DI_ZHI, GAN_WUXING, TIAN_GAN, ZHI_WUXING } from '../../data/ganzhi.js';
/** 地支序号 */
declare function zhiIndex(zhi: string): number;
/** 天干序号 */
declare function ganIndex(gan: string): number;
/** 天干阴阳 */
declare function ganYinYang(gan: string): '阳' | '阴';
/** 月将名称 */
declare const YUE_JIANG_NAMES: Record<string, string>;
/** 天将全称 */
declare const TIAN_JIANG_SHORT: Record<string, string>;
/**
 * 计算某地支在日干五行下的十二长生状态
 */
export declare function getChangSheng(riGan: string, diZhi: string): string;
export declare function getWangShuai(yueZhi: string, wuXing: string): '旺' | '相' | '休' | '囚' | '死';
/** 桃花（咸池）：寅午戌见卯，申子辰见酉，巳酉丑见午，亥卯未见子 */
export declare function getTaoHua(riZhi: string): string;
interface SiKeData {
    ganYang: string;
    ganYing: string;
    zhiYang: string;
    zhiYing: string;
    gan: string;
    zhi: string;
}
/**
 * 判断课体细分
 * method: 库返回的取传大类
 * siKe: 四课数据
 * sanChuan: 三传数据
 * tianPan: 天盘
 */
export declare function classifyKeTi(method: string, siKe: SiKeData, sanChuan: {
    chu: string;
    zhong: string;
    mo: string;
}): {
    method: string;
    subTypes: string[];
    extraTypes: string[];
};
/**
 * 生成课名，如 "戊子日第十局 干上申"
 * 局数 = 干上神(ganYang)的地支序号 + 1（子=1, 丑=2, ..., 亥=12）
 * 但传统上局数从1开始，申=第十局（申序号8+1=9? 不对）
 * 实际上传统课名的局数是按天盘排列顺序编号的
 * 同一日干支有12种不同的干上神，按子丑寅...亥排列为第一~十二局
 * 申 = 序号8 → 但截图显示"第十局"
 * 这说明局数是从寅(1)开始计数：寅=1,卯=2,...,子=11,丑=12
 * 或者从特定起点开始。根据截图验证：申→第十局
 * 亥(11)→第十局? 不对。让我重新算：
 * 如果从亥(11)开始：亥=1,子=2,丑=3,寅=4,卯=5,辰=6,巳=7,午=8,未=9,申=10 ✅
 * 所以局数 = (zhiIndex(ganYang) - zhiIndex('亥') + 12) % 12 + 1
 * = (8 - 11 + 12) % 12 + 1 = 9 % 12 + 1 = 10 ✅
 */
export declare function generateKeName(riGanZhi: string, ganYang: string): string;
/**
 * 计算本命（出生年干支）和行年
 */
export declare function calcBenMingXingNian(birthYear: number, currentYear: number, gender: 'male' | 'female'): {
    benMing: string;
    xingNian: string;
};
export { DI_ZHI, GAN_WUXING, ganIndex, ganYinYang, TIAN_GAN, TIAN_JIANG_SHORT, YUE_JIANG_NAMES, ZHI_WUXING, zhiIndex };
//# sourceMappingURL=supplements.d.ts.map