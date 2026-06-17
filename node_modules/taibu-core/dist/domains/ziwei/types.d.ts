import type { BirthTimeInput, DecadalInfo, GanZhiPair, Gender, PalaceInfo, ScholarStarEntry, SmallLimitEntry, TrueSolarTimeInfo } from '../shared/types.js';
export interface ZiweiInput extends BirthTimeInput {
    gender: Gender;
    longitude?: number;
}
export interface ZiweiOutput {
    solarDate: string;
    lunarDate: string;
    fourPillars: {
        year: GanZhiPair;
        month: GanZhiPair;
        day: GanZhiPair;
        hour: GanZhiPair;
    };
    soul: string;
    body: string;
    fiveElement: string;
    zodiac: string;
    sign: string;
    palaces: PalaceInfo[];
    decadalList: DecadalInfo[];
    earthlyBranchOfSoulPalace?: string;
    earthlyBranchOfBodyPalace?: string;
    time?: string;
    timeRange?: string;
    mutagenSummary?: MutagenSummaryItem[];
    gender?: string;
    douJun?: string;
    trueSolarTimeInfo?: TrueSolarTimeInfo;
    lifeMasterStar?: string;
    bodyMasterStar?: string;
    smallLimit?: SmallLimitEntry[];
    scholarStars?: ScholarStarEntry[];
}
export interface MutagenSummaryItem {
    mutagen: '禄' | '权' | '科' | '忌';
    starName: string;
    palaceName: string;
}
//# sourceMappingURL=types.d.ts.map