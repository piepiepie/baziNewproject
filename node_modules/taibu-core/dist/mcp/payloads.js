import { getToolContract, listToolDefinitions } from './execute.js';
function stringifyResult(result) {
    return typeof result === 'object' && result !== null
        ? JSON.stringify(result, null, 2)
        : String(result);
}
export function renderToolResult(toolName, result, options) {
    const tool = getToolContract(toolName);
    if (!tool) {
        return {
            content: [{ type: 'text', text: stringifyResult(result) }],
        };
    }
    const canonicalJSON = tool.renderJSON(result, options);
    const textContent = tool.renderText(result, options);
    const structuredContent = canonicalJSON !== undefined
        ? (tool.mergeRuntimeExtras
            ? tool.mergeRuntimeExtras(canonicalJSON, result)
            : canonicalJSON)
        : undefined;
    return {
        content: [{ type: 'text', text: textContent || stringifyResult(result) }],
        ...(structuredContent !== undefined ? { structuredContent } : {}),
    };
}
export function buildListToolsPayload() {
    return {
        tools: listToolDefinitions(),
    };
}
export function buildToolSuccessPayload(toolName, result, options) {
    const rendered = renderToolResult(toolName, result, options);
    if (rendered.structuredContent !== undefined) {
        return {
            structuredContent: rendered.structuredContent,
            content: rendered.content,
        };
    }
    return rendered;
}
