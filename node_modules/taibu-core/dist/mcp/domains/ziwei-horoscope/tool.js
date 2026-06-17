import { calculateZiweiHoroscopeData } from '../../../domains/ziwei-horoscope/calculate.js';
import { defineToolContract, mergePlaceResolutionInfo } from '../../contract.js';
import { renderZiweiHoroscopeCanonicalJSON } from '../../../domains/ziwei-horoscope/json.js';
import { ziweiHoroscopeOutputSchema } from './output-schema.js';
import { ziweiHoroscopeDefinition } from './definition.js';
import { renderZiweiHoroscopeCanonicalText } from '../../../domains/ziwei-horoscope/text.js';
export const ziweiHoroscopeManifest = defineToolContract({
    definition: ziweiHoroscopeDefinition,
    execute: calculateZiweiHoroscopeData,
    renderText: renderZiweiHoroscopeCanonicalText,
    renderJSON: renderZiweiHoroscopeCanonicalJSON,
    outputSchema: ziweiHoroscopeOutputSchema,
    mergeRuntimeExtras: mergePlaceResolutionInfo,
});
