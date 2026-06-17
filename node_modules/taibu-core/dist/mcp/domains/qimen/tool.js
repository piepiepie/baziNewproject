import { calculateQimenData } from '../../../domains/qimen/calculate.js';
import { defineToolContract } from '../../contract.js';
import { renderQimenCanonicalJSON } from '../../../domains/qimen/json.js';
import { qimenCalculateOutputSchema } from './output-schema.js';
import { qimenCalculateDefinition } from './definition.js';
import { renderQimenCanonicalText } from '../../../domains/qimen/text.js';
export const qimenManifest = defineToolContract({
    definition: qimenCalculateDefinition,
    execute: calculateQimenData,
    renderText: renderQimenCanonicalText,
    renderJSON: renderQimenCanonicalJSON,
    outputSchema: qimenCalculateOutputSchema,
});
