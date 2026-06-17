const { randomUUID } = require("node:crypto");

/**
 * Dify Provider — 混合架构核心
 *
 * 调用流程：
 *   用户问题 → Node.js 后端 → Dify 工作流 API → 返回结果
 *
 * Dify 工作流内部可以：
 *   - 调用 LLM 节点（DeepSeek/GLM/GPT）
 *   - 调用 HTTP 工具节点（连接 taibu-core 八字计算）
 *   - 调用知识库 RAG（命理经典）
 *   - 条件分支、变量拼接
 *
 * 支持两种模式：
 *   1. streaming (SSE) — 流式输出，前端逐字展示
 *   2. blocking   — 等待完整结果后返回
 */

async function runDifyProvider({ agent, profile, activeSkills, contextPack, question, thread }) {
  const config = agent.runtimeConfig || {};

  // ─── 校验配置 ───
  if (!config.endpoint) {
    return providerNotConfigured(agent, "Dify", "缺少 endpoint 配置。请在智能体 runtimeConfig 中设置。");
  }

  const apiKey = process.env[config.apiKeyEnv || "DIFY_API_KEY"];
  if (!apiKey) {
    return providerNotConfigured(agent, "Dify", `缺少环境变量 ${config.apiKeyEnv || "DIFY_API_KEY"}。`);
  }

  // ─── 构建 Dify inputs ───
  // 把八字档案、当前 Skill、上下文打包传给 Dify 工作流
  const inputs = {
    // 用户档案
    profile_name: profile.nickname,
    profile_gender: profile.gender,
    profile_birthplace: profile.birthplace,
    profile_birth: profile.birthAt,
    profile_fortune: profile.fortune,
    // 八字四柱
    pillar_year: profile.pillars.year,
    pillar_month: profile.pillars.month,
    pillar_day: profile.pillars.day,
    pillar_hour: profile.pillars.hour,
    // 十神
    tengod_year: profile.tenGods.year,
    tengod_month: profile.tenGods.month,
    tengod_day: profile.tenGods.day,
    tengod_hour: profile.tenGods.hour,
    // 关注点
    focus: (profile.focus || []).join("、"),
    // 当前激活的 Skill
    active_skills: activeSkills.map((s) => s.name).join("、"),
    // JSON 格式完整档案（供 LLM 节点直接解析）
    profile_json: JSON.stringify(profile, null, 2),
    // 对话历史摘要（取最近 6 条）
    conversation_summary: (thread?.messages || [])
      .slice(-6)
      .map((m) => `${m.role === "user" ? "用户" : "AI"}：${m.content.slice(0, 200)}`)
      .join("\n")
  };

  // ─── 调用 Dify API ───
  const useStreaming = config.streaming !== false; // 默认流式

  try {
    if (useStreaming) {
      return await callDifyStreaming(config.endpoint, apiKey, question, inputs, agent, profile);
    } else {
      return await callDifyBlocking(config.endpoint, apiKey, question, inputs, agent);
    }
  } catch (error) {
    console.error("[Dify Provider] 调用失败:", error.message);
    return {
      id: randomUUID(),
      role: "assistant",
      content: `## ${agent.name}

抱歉，AI 服务暂时不可用。请稍后重试。

> 错误信息：${error.message}

如需切换 provider，可在智能体设置中将 \`modelProvider\` 改为 \`mock\`。`,
      actions: ["重试", "切换到 Mock 模式"]
    };
  }
}

/**
 * 流式调用 Dify Chat API (SSE)
 * 收集所有 token 后拼接完整回答
 */
async function callDifyStreaming(endpoint, apiKey, question, inputs, agent, profile) {
  const url = `${endpoint}/v1/chat-messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: question,
      user: profile.id,
      response_mode: "streaming",
      inputs,
      conversation_id: "" // 每次新对话；如需保持上下文，传入已有 conversation_id
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dify API 返回 ${response.status}: ${errorText}`);
  }

  // 解析 SSE 流
  const fullAnswer = await parseSSEStream(response);
  const actions = extractActions(fullAnswer);

  return {
    id: randomUUID(),
    role: "assistant",
    content: fullAnswer,
    actions: actions.length > 0 ? actions : generateDefaultActions(agent, profile)
  };
}

/**
 * 阻塞式调用 Dify API（等待完整结果）
 */
async function callDifyBlocking(endpoint, apiKey, question, inputs, agent) {
  const url = `${endpoint}/v1/chat-messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: question,
      user: "user",
      response_mode: "blocking",
      inputs,
      conversation_id: ""
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dify API 返回 ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const answer = data.answer || "Dify 工作流返回了空结果。";
  const actions = extractActions(answer);

  return {
    id: randomUUID(),
    role: "assistant",
    content: answer,
    actions: actions.length > 0 ? actions : generateDefaultActions(agent, profile)
  };
}

/**
 * 解析 SSE (Server-Sent Events) 流
 * Dify streaming 格式: data: {"event":"message","answer":"文本片段"} ...
 */
async function parseSSEStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullAnswer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // 最后一行可能不完整，放回 buffer

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;

      try {
        const event = JSON.parse(jsonStr);
        if (event.event === "message" || event.event === "agent_message") {
          fullAnswer += event.answer || "";
        }
        // workflow_finished 事件包含完整 outputs
        if (event.event === "workflow_finished") {
          const outputs = event.data?.outputs;
          if (outputs?.text || outputs?.answer) {
            fullAnswer = outputs.text || outputs.answer;
          }
        }
      } catch {
        // 忽略无法解析的行
      }
    }
  }

  return fullAnswer || "AI 未返回有效回答，请重试。";
}

/**
 * 从回答中提取追问建议
 * 查找 "追问建议"、"你可以继续问" 等标记后的列表项
 */
function extractActions(text) {
  const actions = [];
  const patterns = [
    /(?:追问建议|你可以继续问|下一步建议)[：:]\s*\n([\s\S]*?)(?=\n\n|$)/,
    /\d+\.\s*\*?\*?"?([^"\n]{3,40})"?\*?\*?/g
  ];

  for (const pattern of patterns) {
    if (pattern.global) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const action = match[1].replace(/[*_"]/g, "").trim();
        if (action && action.length >= 3 && action.length <= 50) {
          actions.push(action);
        }
      }
      if (actions.length >= 3) break;
    }
  }

  return actions.slice(0, 3);
}

/**
 * 生成默认追问按钮
 */
function generateDefaultActions(agent, profile) {
  const skillNames = (agent.skillIds || []).slice(0, 3);
  const defaults = [
    `${profile.nickname}的${profile.fortune.slice(0, 6)}运势如何？`,
    "能帮我详细看看事业发展方向吗？",
    "我的八字格局有什么特点？"
  ];
  return defaults;
}

/**
 * Provider 未配置时的降级响应
 */
function providerNotConfigured(agent, providerName, reason) {
  return {
    id: randomUUID(),
    role: "assistant",
    content: `## ${agent.name} · ${providerName} Provider

${providerName} provider 已接入 runtime 路由，但当前配置不完整。

| 项目 | 状态 |
| --- | --- |
| provider | ${providerName} |
| 智能体 | ${agent.name} |
| 配置状态 | ${reason} |

### 如何配置

1. 在 \`data/db.json\` 智能体的 \`runtimeConfig\` 里设置 \`endpoint\`（Dify 服务地址）。
2. 在 \`.env\` 文件里设置 \`DIFY_API_KEY\`。
3. 确保 Dify 工作流已发布并生成 API 密钥。

> 也可以将 \`modelProvider\` 改为 \`mock\` 使用本地 Mock 模式。`,
    actions: ["配置 Dify endpoint", "设置 DIFY_API_KEY", "切换到 Mock 模式"]
  };
}

module.exports = {
  runDifyProvider
};
