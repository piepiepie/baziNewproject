const { randomUUID } = require("node:crypto");

async function runLangGraphProvider({ agent }) {
  const config = agent.runtimeConfig || {};

  if (!config.endpoint || !config.apiKeyEnv) {
    return providerNotConfigured(agent, "LangGraph", "需要配置 endpoint、apiKeyEnv 和 assistantId。");
  }

  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    return providerNotConfigured(agent, "LangGraph", `缺少环境变量 ${config.apiKeyEnv}。`);
  }

  return providerNotConfigured(agent, "LangGraph", "Provider 外壳已就绪，下一步接 LangGraph runs API。");
}

function providerNotConfigured(agent, providerName, reason) {
  return {
    id: randomUUID(),
    role: "assistant",
    content: `## ${agent.name} · ${providerName} Provider

${providerName} provider 已接入 runtime 路由，适合后续承载多智能体、长状态线程和人工审核。

| 项目 | 状态 |
| --- | --- |
| provider | ${providerName} |
| 智能体 | ${agent.name} |
| 配置状态 | ${reason} |

### 下一步

1. 配置 \`assistantId\` 和部署 endpoint。
2. 设置 \`LANGGRAPH_API_KEY\`。
3. 将当前 threadId 映射到 LangGraph thread。`,
    actions: ["填写 LangGraph endpoint", "设置 LANGGRAPH_API_KEY", "设计线程映射"]
  };
}

module.exports = {
  runLangGraphProvider
};
