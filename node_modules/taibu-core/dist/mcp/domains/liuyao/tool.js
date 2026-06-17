import { calculateLiuyaoData } from '../../../domains/liuyao/calculate.js';
import { defineToolContract } from '../../contract.js';
import { renderLiuyaoJSON } from '../../../domains/liuyao/json.js';
import { liuyaoOutputSchema } from './output-schema.js';
import { liuyaoDefinition } from './definition.js';
import { renderLiuyaoText } from '../../../domains/liuyao/text.js';
export const liuyaoManifest = defineToolContract({
    definition: liuyaoDefinition,
    execute: calculateLiuyaoData,
    renderText: renderLiuyaoText,
    renderJSON: renderLiuyaoJSON,
    outputSchema: liuyaoOutputSchema,
});
