import { calculateTarotData } from '../../../domains/tarot/calculate.js';
import { defineToolContract } from '../../contract.js';
import { renderTarotCanonicalJSON } from '../../../domains/tarot/json.js';
import { tarotOutputSchema } from './output-schema.js';
import { tarotDefinition } from './definition.js';
import { renderTarotCanonicalText } from '../../../domains/tarot/text.js';
export const tarotManifest = defineToolContract({
    definition: tarotDefinition,
    execute: calculateTarotData,
    renderText: renderTarotCanonicalText,
    renderJSON: renderTarotCanonicalJSON,
    outputSchema: tarotOutputSchema,
});
