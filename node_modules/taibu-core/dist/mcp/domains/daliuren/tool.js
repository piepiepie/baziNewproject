import { calculateDaliurenData } from '../../../domains/daliuren/calculate.js';
import { defineToolContract } from '../../contract.js';
import { renderDaliurenCanonicalJSON } from '../../../domains/daliuren/json.js';
import { daliurenOutputSchema } from './output-schema.js';
import { daliurenDefinition } from './definition.js';
import { renderDaliurenCanonicalText } from '../../../domains/daliuren/text.js';
export const daliurenManifest = defineToolContract({
    definition: daliurenDefinition,
    execute: calculateDaliurenData,
    renderText: renderDaliurenCanonicalText,
    renderJSON: renderDaliurenCanonicalJSON,
    outputSchema: daliurenOutputSchema,
});
