import { calculateBaziPillarsResolve } from '../../../domains/bazi-pillars-resolve/calculate.js';
import { defineToolContract } from '../../contract.js';
import { renderBaziPillarsResolveCanonicalJSON } from '../../../domains/bazi-pillars-resolve/json.js';
import { baziPillarsResolveOutputSchema } from './output-schema.js';
import { baziPillarsResolveDefinition } from './definition.js';
import { renderBaziPillarsResolveCanonicalText } from '../../../domains/bazi-pillars-resolve/text.js';
export const baziPillarsResolveManifest = defineToolContract({
    definition: baziPillarsResolveDefinition,
    execute: calculateBaziPillarsResolve,
    renderText: renderBaziPillarsResolveCanonicalText,
    renderJSON: renderBaziPillarsResolveCanonicalJSON,
    outputSchema: baziPillarsResolveOutputSchema,
});
