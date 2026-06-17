import type { AstrologyCanonicalTextOptions } from '../shared/text-options.js';
import type { AstrologyAspect, AstrologyFactor, AstrologyHouse, AstrologyOutput, AstrologyZodiacCusp } from './types.js';
export type AstrologyDetailLevel = 'default' | 'more' | 'full';
export interface AstrologyGroupedFactor {
    factor: AstrologyFactor;
    aspects: AstrologyAspect[];
}
export interface AstrologyPointPair {
    key: string;
    label: string;
    natal: AstrologyFactor;
    transit: AstrologyFactor | null;
}
export interface AstrologyRenderModel {
    detailLevel: AstrologyDetailLevel;
    isApproximate: boolean;
    basicInfo: {
        calculationModeLabel: string;
        calculationNote?: string;
        birthPlace?: string;
        coordinatesLabel: string;
        natalTimeZoneLabel: string;
        natalDateTime: string;
        transitDateTime: string;
        zodiacLabel: string;
        houseSystemLabel: string;
    };
    anchors: {
        sun: AstrologyFactor;
        moon: AstrologyFactor;
        ascendant?: AstrologyFactor;
        midheaven?: AstrologyFactor;
    };
    natalBodies: AstrologyGroupedFactor[];
    transitTriggers: AstrologyGroupedFactor[];
    pointPairs: AstrologyPointPair[];
    houses: AstrologyHouse[];
    zodiacCusps: AstrologyZodiacCusp[];
    fullNatalAspects: AstrologyAspect[];
    fullTransitAspects: AstrologyAspect[];
}
export declare function ensureAstrologyDetailLevelSupported(result: AstrologyOutput, detailLevel: AstrologyDetailLevel): void;
export declare function buildAstrologyRenderModel(result: AstrologyOutput, options?: AstrologyCanonicalTextOptions): AstrologyRenderModel;
//# sourceMappingURL=render-model.d.ts.map