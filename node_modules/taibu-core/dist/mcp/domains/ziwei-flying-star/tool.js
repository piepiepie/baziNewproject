import { calculateZiweiFlyingStar } from '../../../domains/ziwei-flying-star/calculate.js';
import { defineToolContract, mergePlaceResolutionInfo } from '../../contract.js';
import { renderZiweiFlyingStarCanonicalJSON } from '../../../domains/ziwei-flying-star/json.js';
import { ziweiFlyingStarOutputSchema } from './output-schema.js';
import { ziweiFlyingStarDefinition } from './definition.js';
import { renderZiweiFlyingStarCanonicalText } from '../../../domains/ziwei-flying-star/text.js';
export const ziweiFlyingStarManifest = defineToolContract({
    definition: ziweiFlyingStarDefinition,
    execute: calculateZiweiFlyingStar,
    renderText: renderZiweiFlyingStarCanonicalText,
    renderJSON: renderZiweiFlyingStarCanonicalJSON,
    outputSchema: ziweiFlyingStarOutputSchema,
    mergeRuntimeExtras: mergePlaceResolutionInfo,
});
