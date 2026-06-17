const http = require("node:http");
const { readFile, writeFile } = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

// 加载 .env 环境变量（Node.js 18+ 原生支持，无需 dotenv）
const { config } = require("node:process");
// 手动读取 .env 文件
const { readFileSync } = require("node:fs");
try {
  const envPath = path.join(__dirname, "..", ".env");
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  console.log("[server] 未找到 .env 文件，使用系统环境变量。");
}

const { getProviderStatus, runAgentRuntime } = require("./runtime");
const { calculateProfileCharts, patchProfileFromBazi } = require("./taibu");
const { generateReportBlocks } = require("./report-blocks");

const PORT = Number(process.env.API_PORT || 8788);
const DB_PATH = path.join(__dirname, "..", "data", "db.json");

async function readDb() {
  const content = await readFile(DB_PATH, "utf8");
  return JSON.parse(content);
}

async function writeDb(db) {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  sendJson(res, 404, { error: "Not found" });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleRequest(req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    if (req.method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, { ok: true, service: "cantian-agent-api" });
      return;
    }

    if (req.method === "GET" && pathname === "/api/bootstrap") {
      const db = await readDb();
      const thread = db.threads[0];
      const reportBlocks = db.reportBlocks || [];
      sendJson(res, 200, {
        profiles: db.profiles,
        skills: db.skills,
        agents: db.agents,
        charts: db.charts || [],
        reportBlocks,
        providerStatuses: db.agents.map(getProviderStatus),
        activeProfileId: thread.profileId,
        activeAgentId: thread.agentId,
        thread
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/skills") {
      const body = await readBody(req);
      const db = await readDb();
      const skill = {
        id: body.id || `skill-${randomUUID()}`,
        name: body.name || "未命名 Skill",
        version: body.version || "0.1.0",
        status: body.status || "draft",
        description: body.description || "",
        inputSchema: Array.isArray(body.inputSchema) ? body.inputSchema : [],
        outputSchema: Array.isArray(body.outputSchema) ? body.outputSchema : [],
        prompt: body.prompt || ""
      };
      db.skills.push(skill);
      await writeDb(db);
      sendJson(res, 201, { skill });
      return;
    }

    if (req.method === "POST" && pathname === "/api/agents") {
      const body = await readBody(req);
      const db = await readDb();
      const agent = {
        id: body.id || `agent-${randomUUID()}`,
        name: body.name || "未命名智能体",
        avatar: body.avatar || "智",
        description: body.description || "",
        greeting: body.greeting || "",
        skillIds: Array.isArray(body.skillIds) ? body.skillIds : [],
        modelProvider: body.modelProvider || "mock",
        endpoint: body.endpoint,
        runtimeConfig: body.runtimeConfig || {}
      };
      db.agents.push(agent);
      await writeDb(db);
      sendJson(res, 201, { agent });
      return;
    }

    if (req.method === "POST" && pathname === "/api/profiles") {
      const body = await readBody(req);
      const db = await readDb();
      const profile = {
        id: body.id || `profile-${randomUUID()}`,
        nickname: body.nickname || "新档案",
        gender: body.gender || "",
        birthplace: body.birthplace || "",
        birthAt: body.birthAt || "",
        lunarBirth: body.lunarBirth || "",
        trueSolarTime: body.trueSolarTime || "",
        longitude: body.longitude,
        pillars: body.pillars || { year: "", month: "", day: "", hour: "" },
        tenGods: body.tenGods || { year: "", month: "", day: "", hour: "" },
        fortune: body.fortune || "",
        focus: Array.isArray(body.focus) ? body.focus : []
      };
      db.profiles.push(profile);
      await writeDb(db);
      sendJson(res, 201, { profile });
      return;
    }

    const recalculateMatch = pathname.match(/^\/api\/profiles\/([^/]+)\/recalculate$/);
    if (req.method === "POST" && recalculateMatch) {
      const profileId = recalculateMatch[1];
      const db = await readDb();
      const index = db.profiles.findIndex((item) => item.id === profileId);

      if (index === -1) {
        sendJson(res, 404, { error: `Profile ${profileId} not found` });
        return;
      }

      const chart = await calculateProfileCharts(db.profiles[index]);
      db.profiles[index] = patchProfileFromBazi(db.profiles[index], chart.bazi, chart.dayun);
      db.charts = db.charts || [];
      const chartIndex = db.charts.findIndex((item) => item.profileId === profileId);
      if (chartIndex === -1) {
        db.charts.push(chart);
      } else {
        db.charts[chartIndex] = chart;
      }

      // 自动生成 report_blocks
      db.reportBlocks = db.reportBlocks || [];
      const rb = generateReportBlocks(db.profiles[index], chart);
      const rbIndex = db.reportBlocks.findIndex((item) => item.profileId === profileId);
      if (rbIndex === -1) {
        db.reportBlocks.push(rb);
      } else {
        db.reportBlocks[rbIndex] = rb;
      }

      await writeDb(db);
      sendJson(res, 200, { profile: db.profiles[index], chart, reportBlocks: rb });
      return;
    }

    const reportBlocksMatch = pathname.match(/^\/api\/profiles\/([^/]+)\/report_blocks$/);
    if (req.method === "GET" && reportBlocksMatch) {
      const profileId = reportBlocksMatch[1];
      const db = await readDb();

      let rb = (db.reportBlocks || []).find((item) => item.profileId === profileId);
      if (!rb) {
        const profile = db.profiles.find((item) => item.id === profileId);
        const chart = (db.charts || []).find((item) => item.profileId === profileId);
        if (!profile) {
          sendJson(res, 404, { error: `Profile ${profileId} not found` });
          return;
        }
        rb = generateReportBlocks(profile, chart);
        db.reportBlocks = db.reportBlocks || [];
        db.reportBlocks.push(rb);
        await writeDb(db);
      }
      sendJson(res, 200, { reportBlocks: rb });
      return;
    }

    if (req.method === "POST" && reportBlocksMatch) {
      const profileId = reportBlocksMatch[1];
      const db = await readDb();
      const profile = db.profiles.find((item) => item.id === profileId);
      const chart = (db.charts || []).find((item) => item.profileId === profileId);

      if (!profile) {
        sendJson(res, 404, { error: `Profile ${profileId} not found` });
        return;
      }

      const rb = generateReportBlocks(profile, chart);
      db.reportBlocks = db.reportBlocks || [];
      const rbIndex = db.reportBlocks.findIndex((item) => item.profileId === profileId);
      if (rbIndex === -1) {
        db.reportBlocks.push(rb);
      } else {
        db.reportBlocks[rbIndex] = rb;
      }

      await writeDb(db);
      sendJson(res, 200, { reportBlocks: rb });
      return;
    }

    if (req.method === "POST" && pathname === "/api/charts/bazi") {
      const body = await readBody(req);
      const chart = await calculateProfileCharts({
        id: body.profileId || "adhoc",
        gender: body.gender || "male",
        birthplace: body.birthplace || body.birthPlace || "",
        birthAt: body.birthAt,
        longitude: body.longitude
      });
      sendJson(res, 200, { chart });
      return;
    }

    const runMatch = pathname.match(/^\/api\/agents\/([^/]+)\/run$/);
    if (req.method === "POST" && runMatch) {
      const agentId = runMatch[1];
      const body = await readBody(req);
      const db = await readDb();
      const agent = db.agents.find((item) => item.id === agentId);
      const profile = db.profiles.find((item) => item.id === body.profileId);
      const thread = db.threads.find((item) => item.id === (body.threadId || "thread-niuzi-main"));

      if (!agent) {
        sendJson(res, 404, { error: `Agent ${agentId} not found` });
        return;
      }

      if (!profile) {
        sendJson(res, 404, { error: `Profile ${body.profileId} not found` });
        return;
      }

      if (!body.question || typeof body.question !== "string") {
        sendJson(res, 400, { error: "question is required" });
        return;
      }

      const userMessage = {
        id: randomUUID(),
        role: "user",
        content: body.question
      };
      const assistantMessage = await runAgentRuntime({
        agent,
        profile,
        skills: db.skills,
        question: body.question,
        thread
      });

      if (thread) {
        thread.agentId = agent.id;
        thread.profileId = profile.id;
        thread.messages.push(userMessage, assistantMessage);
        await writeDb(db);
      }

      sendJson(res, 200, {
        userMessage,
        assistantMessage,
        activeSkillIds: agent.skillIds,
        providerStatus: getProviderStatus(agent)
      });
      return;
    }

    const skillMatch = pathname.match(/^\/api\/skills\/([^/]+)$/);
    if (req.method === "PATCH" && skillMatch) {
      const skillId = skillMatch[1];
      const body = await readBody(req);
      const db = await readDb();
      const skill = db.skills.find((item) => item.id === skillId);

      if (!skill) {
        sendJson(res, 404, { error: `Skill ${skillId} not found` });
        return;
      }

      Object.assign(skill, {
        ...body,
        id: skill.id
      });
      await writeDb(db);
      sendJson(res, 200, { skill });
      return;
    }

    notFound(res);
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unknown server error"
    });
  }
}

http.createServer(handleRequest).listen(PORT, "127.0.0.1", () => {
  console.log(`Agent API listening on http://127.0.0.1:${PORT}`);
});
