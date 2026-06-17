import { type Hexagram } from '../../data/hexagrams.js';
import type { LiuyaoInput, LiuyaoOutput } from './types.js';
import type { DerivedHexagramInfo, DiZhi, GuaShenInfo, KongWangState, LiuQinType, TianGan, WangShuai, WuXing, YaoMovementState, YaoSpecialStatus, YongShenSelectionStatus } from '../shared/types.js';
export type { Hexagram } from '../../data/hexagrams.js';
export type { LiuyaoInput, LiuyaoOutput } from './types.js';
export type { DerivedHexagramInfo, DiZhi, GuaShenInfo, KongWangState, LiuQinType, TianGan, WangShuai, WuXing, YaoMovementState, YaoSpecialStatus, YongShenSelectionStatus } from '../shared/types.js';
export type LiuShen = '青龙' | '朱雀' | '勾陈' | '螣蛇' | '白虎' | '玄武';
export type YaoType = 0 | 1;
export type YaoChange = 'stable' | 'changing';
export type HuaType = 'huaJin' | 'huaTui' | 'huiTouSheng' | 'huiTouKe' | 'huaKong' | 'huaMu' | 'huaJue' | 'fuYin' | 'fanYin' | 'none';
export type YaoAction = 'sheng' | 'ke' | 'fu' | 'chong' | 'he' | 'po' | 'none';
export type YongShenCandidateSource = 'visible' | 'changed' | 'temporal' | 'fushen';
export type ShiErChangSheng = '长生' | '沐浴' | '冠带' | '临官' | '帝旺' | '衰' | '病' | '死' | '墓' | '绝' | '胎' | '养';
export interface YaoInput {
    type: YaoType;
    change: YaoChange;
    position: number;
}
export interface GanZhiPillar {
    gan: TianGan;
    zhi: DiZhi;
}
export interface GanZhiTime {
    year: GanZhiPillar;
    month: GanZhiPillar;
    day: GanZhiPillar;
    hour: GanZhiPillar;
    xun: string;
}
export interface KongWang {
    xun: string;
    kongDizhi: [DiZhi, DiZhi];
}
export interface KongWangByPillar {
    year: KongWang;
    month: KongWang;
    day: KongWang;
    hour: KongWang;
}
export interface YaoInfluence {
    monthAction: YaoAction;
    dayAction: YaoAction;
    description: string;
}
export interface YaoStrength {
    wangShuai: WangShuai;
    isStrong: boolean;
    specialStatus: YaoSpecialStatus;
    evidence: string[];
}
export interface ChangedYaoDetail {
    position?: number;
    type: YaoType;
    liuQin: LiuQinType;
    naJia: DiZhi;
    wuXing: WuXing;
    liuShen: LiuShen;
    yaoCi?: string;
    relation: string;
}
export interface YaoChangeAnalysis {
    huaType: HuaType;
    originalZhi: DiZhi;
    changedZhi: DiZhi;
    description: string;
}
export interface FullYaoInfo {
    type: YaoType;
    change: YaoChange;
    position: number;
    liuQin: LiuQinType;
    liuShen: LiuShen;
    naJia: DiZhi;
    wuXing: WuXing;
    isShiYao: boolean;
    isYingYao: boolean;
}
export interface YaoFuShenDetail {
    liuQin: LiuQinType;
    naJia: DiZhi;
    wuXing: WuXing;
    relation: string;
}
export interface FullYaoInfoExtended extends FullYaoInfo {
    isChanging: boolean;
    movementState: YaoMovementState;
    movementLabel: string;
    kongWangState: KongWangState;
    influence: YaoInfluence;
    strength: YaoStrength;
    changeAnalysis?: YaoChangeAnalysis;
    changedYao: ChangedYaoDetail | null;
    shenSha: string[];
    changSheng?: {
        stage: ShiErChangSheng;
        strength: 'strong' | 'medium' | 'weak';
    };
    fuShen?: YaoFuShenDetail;
}
export interface FuShen {
    liuQin: LiuQinType;
    wuXing: WuXing;
    naJia: DiZhi;
    feiShenPosition: number;
    feiShenLiuQin: LiuQinType;
    availabilityStatus: 'available' | 'conditional' | 'blocked';
    availabilityReason: string;
}
export interface ShenMember {
    liuQin: LiuQinType;
    wuXing: WuXing;
    positions: number[];
}
export interface ShenSystem {
    yuanShen?: ShenMember;
    jiShen?: ShenMember;
    chouShen?: ShenMember;
}
export interface ShenSystemByYongShen extends ShenSystem {
    targetLiuQin: LiuQinType;
}
export interface YongShenCandidate {
    liuQin: LiuQinType;
    naJia?: DiZhi;
    changedNaJia?: DiZhi;
    huaType?: HuaType;
    element: WuXing;
    position?: number;
    source: YongShenCandidateSource;
    strength: 'strong' | 'moderate' | 'weak' | 'unknown';
    strengthLabel: string;
    movementState: YaoMovementState;
    movementLabel: string;
    isShiYao: boolean;
    isYingYao: boolean;
    kongWangState?: KongWangState;
    evidence: string[];
}
export interface YongShenGroup {
    targetLiuQin: LiuQinType;
    selectionStatus: YongShenSelectionStatus;
    selectionNote: string;
    selected: YongShenCandidate;
    candidates: YongShenCandidate[];
}
export interface TimeRecommendation {
    targetLiuQin: LiuQinType;
    type: 'favorable' | 'unfavorable' | 'critical';
    earthlyBranch?: DiZhi;
    trigger: string;
    basis: string[];
    description: string;
}
export interface LiuChongGuaInfo {
    isLiuChongGua: boolean;
    description?: string;
}
export interface LiuHeGuaInfo {
    isLiuHeGua: boolean;
    description?: string;
}
export interface ChongHeTransition {
    type: 'chong_to_he' | 'he_to_chong' | 'none';
    description?: string;
}
export interface GuaFanFuYinInfo {
    isFanYin: boolean;
    isFuYin: boolean;
    description?: string;
}
export interface SanHeAnalysis {
    hasFullSanHe: boolean;
    fullSanHe?: {
        name: string;
        result: WuXing;
        positions: number[];
        description: string;
    };
    fullSanHeList?: Array<{
        name: string;
        result: WuXing;
        positions: number[];
        description: string;
    }>;
    hasBanHe: boolean;
    banHe?: Array<{
        branches: [DiZhi, DiZhi];
        result: WuXing;
        type: 'sheng' | 'mu';
        positions: number[];
    }>;
}
export interface LiuYaoFullAnalysis {
    ganZhiTime: GanZhiTime;
    kongWang: KongWang;
    kongWangByPillar: KongWangByPillar;
    fullYaos: FullYaoInfoExtended[];
    yongShen: YongShenGroup[];
    fuShen?: FuShen[];
    shenSystemByYongShen: ShenSystemByYongShen[];
    globalShenSha: string[];
    timeRecommendations: TimeRecommendation[];
    liuChongGuaInfo: LiuChongGuaInfo;
    liuHeGuaInfo: LiuHeGuaInfo;
    chongHeTransition: ChongHeTransition;
    guaFanFuYin: GuaFanFuYinInfo;
    sanHeAnalysis: SanHeAnalysis;
    warnings?: string[];
}
export interface FullAnalysisOptions {
    yongShenTargets?: readonly unknown[];
}
export type TrigramNaJia = {
    element: WuXing;
    lower: [DiZhi, DiZhi, DiZhi];
    upper: [DiZhi, DiZhi, DiZhi];
};
export declare const XUN_KONG_TABLE: Record<string, [DiZhi, DiZhi]>;
export declare const WANG_SHUAI_LABELS: Record<WangShuai, string>;
export declare const KONG_WANG_LABELS: Record<KongWangState, string>;
export declare const SPECIAL_STATUS_LABELS: Record<YaoSpecialStatus, string>;
export declare const MOVEMENT_LABELS: Record<YaoMovementState, string>;
export declare const HUA_TYPE_LABELS: Record<HuaType, string>;
export declare const YONG_SHEN_STATUS_LABELS: Record<YongShenSelectionStatus, string>;
export declare const YAO_POSITION_NAMES: string[];
/**
 * 传统爻位名：阳爻用九、阴爻用六，初/二/三/四/五/上
 */
export declare function traditionalYaoName(pos: number, type: number): string;
/** 格式化干支时间为标准文本 */
export declare function formatGanZhiTime(gz: {
    year: {
        gan: string;
        zhi: string;
    };
    month: {
        gan: string;
        zhi: string;
    };
    day: {
        gan: string;
        zhi: string;
    };
    hour: {
        gan: string;
        zhi: string;
    };
}): string;
/**
 * 卦级分析行（六冲/六合/冲合转换/反吟伏吟/三合/半合/全局神煞）
 * 返回纯文本行数组，调用方自行决定前缀
 */
export declare function formatGuaLevelLines(analysis: {
    liuChongGuaInfo?: {
        isLiuChongGua: boolean;
        description?: string;
    };
    liuHeGuaInfo?: {
        isLiuHeGua: boolean;
        description?: string;
    };
    chongHeTransition?: {
        type: string;
        description?: string;
    };
    guaFanFuYin?: {
        isFanYin: boolean;
        isFuYin: boolean;
        description?: string;
    };
    sanHeAnalysis?: {
        hasFullSanHe: boolean;
        fullSanHe?: {
            name: string;
            result: string;
            description?: string;
        };
        fullSanHeList?: Array<{
            name: string;
            result: string;
            description?: string;
        }>;
        hasBanHe: boolean;
        banHe?: Array<{
            branches: string[];
            result: string;
            type: string;
        }>;
    };
    globalShenSha?: string[];
}): string[];
/** 按位置降序排列爻（上爻→初爻） */
export declare function sortYaosDescending<T extends {
    position: number;
}>(yaos: readonly T[]): T[];
export declare const TRIGRAM_NA_JIA: Record<string, TrigramNaJia>;
export declare function findHexagram(input: string): Hexagram | undefined;
export declare function normalizeYongShenTargets(targets?: readonly unknown[]): LiuQinType[];
export declare function hasInvalidYongShenTargets(targets?: readonly unknown[]): boolean;
export declare function getPalaceInfo(code: string): {
    name: string;
    element: WuXing;
    order: number;
} | undefined;
export declare function getShiYingPosition(code: string): {
    shi: number;
    ying: number;
};
export declare function getNaJiaByHexagram(hexagramCode: string, position: number): DiZhi;
export declare function calculateDerivedHexagrams(hexagramCode: string): {
    nuclearHexagram?: DerivedHexagramInfo;
    oppositeHexagram?: DerivedHexagramInfo;
    reversedHexagram?: DerivedHexagramInfo;
};
export declare function calculateGuaShen(hexagramCode: string): GuaShenInfo;
export declare function calculateGanZhiTime(date: Date): GanZhiTime;
export declare function getKongWang(dayGan: TianGan, dayZhi: DiZhi): KongWang;
export declare function calculateKongWangByPillar(ganZhiTime: GanZhiTime): KongWangByPillar;
export declare function checkYaoKongWang(yaoZhi: DiZhi, kongWang: KongWang, monthZhi: DiZhi, dayZhi: DiZhi, isChanging: boolean): KongWangState;
export declare function getZhiAction(sourceZhi: DiZhi, targetZhi: DiZhi): YaoAction;
export declare function getYaoInfluence(yaoZhi: DiZhi, monthZhi: DiZhi, dayZhi: DiZhi): YaoInfluence;
export declare function calculateYaoStrength(yaoWuXing: WuXing, monthZhi: DiZhi, isChanging: boolean, kongWangState: KongWangState, influence: YaoInfluence, yaoZhi: DiZhi): YaoStrength;
export declare function calculateFullYaoInfo(yaos: YaoInput[], hexagramCode: string, dayStem: TianGan): FullYaoInfo[];
export declare function performFullAnalysis(yaos: YaoInput[], hexagramCode: string, changedCode: string | undefined, question: string, date: Date, options?: FullAnalysisOptions): LiuYaoFullAnalysis;
export declare function getHexagramContext(code: string): {
    hexagram?: Hexagram;
    palace?: {
        name: string;
        element: WuXing;
        order: number;
    };
    guaCi?: string;
    xiangCi?: string;
};
export declare function calculateLiuyaoData(input: LiuyaoInput): Promise<LiuyaoOutput>;
//# sourceMappingURL=calculate.d.ts.map