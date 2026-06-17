export type ShenShaPillarPosition = 'year' | 'month' | 'day' | 'hour';
export interface ShenShaContext {
    yearStem: string;
    yearBranch: string;
    monthStem: string;
    monthBranch: string;
    dayStem: string;
    dayBranch: string;
    hourStem: string;
    hourBranch: string;
    kongWang?: {
        xun: string;
        kongZhi: [string, string];
    };
    yearNaYinElement?: string;
}
export interface PillarShenShaByPosition {
    year: string[];
    month: string[];
    day: string[];
    hour: string[];
}
export declare function calculateBranchShenSha(context: ShenShaContext, targetBranch: string, options?: {
    positionHint?: ShenShaPillarPosition;
}): string[];
export declare function calculateGlobalShenSha(context: ShenShaContext): string[];
export declare function calculatePillarShenSha(context: ShenShaContext): PillarShenShaByPosition;
//# sourceMappingURL=shensha.d.ts.map