import type { BirthTimeInput, BranchRelation, Gender, HiddenStemInfo, LiunianInfo, XiaoyunInfo } from '../shared/types.js';
export interface DayunInput extends BirthTimeInput {
    gender: Gender;
}
export interface DayunOutput {
    startAge: number;
    startAgeDetail: string;
    xiaoYun: XiaoyunInfo[];
    list: Array<{
        startYear: number;
        startAge: number;
        ganZhi: string;
        stem: string;
        branch: string;
        tenGod: string;
        branchTenGod: string;
        hiddenStems: HiddenStemInfo[];
        naYin: string;
        diShi: string;
        shenSha: string[];
        branchRelations: BranchRelation[];
        liunianList: LiunianInfo[];
    }>;
}
//# sourceMappingURL=types.d.ts.map