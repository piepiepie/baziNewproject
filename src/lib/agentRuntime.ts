import type { Agent, ChatMessage, Profile, Skill } from "../types";

export type RunAgentInput = {
  agent: Agent;
  profile: Profile;
  skills: Skill[];
  messages: ChatMessage[];
  question: string;
};

export async function runAgent(input: RunAgentInput): Promise<ChatMessage> {
  const activeSkills = input.skills.filter((skill) => input.agent.skillIds.includes(skill.id) && skill.status === "active");
  const skillNames = activeSkills.map((skill) => skill.name).join("、");

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: `## ${input.agent.name}解读

我已读取 **${input.profile.nickname}** 的档案，并按当前智能体绑定的 skill 进行编排：

| 调用顺序 | Skill | 作用 |
| --- | --- | --- |
| 1 | 档案读取 | 注入出生信息、八字四柱、当前大运 |
| 2 | ${skillNames || "暂无启用 skill"} | 生成结构化分析 |
| 3 | 追问建议 | 产出下一步可点击问题 |

### 针对你的问题

**${input.question}**

从当前档案看，重点仍然是把「强分析 + 可表达 + 能聚人」组合成一个稳定的输出系统。第一优先级不是继续增加信息，而是把已有经验产品化：先确定一个细分主题，再用长内容建立信任，用短内容打开流量入口。

> 这里是本地 mock runtime。后续可以把这个函数替换为 Dify、FastGPT 或 LangGraph API，但前端和 skill/agent 数据结构不需要大改。

### 建议动作

1. 在后台启用或新增对应 skill。
2. 给智能体绑定 skill 顺序。
3. 用沙盒测试输出质量后发布版本。`,
    actions: ["把这个做成报告模板", "新增一个紫微分析 skill", "设计后台发布流程"]
  };
}
