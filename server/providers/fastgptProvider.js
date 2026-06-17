const { randomUUID } = require("node:crypto");

async function runFastGptProvider({ agent }) {
  const config = agent.runtimeConfig || {};

  if (!config.endpoint || !config.apiKeyEnv) {
    return providerNotConfigured(agent, "FastGPT", "需要配置 endpoint 和 apiKeyEnv。");
  }

  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    return providerNotConfigured(agent, "FastGPT", `缺少环境变量 ${config.apiKeyEnv}。`);
  }

  return providerNotConfigured(agent, "FastGPT", "Provider 外壳已就绪，下一步接 FastGPT chat API。");
}

function providerNotConfigured(agent, providerName, reason) {
  return {
    id: randomUUID(),
    role: "assistant",
    content: `## ${agent.name} · ${providerName} Provider

${providerName} provider 已接入 runtime 路由，但当前还没有发起外部模型调用。

| 项目 | 状态 |
| --- | --- |
| provider | ${providerName} |
| 智能体 | ${agent.name} |
| 配置状态 | ${reason} |

### 下一步

1. 在智能体上配置 FastGPT 应用地址。
2. 设置 \`FASTGPT_API_KEY\`。
3. 在 provider 文件里实现真实 HTTP 调用。`,
    actions: ["填写 FastGPT endpoint", "设置 FASTGPT_API_KEY", "继续实现真实调用"]
  };
}

module.exports = {
  runFastGptProvider
};
