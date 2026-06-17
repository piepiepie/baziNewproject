import type { ToolOutputSchema } from './contract.js';
export type OutputSchema = ToolOutputSchema;
export declare const str: (description?: string) => {
    description?: string | undefined;
    type: string;
};
export declare const num: (description?: string) => {
    description?: string | undefined;
    type: string;
};
export declare const bool: (description?: string) => {
    description?: string | undefined;
    type: string;
};
export declare const arr: (items: Record<string, unknown>, description?: string) => {
    description?: string | undefined;
    type: string;
    items: Record<string, unknown>;
};
export declare const obj: (properties: Record<string, unknown>, description?: string) => OutputSchema;
export declare const trueSolarTimeSchema: ToolOutputSchema;
export declare const hiddenStemSchema: ToolOutputSchema;
export declare const branchRelationSchema: ToolOutputSchema;
export declare const liunianItemSchema: ToolOutputSchema;
export declare const dayunItemSchema: ToolOutputSchema;
//# sourceMappingURL=schema-builders.d.ts.map