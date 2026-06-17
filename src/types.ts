export type SkillStatus = "draft" | "active" | "disabled";

export type Profile = {
  id: string;
  nickname: string;
  gender: string;
  birthplace: string;
  birthAt: string;
  longitude?: number;
  lunarBirth: string;
  trueSolarTime: string;
  pillars: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  tenGods: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  fortune: string;
  focus: string[];
};

export type Skill = {
  id: string;
  name: string;
  version: string;
  status: SkillStatus;
  description: string;
  inputSchema: string[];
  outputSchema: string[];
  prompt: string;
};

export type Agent = {
  id: string;
  name: string;
  avatar: string;
  description: string;
  greeting: string;
  skillIds: string[];
  modelProvider: "mock" | "dify" | "fastgpt" | "langgraph";
  endpoint?: string;
  runtimeConfig?: {
    endpoint?: string;
    apiKeyEnv?: string;
    workflowId?: string;
    assistantId?: string;
  };
};

export type ProviderStatus = {
  agentId: string;
  provider: Agent["modelProvider"];
  ready: boolean;
  endpointConfigured: boolean;
  apiKeyEnv: string;
  apiKeyConfigured: boolean;
  adapterImplemented: boolean;
};

export type ChartRecord = {
  profileId: string;
  calculatedAt: string;
  source: string;
  bazi?: {
    dayMaster?: string;
    fourPillars?: Record<string, {
      stem: string;
      branch: string;
      tenGod?: string;
      hiddenStems?: Array<{ stem: string; tenGod: string; qiType: string }>;
      naYin?: string;
      diShi?: string;
      shenSha?: string[];
    }>;
    relations?: Array<{ description: string }>;
    taiYuan?: string;
    mingGong?: string;
  };
  dayun?: {
    startAge?: number;
    startAgeDetail?: string;
    list?: Array<{
      startYear: number;
      startAge: number;
      ganZhi: string;
      tenGod: string;
      branchTenGod: string;
      naYin: string;
      diShi: string;
      shenSha?: string[];
      liunianList?: Array<{ year: number; age: number; ganZhi: string; tenGod: string; taiSui?: string[] }>;
    }>;
  };
  ziwei?: {
    soul?: string;
    body?: string;
    fiveElement?: string;
    zodiac?: string;
    sign?: string;
    palaces?: Array<{
      name: string;
      heavenlyStem: string;
      earthlyBranch: string;
      isBodyPalace: boolean;
      decadalRange?: [number, number];
      majorStars?: Array<{ name: string; brightness?: string; mutagen?: string }>;
      minorStars?: Array<{ name: string; brightness?: string; mutagen?: string }>;
      sanFangSiZheng?: string[];
    }>;
  };
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: string[];
};

// ─── report_blocks 类型 ───

export type ReportBlockType =
  | "pattern"
  | "elements"
  | "ten_gods"
  | "shen_sha"
  | "strength"
  | "useful_gods"
  | "yin_yang"
  | "zodiac"
  | "day_pillar"
  | "adjustment"
  | "flow";

export type ElementStat = { key: string; label: string; percent: number; element: string };
export type ShenShaGroup = { title: string; items: string[] };

export type ReportBlock = {
  id: string;
  type: ReportBlockType;
  title: string;
  summary: string;
  data: Record<string, unknown>;
};

export type PersonalityReport = {
  summary: string;
  strengths: Array<{ title: string; text: string }>;
  weaknesses: Array<{ title: string; text: string }>;
  talent: {
    talent: string;
    positioning: string;
    workStyle: string;
    currentPhase: string;
  };
  ziwei: {
    excerpt: string;
    soul: string;
    body: string;
    fiveElement: string;
    bodyPalace: null | {
      name: string;
      decadalRange?: [number, number];
      sanFangSiZheng?: string[];
    };
    topPalaces: Array<{
      name: string;
      stemBranch: string;
      stars: string;
    }>;
  };
};

export type ReportBlocksPayload = {
  profileId: string;
  generatedAt: string;
  dayMaster: string;
  blocks: ReportBlock[];
  personality: PersonalityReport;
};
