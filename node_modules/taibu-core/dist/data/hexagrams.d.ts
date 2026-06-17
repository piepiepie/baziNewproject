/**
 * 六十四卦公共数据
 *
 * 统一收口卦象结构与卦辞/象辞/爻辞，避免多入口拆分。
 */
export interface Hexagram {
    name: string;
    code: string;
    upperTrigram: string;
    lowerTrigram: string;
    element: string;
    nature: string;
}
export declare const HEXAGRAMS: Hexagram[];
export declare const GUA_CI: Record<string, string>;
export declare const XIANG_CI: Record<string, string>;
export declare const YAO_CI: Record<string, string[]>;
//# sourceMappingURL=hexagrams.d.ts.map