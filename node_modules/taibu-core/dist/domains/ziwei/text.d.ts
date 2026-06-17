import type { ZiweiOutput } from './types.js';
import type { ZiweiCanonicalTextOptions } from '../shared/text-options.js';
export declare function sortZiweiPalaces<T extends {
    name: string;
    index?: number;
}>(palaces: T[]): T[];
export declare function renderZiweiCanonicalText(result: ZiweiOutput, options?: ZiweiCanonicalTextOptions): string;
//# sourceMappingURL=text.d.ts.map