import { calculateZiweiData } from '../../../domains/ziwei/calculate.js';
import { defineToolContract, mergePlaceResolutionInfo, } from '../../contract.js';
import { renderZiweiCanonicalJSON } from '../../../domains/ziwei/json.js';
import { ziweiCalculateOutputSchema } from './output-schema.js';
import { ziweiCalculateDefinition } from './definition.js';
import { renderZiweiCanonicalText } from '../../../domains/ziwei/text.js';
export const ziweiManifest = defineToolContract({
    definition: ziweiCalculateDefinition,
    execute: calculateZiweiData,
    renderText: renderZiweiCanonicalText,
    renderJSON: renderZiweiCanonicalJSON,
    outputSchema: ziweiCalculateOutputSchema,
    mergeRuntimeExtras: mergePlaceResolutionInfo,
});
