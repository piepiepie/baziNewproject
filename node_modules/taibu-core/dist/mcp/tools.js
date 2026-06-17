import { almanacManifest } from './domains/almanac/tool.js';
import { astrologyManifest } from './domains/astrology/tool.js';
import { baziDayunManifest } from './domains/bazi-dayun/tool.js';
import { baziPillarsResolveManifest } from './domains/bazi-pillars-resolve/tool.js';
import { baziManifest } from './domains/bazi/tool.js';
import { daliurenManifest } from './domains/daliuren/tool.js';
import { liuyaoManifest } from './domains/liuyao/tool.js';
import { meihuaManifest } from './domains/meihua/tool.js';
import { qimenManifest } from './domains/qimen/tool.js';
import { tarotManifest } from './domains/tarot/tool.js';
import { taiyiManifest } from './domains/taiyi/tool.js';
import { xiaoliurenManifest } from './domains/xiaoliuren/tool.js';
import { ziweiFlyingStarManifest } from './domains/ziwei-flying-star/tool.js';
import { ziweiHoroscopeManifest } from './domains/ziwei-horoscope/tool.js';
import { ziweiManifest } from './domains/ziwei/tool.js';
export const tools = [
    astrologyManifest,
    baziManifest,
    baziPillarsResolveManifest,
    ziweiManifest,
    ziweiHoroscopeManifest,
    ziweiFlyingStarManifest,
    liuyaoManifest,
    meihuaManifest,
    tarotManifest,
    taiyiManifest,
    almanacManifest,
    baziDayunManifest,
    qimenManifest,
    daliurenManifest,
    xiaoliurenManifest,
];
export const toolByName = new Map(tools.map((tool) => [tool.definition.name, tool]));
