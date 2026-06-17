/**
 * 渲染层共享工具函数
 * 消除 text.ts / json.ts 之间的重复实现
 */
import type { DetailLevel } from '../domains/shared/types.js';
import type { ZiweiOutput } from '../domains/ziwei/types.js';
/**
 * 2 级归一化：将 detailLevel 映射到 'default' | 'full'
 * 适用于大多数术数的 text / json 渲染。
 */
export declare function normalizeDetailLevelBinary(detailLevel?: DetailLevel): 'default' | 'full';
/**
 * 3 级归一化：将 detailLevel 映射到 'default' | 'more' | 'full'
 * 仅用于六爻这类确实存在中间层级输出的场景。
 */
export declare function normalizeDetailLevel3Way(detailLevel?: DetailLevel): DetailLevel;
/**
 * 构建神系 Map：以 targetLiuQin 为 key
 * 用于六爻渲染中快速查找用神/原神/忌神/仇神的归属
 */
export declare function buildShenSystemMap<T extends {
    targetLiuQin: string;
}>(systems: T[]): Map<string, T>;
/**
 * 六爻关系标签映射：过滤掉"平"标签
 */
export declare function mapLiuyaoRelationLabel(label: string | undefined): string | undefined;
/**
 * 格式化紫微规范农历日期：用干支年替换原始文本中的年份部分
 */
export declare function formatZiweiCanonicalLunarDate(result: ZiweiOutput): string;
/**
 * 紫微飞星查询类型映射：英文 key → 中文标签
 */
export declare function mapZiweiFlyingStarQueryType(type: string): string;
//# sourceMappingURL=render-utils.d.ts.map