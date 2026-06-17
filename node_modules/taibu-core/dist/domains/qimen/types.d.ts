export interface QimenInput {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute?: number;
    timezone?: string;
    question?: string;
    panType?: 'zhuan';
    juMethod?: 'chaibu' | 'maoshan';
    zhiFuJiGong?: 'ji_liuyi' | 'ji_wugong';
}
export interface QimenPalaceInfo {
    palaceIndex: number;
    palaceName: string;
    direction: string;
    element: string;
    earthStem: string;
    heavenStem: string;
    star: string;
    starElement: string;
    gate: string;
    gateElement: string;
    deity: string;
    formations: string[];
    stemWangShuai?: string;
    elementState?: string;
    earthStemElement?: string;
    heavenStemElement?: string;
    isKongWang?: boolean;
    isYiMa?: boolean;
    isRuMu?: boolean;
}
export interface QimenOutput {
    dateInfo: {
        solarDate: string;
        lunarDate: string;
        solarTerm: string;
        solarTermRange?: string;
    };
    siZhu: {
        year: string;
        month: string;
        day: string;
        hour: string;
    };
    dunType: 'yang' | 'yin';
    juNumber: number;
    yuan: string;
    xunShou: string;
    zhiFu: {
        star: string;
        palace: number;
    };
    zhiShi: {
        gate: string;
        palace: number;
    };
    palaces: QimenPalaceInfo[];
    kongWang: {
        dayKong: {
            branches: string[];
            palaces: number[];
        };
        hourKong: {
            branches: string[];
            palaces: number[];
        };
    };
    yiMa: {
        branch: string;
        palace: number;
    };
    globalFormations: string[];
    panType: string;
    juMethod: string;
    question?: string;
    monthPhase?: Record<string, string>;
}
//# sourceMappingURL=types.d.ts.map