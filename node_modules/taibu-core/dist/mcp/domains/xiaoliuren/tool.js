import { defineToolContract } from '../../contract.js';
import { xiaoliurenDefinition } from './definition.js';
import { xiaoliurenOutputSchema } from './output-schema.js';
import { calculateXiaoliurenData } from '../../../domains/xiaoliuren/calculate.js';
import { toXiaoliurenJson } from '../../../domains/xiaoliuren/json.js';
import { toXiaoliurenText } from '../../../domains/xiaoliuren/text.js';
export const xiaoliurenManifest = defineToolContract({
    definition: xiaoliurenDefinition,
    execute: calculateXiaoliurenData,
    renderText: (output, options) => toXiaoliurenText(output, options),
    renderJSON: (output, options) => toXiaoliurenJson(output, options),
    outputSchema: xiaoliurenOutputSchema,
});
