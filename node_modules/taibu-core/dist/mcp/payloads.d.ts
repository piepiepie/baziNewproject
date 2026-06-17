import type { ListedToolDefinition, RenderOptions } from './contract.js';
export type ToolContentItem = {
    type: 'text';
    text: string;
};
export type RenderedToolResult = {
    content: ToolContentItem[];
    structuredContent?: unknown;
};
export type ToolListPayload = {
    tools: ListedToolDefinition[];
};
export declare function renderToolResult(toolName: string, result: unknown, options?: RenderOptions): RenderedToolResult;
export declare function buildListToolsPayload(): ToolListPayload;
export declare function buildToolSuccessPayload(toolName: string, result: unknown, options?: RenderOptions): RenderedToolResult;
//# sourceMappingURL=payloads.d.ts.map