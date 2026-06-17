import type { ChongHeTransition, DerivedHexagramInfo, DetailLevel, FullYaoInfo, FuShenInfo, GanZhiTime, GuaFanFuYinInfo, GuaShenInfo, KongWangByPillarInfo, KongWangInfo, LiuChongGuaInfo, LiuHeGuaInfo, LiuQinType, SanHeAnalysisInfo, ShenSystemByYongShenInfo, TimeRecommendation, YongShenGroupInfo } from '../shared/types.js';
export interface LiuyaoInput {
    question: string;
    yongShenTargets: LiuQinType[];
    method?: 'auto' | 'select' | 'time' | 'number';
    hexagramName?: string;
    changedHexagramName?: string;
    numbers?: number[];
    date: string;
    seed?: string;
    seedScope?: string;
    detailLevel?: DetailLevel;
}
export interface LiuyaoOutput {
    question: string;
    seed?: string;
    hexagramName: string;
    hexagramGong: string;
    hexagramElement: string;
    hexagramBrief?: string;
    guaCi?: string;
    xiangCi?: string;
    changedHexagramName?: string;
    changedHexagramGong?: string;
    changedHexagramElement?: string;
    changedGuaCi?: string;
    changedXiangCi?: string;
    ganZhiTime: GanZhiTime;
    kongWang: KongWangInfo;
    kongWangByPillar: KongWangByPillarInfo;
    fullYaos: FullYaoInfo[];
    yongShen: YongShenGroupInfo[];
    fuShen?: FuShenInfo[];
    shenSystemByYongShen: ShenSystemByYongShenInfo[];
    globalShenSha: string[];
    liuChongGuaInfo?: LiuChongGuaInfo;
    liuHeGuaInfo?: LiuHeGuaInfo;
    chongHeTransition?: ChongHeTransition;
    guaFanFuYin?: GuaFanFuYinInfo;
    sanHeAnalysis?: SanHeAnalysisInfo;
    warnings?: string[];
    timeRecommendations?: TimeRecommendation[];
    nuclearHexagram?: DerivedHexagramInfo;
    oppositeHexagram?: DerivedHexagramInfo;
    reversedHexagram?: DerivedHexagramInfo;
    guaShen?: GuaShenInfo;
}
//# sourceMappingURL=types.d.ts.map