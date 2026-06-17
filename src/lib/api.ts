import type { Agent, ChartRecord, ChatMessage, Profile, ProviderStatus, ReportBlocksPayload, Skill } from "../types";

export type BootstrapPayload = {
  profiles: Profile[];
  charts: ChartRecord[];
  reportBlocks: ReportBlocksPayload[];
  skills: Skill[];
  agents: Agent[];
  providerStatuses: ProviderStatus[];
  activeProfileId: string;
  activeAgentId: string;
  thread: {
    id: string;
    profileId: string;
    agentId: string;
    title: string;
    messages: ChatMessage[];
  };
};

export async function fetchBootstrap(): Promise<BootstrapPayload> {
  const response = await fetch("/api/bootstrap");
  if (!response.ok) {
    throw new Error(`Bootstrap failed: ${response.status}`);
  }
  return response.json();
}

export async function recalculateProfileApi(profileId: string): Promise<{ profile: Profile; chart: ChartRecord; reportBlocks?: ReportBlocksPayload }> {
  const response = await fetch(`/api/profiles/${profileId}/recalculate`, {
    method: "POST"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Recalculate failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchReportBlocksApi(profileId: string): Promise<{ reportBlocks: ReportBlocksPayload }> {
  const response = await fetch(`/api/profiles/${profileId}/report_blocks`);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Report blocks fetch failed: ${response.status}`);
  }

  return response.json();
}

export async function runAgentApi(input: {
  agentId: string;
  profileId: string;
  threadId: string;
  question: string;
}): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; activeSkillIds: string[]; providerStatus: ProviderStatus }> {
  const response = await fetch(`/api/agents/${input.agentId}/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      profileId: input.profileId,
      threadId: input.threadId,
      question: input.question
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Agent run failed: ${response.status}`);
  }

  return response.json();
}

export async function updateSkillApi(skillId: string, patch: Partial<Skill>): Promise<Skill> {
  const response = await fetch(`/api/skills/${skillId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Skill update failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.skill;
}
