import { calculateDailyAlmanac } from '../../../domains/almanac/calculate.js';
import { defineToolContract } from '../../contract.js';
import { renderAlmanacCanonicalJSON } from '../../../domains/almanac/json.js';
import { almanacOutputSchema } from './output-schema.js';
import { almanacDefinition } from './definition.js';
import { renderAlmanacCanonicalText } from '../../../domains/almanac/text.js';
export const almanacManifest = defineToolContract({
    definition: almanacDefinition,
    execute: calculateDailyAlmanac,
    renderText: renderAlmanacCanonicalText,
    renderJSON: renderAlmanacCanonicalJSON,
    outputSchema: almanacOutputSchema,
});
