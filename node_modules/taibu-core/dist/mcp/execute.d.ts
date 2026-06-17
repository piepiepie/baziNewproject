import type { ListedToolDefinition } from './contract.js';
export declare function listToolDefinitions(): ListedToolDefinition[];
export declare function getToolContract(name: string): import("./contract.js").ToolContract<any, any, import("./contract.js").RenderOptions> | undefined;
export declare function executeTool(name: string, args: unknown): Promise<unknown>;
//# sourceMappingURL=execute.d.ts.map