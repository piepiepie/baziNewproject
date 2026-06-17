export type ZonedDateTimeInput = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute?: number;
    second?: number;
};
export declare const DEFAULT_DIVINATION_TIMEZONE = "Asia/Shanghai";
export declare function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number;
export declare function zonedTimeToUtc(input: ZonedDateTimeInput, timeZone: string): Date;
/**
 * 将目标时区的壁钟时间转为一个 Date 对象，使其本地时间访问器
 * （.getHours()、.getMinutes() 等）返回目标时区的壁钟值。
 *
 * 前提：服务器时区在调用期间不发生变化（如 DST 切换）。
 * 适用于需要将时区壁钟时间传给仅接受 Date 对象的第三方库的场景。
 */
export declare function zonedWallClockToSystemDate(input: ZonedDateTimeInput, timeZone: string): Date;
//# sourceMappingURL=timezone-utils.d.ts.map