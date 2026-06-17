import { calculateTaiyi } from '../../../domains/taiyi/calculate.js';
import { renderTaiyiCanonicalJSON } from '../../../domains/taiyi/json.js';
import { renderTaiyiCanonicalText } from '../../../domains/taiyi/text.js';
import { defineToolContract } from '../../contract.js';
import { taiyiDefinition } from './definition.js';
import { taiyiOutputSchema } from './output-schema.js';
export const taiyiManifest = defineToolContract({
    definition: taiyiDefinition,
    execute: calculateTaiyi,
    renderText: renderTaiyiCanonicalText,
    renderJSON: renderTaiyiCanonicalJSON,
    outputSchema: taiyiOutputSchema,
});
