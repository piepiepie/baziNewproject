import type { BirthTimeInput, Gender } from '../shared/types.js';
export interface ZiweiHoroscopeInput extends BirthTimeInput {
    gender: Gender;
    longitude?: number;
    targetDate?: string;
    targetTimeIndex?: number;
}
export interface HoroscopePeriodInfo {
    index: number;
    name: string;
    heavenlyStem: string;
    earthlyBranch: string;
    palaceNames: string[];
    mutagen: string[];
    startAge?: number;
    endAge?: number;
}
export interface TransitStarEntry {
    starName: string;
    palaceName: string;
}
export interface YearlyDecStarInfo {
    jiangqian12: string[];
    suiqian12: string[];
}
export interface ZiweiHoroscopeOutput {
    solarDate: string;
    lunarDate: string;
    soul: string;
    body: string;
    fiveElement: string;
    targetDate: string;
    hasExplicitTargetTime: boolean;
    decadal: HoroscopePeriodInfo;
    age: HoroscopePeriodInfo & {
        nominalAge: number;
    };
    yearly: HoroscopePeriodInfo;
    monthly: HoroscopePeriodInfo;
    daily: HoroscopePeriodInfo;
    hourly: HoroscopePeriodInfo;
    transitStars?: TransitStarEntry[];
    yearlyDecStar?: YearlyDecStarInfo;
}
//# sourceMappingURL=types.d.ts.map