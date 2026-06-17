const { randomUUID } = require("node:crypto");

async function runMockProvider({ agent, profile, activeSkills, contextPack, question }) {
  const skillNames = activeSkills.map((skill) => skill.name).join("、") || "暂无启用 skill";

  return {
    id: randomUUID(),
    role: "assistant",
    content: `## ${agent.name}解读

我已从后端数据库读取 **${profile.nickname}** 的档案，并通过 \`/api/agents/${agent.id}/run\` 完成一次真实接口调用。

| 调用顺序 | 模块 | 当前结果 |
| --- | --- | --- |
| 1 | Profile Repository | ${profile.nickname} · ${profile.fortune} |
| 2 | Agent Registry | ${agent.name} |
| 3 | Skill Registry | ${skillNames} |
| 4 | Context Injection | ${contextPack?.injected ? "已注入八字档案" : "未注入"} |
| 5 | Runtime Provider | mock |

### 针对你的问题

**${question}**

当前智能体已经自动带入八字档案：四柱 ${profile.pillars.year}、${profile.pillars.month}、${profile.pillars.day}、${profile.pillars.hour}。无论是参天大师、事业教练还是紫微导师，都可以读取同一份档案上下文，并根据绑定 skill 做不同方向的分析。

### 后续扩展方式

1. 新增 skill：写入 \`skills\`，定义输入、输出、prompt 和状态。
2. 新增智能体：写入 \`agents\`，绑定多个 skillId 和 provider 配置。
3. 切换 provider：修改智能体的 \`modelProvider\` 与 \`runtimeConfig\`。
4. 发布版本：后续可把 \`status\` 和 \`version\` 扩展为完整发布流。

> 这次回答来自 mock provider。接入真实模型时，只需要实现对应 provider 的 \`run\` 方法。`,
    actions: ["接入 Dify 工作流", "配置 FastGPT 智能体", "把 JSON 换成 SQLite"]
  };
}

module.exports = {
  runMockProvider
};
