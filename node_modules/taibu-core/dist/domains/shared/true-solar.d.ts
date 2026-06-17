import type { TrueSolarTimeInfo } from './types.js';
export type SolarDateTimeInput = {
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    birthHour: number;
    birthMinute?: number;
};
export type SolarDateTimeParts = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    dayOffset: number;
};
/** 将小时转换为时辰索引（早子时=0, 丑时=1, ..., 晚子时=12） */
export declare function hourToTimeIndex(hour: number): number;
export declare function resolveTrueSolarDateTime(input: SolarDateTimeInput, longitude: number): SolarDateTimeParts & {
    trueSolarTimeInfo: TrueSolarTimeInfo;
};
export declare function calculateTrueSolarTime(input: SolarDateTimeInput, longitude: number): TrueSolarTimeInfo;
//# sourceMappingURL=true-solar.d.ts.map