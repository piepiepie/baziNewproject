const { runMockProvider } = require("./providers/mockProvider");
const { runDifyProvider } = require("./providers/difyProvider");
const { runFastGptProvider } = require("./providers/fastgptProvider");
const { runLangGraphProvider } = require("./providers/langgraphProvider");

const providers = {
  mock: runMockProvider,
  dify: runDifyProvider,
  fastgpt: runFastGptProvider,
  langgraph: runLangGraphProvider
};

async function runAgentRuntime({ agent, profile, skills, question, thread }) {
  const activeSkills = skills.filter((skill) => agent.skillIds.includes(skill.id) && skill.status === "active");
  const providerName = agent.modelProvider || "mock";
  const provider = providers[providerName] || providers.mock;

  // 自动注入 Dify endpoint（如果智能体没有显式配置）
  if (providerName === "dify" && !agent.runtimeConfig?.endpoint) {
    const globalEndpoint = process.env.DIFY_API_ENDPOINT;
    if (globalEndpoint) {
      agent = {
        ...agent,
        runtimeConfig: {
          ...agent.runtimeConfig,
          endpoint: globalEndpoint
        }
      };
    }
  }

  return provider({
    agent,
    profile,
    skills,
    activeSkills,
    contextPack: {
      profileId: profile.id,
      profileName: profile.nickname,
      fortune: profile.fortune,
      pillars: profile.pillars,
      injected: true
    },
    question,
    thread
  });
}

function getProviderStatus(agent) {
  const providerName = agent.modelProvider || "mock";
  const config = agent.runtimeConfig || {};
  const hasEndpoint = providerName === "mock" || Boolean(config.endpoint);
  const hasApiKey = providerName === "mock" || (config.apiKeyEnv ? Boolean(process.env[config.apiKeyEnv]) : false);
  const ready = providerName === "mock" || (hasEndpoint && hasApiKey);

  return {
    agentId: agent.id,
    provider: providerName,
    ready,
    endpointConfigured: hasEndpoint,
    apiKeyEnv: config.apiKeyEnv || "",
    apiKeyConfigured: hasApiKey,
    adapterImplemented: true
  };
}

module.exports = {
  getProviderStatus,
  runAgentRuntime
};
