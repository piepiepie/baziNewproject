import { calculateAstrology } from '../../../domains/astrology/calculate.js';
import { renderAstrologyCanonicalJSON } from '../../../domains/astrology/json.js';
import { renderAstrologyCanonicalText } from '../../../domains/astrology/text.js';
import { defineToolContract, mergePlaceResolutionInfo } from '../../contract.js';
import { astrologyDefinition } from './definition.js';
import { astrologyOutputSchema } from './output-schema.js';
export const astrologyManifest = defineToolContract({
    definition: astrologyDefinition,
    execute: calculateAstrology,
    renderText: renderAstrologyCanonicalText,
    renderJSON: renderAstrologyCanonicalJSON,
    outputSchema: astrologyOutputSchema,
    mergeRuntimeExtras: mergePlaceResolutionInfo,
});
