import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { marked } from "marked";
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Copy,
  Database,
  FileText,
  LockKeyhole,
  Menu,
  MessageCirclePlus,
  Plus,
  SendHorizontal,
  Settings,
  Sparkles,
  Trash2,
  UserRound,
  Workflow,
  X
} from "lucide-react";
import type { Agent, ChartRecord, ChatMessage, Profile, ProviderStatus, ReportBlocksPayload, Skill } from "./types";
import { agents as seedAgents, initialMessages, profiles as seedProfiles, skills as seedSkills } from "./lib/mockData";
import { fetchBootstrap, recalculateProfileApi, runAgentApi, updateSkillApi } from "./lib/api";

type View = "chat" | "profile" | "admin";

export function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [view, setView] = useState<View>("chat");
  const [profiles, setProfiles] = useState<Profile[]>(seedProfiles);
  const [skills, setSkills] = useState<Skill[]>(seedSkills);
  const [agents, setAgents] = useState<Agent[]>(seedAgents);
  const [charts, setCharts] = useState<ChartRecord[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile>(seedProfiles[0]);
  const [activeAgent, setActiveAgent] = useState<Agent>(seedAgents[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [threadId, setThreadId] = useState("thread-niuzi-main");
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [reportBlocks, setReportBlocks] = useState<ReportBlocksPayload | null>(null);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [runtimeError, setRuntimeError] = useState("");

  useEffect(() => {
    fetchBootstrap()
      .then((payload) => {
        const nextProfile = payload.profiles.find((profile) => profile.id === payload.activeProfileId) ?? payload.profiles[0];
        const nextAgent = payload.agents.find((agent) => agent.id === payload.activeAgentId) ?? payload.agents[0];
        setProfiles(payload.profiles);
        setSkills(payload.skills);
        setAgents(payload.agents);
        setCharts(payload.charts);
        const activeRb = (payload.reportBlocks || []).find((rb) => rb.profileId === nextProfile.id) || null;
        setReportBlocks(activeRb);
        setActiveProfile(nextProfile);
        setActiveAgent(nextAgent);
        setProviderStatuses(payload.providerStatuses);
        setThreadId(payload.thread.id);
        setMessages(payload.thread.messages);
        setRuntimeError("");
      })
      .catch((error) => {
        setRuntimeError(error instanceof Error ? error.message : "后端接口暂不可用，当前使用前端种子数据。");
      });
  }, []);

  const agentSkills = useMemo(
    () => skills.filter((skill) => activeAgent.skillIds.includes(skill.id)),
    [activeAgent, skills]
  );

  async function sendQuestion(value = question) {
    const clean = value.trim();
    if (!clean || busy) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: clean };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setBusy(true);
    setRuntimeError("");
    try {
      const payload = await runAgentApi({
        agentId: activeAgent.id,
        profileId: activeProfile.id,
        threadId,
        question: clean
      });
      setProviderStatuses((current) =>
        current.map((status) => (status.agentId === payload.providerStatus.agentId ? payload.providerStatus : status))
      );
      setMessages((current) => [...current, payload.assistantMessage]);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : "智能体接口调用失败。");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSkill(skillId: string) {
    const currentSkill = skills.find((skill) => skill.id === skillId);
    if (!currentSkill) return;
    const nextStatus = currentSkill.status === "active" ? "disabled" : "active";
    setSkills((current) =>
      current.map((skill) =>
        skill.id === skillId
          ? { ...skill, status: nextStatus }
          : skill
      )
    );
    setRuntimeError("");
    try {
      const updatedSkill = await updateSkillApi(skillId, { status: nextStatus });
      setSkills((current) => current.map((skill) => (skill.id === skillId ? updatedSkill : skill)));
    } catch (error) {
      setSkills((current) => current.map((skill) => (skill.id === skillId ? currentSkill : skill)));
      setRuntimeError(error instanceof Error ? error.message : "Skill 更新失败。");
    }
  }

  async function recalculateActiveProfile() {
    setRecalculating(true);
    setRuntimeError("");
    try {
      const payload = await recalculateProfileApi(activeProfile.id);
      setActiveProfile(payload.profile);
      setProfiles((current) => current.map((profile) => (profile.id === payload.profile.id ? payload.profile : profile)));
      setCharts((current) => [...current.filter((chart) => chart.profileId !== payload.profile.id), payload.chart]);
      if (payload.reportBlocks) {
        setReportBlocks(payload.reportBlocks);
      }
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : "真实排盘失败。");
    } finally {
      setRecalculating(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className={`drawer ${drawerOpen ? "drawer--open" : ""}`}>
        <div className="brand-row">
          <b>Cantian AI</b>
          <button className="icon-button sidebar-collapse" onClick={() => setDrawerOpen(false)} aria-label="关闭边栏">
            <Menu size={18} />
          </button>
        </div>
        <button className="default-profile" onClick={() => setProfileModalOpen(true)}>
          <span className="icon-disc"><Plus size={18} /></span>
          <span>设置默认档案</span>
        </button>

        <nav className="drawer-nav" aria-label="主导航">
          <button onClick={() => { setView("chat"); setDrawerOpen(false); }}><MessageCirclePlus size={18} />新聊天</button>
          <button onClick={() => { setView("admin"); setDrawerOpen(false); }}><Sparkles size={18} />智能体大厅</button>
          <button onClick={() => { setView("profile"); setDrawerOpen(false); }}><Database size={18} />八字排盘</button>
          <button onClick={() => { setProfileModalOpen(true); setDrawerOpen(false); }}><ClipboardList size={18} />档案列表</button>
          <button onClick={() => { setView("admin"); setDrawerOpen(false); }}><Workflow size={18} />技能后台</button>
        </nav>

        <section className="history-list">
          <div className="section-title">
            <span>会话记录</span>
            <button>查看全部 <ChevronRight size={14} /></button>
          </div>
          {["人生长线图-牛子", "八字格局解读与事业方向", "新会话"].map((item) => (
            <button
              className={item.includes("事业") ? "history-item is-active" : "history-item"}
              key={item}
              onClick={() => { setView("chat"); setDrawerOpen(false); }}
            >
              {item}
            </button>
          ))}
        </section>

        <div className="drawer-promos">
          <button>分享领取大礼包</button>
          <button>专属祈福定制</button>
        </div>

        <div className="account-row">
          <span className="avatar-sm">玄</span>
          <span>903164524@qq.com</span>
          <Settings size={15} />
        </div>
      </aside>

      <div className={`scrim ${drawerOpen ? "scrim--show" : ""}`} onClick={() => setDrawerOpen(false)} />

      <main className="workspace">
        <header className="topbar">
          <button className="icon-button" onClick={() => setDrawerOpen(true)} aria-label="打开菜单">
            <Menu size={24} />
          </button>
          <button className="agent-title" onClick={() => setView("chat")}>
            <span className="agent-avatar">{activeAgent.avatar}</span>
            <span>{activeAgent.name}</span>
          </button>
          <div className="top-actions">
            <button className="top-text-button" onClick={() => setView("chat")}>
              <MessageCirclePlus size={16} /> 新聊天
            </button>
            <button className="icon-button" onClick={() => setView("admin")} aria-label="后台">
              <Workflow size={21} />
            </button>
            <button className="icon-button mobile-only" onClick={() => setDetailPanelOpen(true)} aria-label="档案">
              <UserRound size={21} />
            </button>
          </div>
        </header>

        {view === "chat" && (
          <ChatView
            activeProfile={activeProfile}
            messages={messages}
            busy={busy}
            runtimeError={runtimeError}
            openDetails={() => setDetailPanelOpen(true)}
            question={question}
            setQuestion={setQuestion}
            sendQuestion={sendQuestion}
          />
        )}

        {view === "profile" && (
          <ProfileView profile={activeProfile} setView={setView} />
        )}

        {view === "admin" && (
          <AdminView
            agents={agents}
            activeAgent={activeAgent}
            setActiveAgent={setActiveAgent}
            skills={skills}
            agentSkills={agentSkills}
            toggleSkill={toggleSkill}
            runtimeError={runtimeError}
            providerStatuses={providerStatuses}
          />
        )}
      </main>

      <aside className={`detail-panel ${detailPanelOpen ? "detail-panel--open" : ""}`}>
        <DossierPanel
          profile={activeProfile}
          chart={charts.find((chart) => chart.profileId === activeProfile.id)}
          close={() => setDetailPanelOpen(false)}
          recalculate={recalculateActiveProfile}
          recalculating={recalculating}
        />
      </aside>
      <div className={`panel-scrim ${detailPanelOpen ? "panel-scrim--show" : ""}`} onClick={() => setDetailPanelOpen(false)} />

      {profileModalOpen && (
        <ProfileModal
          profiles={profiles}
          activeProfile={activeProfile}
          setActiveProfile={setActiveProfile}
          close={() => setProfileModalOpen(false)}
        />
      )}
    </div>
  );
}

function ChatView({
  activeProfile,
  messages,
  busy,
  runtimeError,
  openDetails,
  question,
  setQuestion,
  sendQuestion
}: {
  activeProfile: Profile;
  messages: ChatMessage[];
  busy: boolean;
  runtimeError: string;
  openDetails: () => void;
  question: string;
  setQuestion: (value: string) => void;
  sendQuestion: (value?: string) => void;
}) {
  const latestActions = [...messages].reverse().find((message) => message.actions)?.actions ?? [];
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, busy]);

  return (
    <section className="chat-view">
      <button className="profile-pill" onClick={openDetails}>
        {activeProfile.nickname}的八字档案 <ChevronRight size={15} />
      </button>

      <div className="messages">
        {messages.map((message) => (
          <article className={`message message--${message.role}`} key={message.id}>
            <Markdown content={message.content} />
            {message.role === "assistant" && (
              <div className="message-tools">
                <button aria-label="复制"><Copy size={16} /></button>
                <button aria-label="删除"><Trash2 size={16} /></button>
              </div>
            )}
          </article>
        ))}
        {busy && <div className="thinking">正在调用技能编排...</div>}
        {runtimeError && <div className="runtime-error">{runtimeError}</div>}
        <div ref={endRef} />
      </div>

      <footer className="composer-wrap">
        <div className="quick-actions">
          {latestActions.map((action) => (
            <button key={action} onClick={() => sendQuestion(action)}>
              {action}
            </button>
          ))}
        </div>
        <p className="quota-text">你还有1条额度（免费1条，兑换0条）</p>
        <div className="composer">
          <button className="icon-button"><Plus size={21} /></button>
          <textarea
            value={question}
            placeholder="问一问"
            rows={1}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendQuestion();
              }
            }}
          />
          <button className="send-button" onClick={() => sendQuestion()} disabled={busy}>
            <SendHorizontal size={19} />
          </button>
        </div>
        <p className="ai-note">内容由AI生成，仅供参考。你的聊天信息将严格保密。</p>
      </footer>
    </section>
  );
}

function DossierPanel({
  profile,
  chart,
  close,
  recalculate,
  recalculating
}: {
  profile: Profile;
  chart?: ChartRecord;
  close: () => void;
  recalculate: () => void;
  recalculating: boolean;
}) {
  const [detailTab, setDetailTab] = useState<"basic" | "fortune" | "report">("basic");

  return (
    <section className="dossier-content">
      <header className="dossier-header">
        <div>
          <small>命盘档案</small>
          <h2>{profile.nickname}的八字档案</h2>
        </div>
        <button className="icon-button mobile-only" onClick={close} aria-label="关闭档案">
          <X size={22} />
        </button>
      </header>

      <div className="tabs tabs--panel">
        <button className={detailTab === "basic" ? "is-active" : ""} onClick={() => setDetailTab("basic")}><UserRound size={16} />基本信息</button>
        <button className={detailTab === "fortune" ? "is-active" : ""} onClick={() => setDetailTab("fortune")}><CalendarDays size={16} />大运流年</button>
        <button className="tab-muted" disabled><LockKeyhole size={15} />2026年度报告</button>
        <button className={detailTab === "report" ? "is-active" : ""} onClick={() => setDetailTab("report")}><FileText size={16} />个性报告</button>
        <button className="tab-muted" disabled><LockKeyhole size={15} />深度报告</button>
      </div>

      {detailTab === "basic" && <BasicChartPanel profile={profile} chart={chart} reportBlocks={reportBlocks} recalculate={recalculate} recalculating={recalculating} />}
      {detailTab === "fortune" && <FortunePanel profile={profile} chart={chart} />}
      {detailTab === "report" && <ReportPanel profile={profile} chart={chart} reportBlocks={reportBlocks} />}
    </section>
  );
}

function BasicChartPanel({ profile, chart, reportBlocks, recalculate, recalculating }: { profile: Profile; chart?: ChartRecord; reportBlocks: ReportBlocksPayload | null; recalculate: () => void; recalculating: boolean }) {
  // 优先使用后端 report_blocks 驱动渲染（零前端计算）
  const blocks = reportBlocks?.blocks;

  return (
    <>
      <section className="birth-card">
        <span className="large-avatar">玄</span>
        <div className="birth-main">
          <b>{profile.nickname}</b>
          <span>性别：{profile.gender}</span>
          <span>出生地点：{profile.birthplace}{profile.longitude ? ` · 经度 ${profile.longitude}` : ""}</span>
          <span>公历：{profile.birthAt}</span>
          <span>农历：{profile.lunarBirth}</span>
          <span>真太阳时：{profile.trueSolarTime}</span>
        </div>
        <button onClick={recalculate} disabled={recalculating}>{recalculating ? "排盘中..." : "重新排盘"}</button>
      </section>

      <BaziMatrix profile={profile} chart={chart} />

      {blocks
        ? blocks.map((block) => renderBlockSection(block, profile))
        : <FallbackBasicSections profile={profile} chart={chart} />
      }
    </>
  );
}

/** 后端 report_blocks 驱动：按 block.type 渲染对应组件 */
function renderBlockSection(block: { id: string; type: string; title: string; summary: string; data: Record<string, unknown> }, profile: Profile) {
  const data = block.data as Record<string, any>;

  switch (block.type) {
    case "pattern":
      return (
        <section className="section-card" key={block.id}>
          <div className="section-title-row"><h3>{block.title}</h3><span>i</span></div>
          <div className="pattern-panel">
            <b>{data.name}</b>
            <small>{data.subtitle}</small>
          </div>
          <p className="soft-note">{data.description}</p>
          <div className="related-tags">{(data.tags as string[]).map((item) => <span key={item}>{item}</span>)}</div>
          <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
        </section>
      );

    case "elements":
      return (
        <section className="section-card" key={block.id}>
          <div className="section-title-row"><h3>{block.title}</h3><span>i</span></div>
          <div className="vertical-bars">
            {(data.stats as Array<{ key: string; label: string; percent: number; element: string }>).map((item) => <VerticalBar key={item.key} item={item} />)}
          </div>
          <p className="soft-note">{block.summary}</p>
          <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
        </section>
      );

    case "ten_gods":
      return (
        <section className="section-card" key={block.id}>
          <div className="section-title-row"><h3>{block.title}</h3><span>i</span></div>
          <div className="vertical-bars vertical-bars--ten">
            {(data.stats as Array<{ key: string; label: string; percent: number; element: string }>).map((item) => <VerticalBar key={item.key} item={item} />)}
          </div>
          <p className="soft-note">{block.summary}</p>
          <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
        </section>
      );

    case "shen_sha":
      return (
        <section className="section-card" key={block.id}>
          <div className="section-title-row"><h3>{block.title}</h3><span>i</span></div>
          <div className="spirit-groups">
            {(data.groups as Array<{ title: string; items: string[] }>).map((group) => (
              <div className="spirit-group" key={group.title}>
                <b>{group.title}</b>
                <div>{group.items.map((item: string) => <span key={item}>{item}</span>)}</div>
              </div>
            ))}
          </div>
          <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
        </section>
      );

    case "strength":
      return (
        <section className="section-card strength-card" key={block.id}>
          <div className="section-title-row"><h3>{block.title}</h3><span>i</span></div>
          <div className={`strength-orb strength-${data.level}`}>
            <i />
            <b>{data.dayMaster} · {data.label}</b>
            <small>{data.description}</small>
          </div>
          <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
        </section>
      );

    case "useful_gods":
      return (
        <section className="section-card" key={block.id}>
          <div className="section-title-row"><h3>{block.title}</h3><span>i</span></div>
          <div className="useful-grid">
            <div><b>喜</b><p>{(data.primary as string[]).join("、")}</p></div>
            <div><b>忌</b><p>{(data.avoid as string[]).join("、")}</p></div>
          </div>
          <div className="useful-line">
            <b>喜用神参考</b>
            <span>{(data.primaryElements as Array<{ name: string; element: string }>).map((item) => <i key={item.name} className={`dot dot-${item.element}`} />)}</span>
          </div>
          <p className="soft-note">{block.summary}</p>
          <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
        </section>
      );

    case "yin_yang":
      return (
        <section className="section-card yin-card" key={block.id}>
          <div className="section-title-row"><h3>{block.title}</h3><span>i</span></div>
          <div className="yin-wrap">
            <div className="yin-dial" style={{ background: `conic-gradient(#5d5d5d 0 ${data.percent}%, #efe7dc ${data.percent}% 100%)` }}><b>{data.percent}%</b></div>
            <p>阳性 {data.yang} 个，阴性 {data.yin} 个。阴阳比例用于观察外放程度、决策速度和情绪调节方式。</p>
          </div>
          <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
        </section>
      );

    case "zodiac":
      return (
        <section className="section-card zodiac-card" key={block.id}>
          <div className="section-title-row"><h3>{block.title}</h3><span>i</span></div>
          <div className="zodiac-body">
            <span className="large-avatar">玄</span>
            <p>{data.description}</p>
          </div>
          <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
        </section>
      );

    case "day_pillar":
      return (
        <section className="section-card" key={block.id}>
          <div className="section-title-row"><h3>{block.title}</h3><span>i</span></div>
          <div className="day-pillar">
            <b>{data.ganZhi}</b>
            <span>{data.diShi}</span>
            <small>{data.naYin}</small>
          </div>
          <div className="report-mini-table">
            <div><b>十神关系</b><span>{data.tenGodRel}</span></div>
            <div><b>日主状态</b><span>{data.description}</span></div>
          </div>
          <p className="soft-note">{block.summary}</p>
          <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
        </section>
      );

    case "adjustment":
      return (
        <section className="section-card" key={block.id}>
          <div className="section-title-row"><h3>{block.title}</h3><span>i</span></div>
          <div className="toggle-tabs"><button className="is-active">寒湿</button><button>燥热</button><button>平衡</button></div>
          <p className="soft-note">{block.summary}</p>
          <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
        </section>
      );

    case "flow":
      return (
        <section className="section-card flow-card" key={block.id}>
          <div className="section-title-row"><h3>{block.title}</h3><span>i</span></div>
          <div className="flow-line">
            {(data.pillars as Array<{ label: string; gan: string; zhi: string }>).map((pillar) => (
              <div key={`${pillar.label}-${pillar.gan}`}>
                <small>{pillar.label}</small>
                <b className={`text-${elementClass(pillar.gan)}`}>{pillar.gan}</b>
                <span className={`text-${elementClass(pillar.zhi)}`}>{pillar.zhi}</span>
              </div>
            ))}
          </div>
          <p className="soft-note">{block.summary}</p>
        </section>
      );

    default:
      return null;
  }
}

/** 降级路径：后端未生成 report_blocks 时走前端旧计算逻辑 */
function FallbackBasicSections({ profile, chart }: { profile: Profile; chart?: ChartRecord }) {
  const elementStats = getElementStats(profile, chart);
  const tenGodStats = getTenGodStats(profile, chart);
  const shenShaGroups = getShenShaGroups(chart);
  const dayMaster = chart?.bazi?.dayMaster || profile.pillars.day[0];
  const strength = getStrengthProfile(dayMaster, elementStats);
  const useful = getUsefulGods(dayMaster, strength.level);

  return (
    <>
      <PatternSection profile={profile} chart={chart} strength={strength} />
      <ElementSection stats={elementStats} useful={useful} />
      <TenGodSection stats={tenGodStats} />
      <SpiritSection groups={shenShaGroups} />
      <StrengthSection dayMaster={dayMaster} strength={strength} />
      <UsefulGodSection useful={useful} profile={profile} />
      <YinYangSection profile={profile} />
      <ZodiacSection profile={profile} />
      <DayPillarSection profile={profile} chart={chart} />
      <AdjustSection useful={useful} />
      <FlowSection profile={profile} useful={useful} />
    </>
  );
}

function FortunePanel({ profile, chart }: { profile: Profile; chart?: ChartRecord }) {
  const year = new Date().getFullYear();
  const dayunList = chart?.dayun?.list ?? [];
  const current = dayunList.find((item) => year >= item.startYear && year <= item.startYear + 9);
  const visibleDayun = dayunList.slice(1, 9);
  const liunian = current?.liunianList?.slice(0, 7) ?? [];
  const monthGanZhi = ["庚寅", "辛卯", "壬辰", "癸巳", "甲午", "乙未", "丙申"];

  return (
    <>
      <BaziMatrix profile={profile} chart={chart} includeFlow />

      <section className="luck-start">
        <div>
          <b>纳音/星运/自坐/空亡/神煞</b>
          <span>展开</span>
        </div>
        <p>起运：{chart?.dayun?.startAgeDetail || "出生后4年3月3天9时起运"}，交运：逢丙、辛年惊蛰后交大运</p>
      </section>

      <div className="luck-grid" aria-label="大运流年表">
        <div className="luck-row">
          <div className="luck-label">大运</div>
          {visibleDayun.map((item) => <LuckCell key={`${item.startYear}-${item.ganZhi}`} top={`${item.startYear}`} middle={`${item.startAge}岁`} gz={item.ganZhi} note={`${item.tenGod}/${item.branchTenGod}`} active={item.ganZhi === current?.ganZhi} />)}
        </div>
        <div className="luck-row">
          <div className="luck-label">流年</div>
          {liunian.map((item) => <LuckCell key={item.year} top={`${item.year}`} middle={`${item.age}岁`} gz={item.ganZhi} note={`${item.tenGod}${item.taiSui?.[0] ? ` · ${item.taiSui[0]}` : ""}`} />)}
        </div>
        <div className="luck-row">
          <div className="luck-label">流月</div>
          {monthGanZhi.map((ganZhi, index) => <LuckCell key={ganZhi} top={["立春", "惊蛰", "清明", "立夏", "芒种", "小暑", "立秋"][index]} middle={`${index + 2}/${index + 4}`} gz={ganZhi} note={["食神", "伤官", "比肩", "劫财", "食神", "伤官", "偏财"][index]} />)}
        </div>
      </div>

      <section className="section-card">
        <div className="section-title-row">
          <h3>参天指数</h3>
          <span>i</span>
        </div>
        <div className="empty-index">请选择出生日之后的日期</div>
      </section>
    </>
  );
}

function ReportPanel({ profile, chart, reportBlocks }: { profile: Profile; chart?: ChartRecord; reportBlocks: ReportBlocksPayload | null }) {
  const personality = reportBlocks?.personality;

  if (personality) {
    return (
      <section className="paper-report">
        <div className="paper-head">
          <h1>个性报告</h1>
          <button>重新生成报告</button>
        </div>

        <ReportChapter title="性格简述">
          {personality.summary.split("\n\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
        </ReportChapter>

        <ReportChapter title="性格优点">
          <ul>
            {personality.strengths.map((item) => (
              <li key={item.title}><b>{item.title}：</b>{item.text}</li>
            ))}
          </ul>
        </ReportChapter>

        <ReportChapter title="性格缺点">
          <ul>
            {personality.weaknesses.map((item) => (
              <li key={item.title}><b>{item.title}：</b>{item.text}</li>
            ))}
          </ul>
        </ReportChapter>

        <ReportChapter title="天赋、定位与阶段">
          <div className="report-mini-table">
            <div><b>天赋</b><span>{personality.talent.talent}</span></div>
            <div><b>定位</b><span>{personality.talent.positioning}</span></div>
            <div><b>工作表现</b><span>{personality.talent.workStyle}</span></div>
            <div><b>当前阶段</b><span>{personality.talent.currentPhase}</span></div>
          </div>
        </ReportChapter>

        <ReportChapter title="紫微摘录">
          <p>{personality.ziwei.excerpt}</p>
          <div className="palace-grid">
            {personality.ziwei.topPalaces.map((palace) => (
              <article className="palace-card" key={`${palace.name}-${palace.stemBranch}`}>
                <b>{palace.name}</b>
                <span>{palace.stemBranch}</span>
                <small>{palace.stars}</small>
              </article>
            ))}
          </div>
        </ReportChapter>
      </section>
    );
  }

  // 降级路径：从 chart.ziwei 读取
  const palaces = chart?.ziwei?.palaces ?? [];
  const bodyPalace = palaces.find((item) => item.isBodyPalace);

  return (
    <section className="paper-report">
      <div className="paper-head">
        <h1>个性报告</h1>
        <button>重新生成报告</button>
      </div>

      <ReportChapter title="性格简述">
        <p>
          命主为{chart?.bazi?.dayMaster || profile.pillars.day[0]}日主，生于子月，自坐申金长生之地。整体气质偏理性、深思、洞察强，外表平静，内在能量流动很快，适合处理复杂信息、战略判断和长期规划。
        </p>
        <p>
          当前处在{profile.fortune}，大运把表达、产品化和组织能力推到台前。你的优势不是单点执行，而是把复杂经验提炼成方法，再用稳定输出影响别人。
        </p>
      </ReportChapter>

      <ReportChapter title="性格优点">
        <ul>
          <li><b>悟性极高，洞察力强：</b>能快速看透问题本质，并把零散信息整理成框架。</li>
          <li><b>内心强大，韧劲十足：</b>遇到压力不容易彻底放弃，越到关键时刻越能扛事。</li>
          <li><b>重情重义，愿意托底：</b>对认可的人有保护欲，也容易成为团队里的主心骨。</li>
        </ul>
      </ReportChapter>

      <ReportChapter title="性格缺点">
        <ul>
          <li><b>思虑过重，行动迟缓：</b>想得太深时，会反复推演，导致启动变慢。</li>
          <li><b>清高孤傲，不善变通：</b>标准高，容易对低质量沟通失去耐心。</li>
          <li><b>财务规划需要外部约束：</b>赚钱更多靠能力和资源整合，不能只靠临场感觉。</li>
        </ul>
      </ReportChapter>

      <ReportChapter title="天赋、定位与阶段">
        <div className="report-mini-table">
          <div><b>天赋</b><span>战略思维、表达转化、学习吸收、聚人破局</span></div>
          <div><b>定位</b><span>洞察型战略家，适合站在高处定方向、做体系</span></div>
          <div><b>工作表现</b><span>启动快、判断准，但需要用节奏管理细节落地</span></div>
          <div><b>当前阶段</b><span>{profile.fortune}，适合知识 IP、咨询产品和长期资产化</span></div>
        </div>
      </ReportChapter>

      <ReportChapter title="紫微摘录">
        <p>
          命主 {chart?.ziwei?.soul || "待排盘"}，身主 {chart?.ziwei?.body || "待排盘"}，五行局 {chart?.ziwei?.fiveElement || "待排盘"}。
          {bodyPalace ? ` 身宫落在${bodyPalace.name}，大限 ${bodyPalace.decadalRange?.join("-")}，可重点观察${bodyPalace.sanFangSiZheng?.join("、") || "三方四正"}。` : " 完成紫微排盘后，将显示身宫、大限与三方四正。"}
        </p>
        <div className="palace-grid">
          {palaces.slice(0, 4).map((palace) => (
            <article className="palace-card" key={`${palace.name}-${palace.earthlyBranch}`}>
              <b>{palace.name}</b>
              <span>{palace.heavenlyStem}{palace.earthlyBranch}</span>
              <small>{[...(palace.majorStars || []), ...(palace.minorStars || [])].slice(0, 3).map((star) => star.name).join("、") || "无主星"}</small>
            </article>
          ))}
        </div>
      </ReportChapter>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return <div className="metric-card"><span>{label}</span><b>{value}</b></div>;
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return <section className="info-block"><h3>{title}</h3>{items.map((item) => <p key={item}>{item}</p>)}</section>;
}

function HiddenStemPanel({ chart }: { chart?: ChartRecord }) {
  const pillars = chart?.bazi?.fourPillars;
  if (!pillars) return null;
  return (
    <section className="info-block">
      <h3>藏干与神煞</h3>
      {Object.entries(pillars).map(([key, pillar]) => (
        <p key={key}><b>{pillar.stem}{pillar.branch}</b>：{pillar.hiddenStems?.map((stem) => `${stem.stem}${stem.tenGod}`).join("、")} · {pillar.shenSha?.slice(0, 4).join("、")}</p>
      ))}
    </section>
  );
}

function ReportItem({ title, text }: { title: string; text: string }) {
  return <div className="report-item"><b>{title}</b><p>{text}</p></div>;
}

function BaziMatrix({ profile, chart, includeFlow = false }: { profile: Profile; chart?: ChartRecord; includeFlow?: boolean }) {
  const pillars = chart?.bazi?.fourPillars;
  const kongWang = (chart?.bazi as { kongWang?: { kongZhi?: string[] } } | undefined)?.kongWang?.kongZhi?.join("") || "待算";
  const cells = [
    { key: "year", label: "年柱", pillar: profile.pillars.year, ten: profile.tenGods.year },
    { key: "month", label: "月柱", pillar: profile.pillars.month, ten: profile.tenGods.month },
    { key: "day", label: "日柱", pillar: profile.pillars.day, ten: profile.tenGods.day },
    { key: "hour", label: "时柱", pillar: profile.pillars.hour, ten: profile.tenGods.hour }
  ];
  const flow = includeFlow ? [
    { key: "flow-year", label: "流年", pillar: "丙午", ten: "偏财" },
    { key: "luck", label: "大运", pillar: "乙未", ten: "伤官" }
  ] : [];
  const all = [...flow, ...cells];
  const gridStyle = { gridTemplateColumns: `58px repeat(${all.length}, minmax(58px, 1fr))` };

  return (
    <section className="bazi-matrix">
      <div className="matrix-row matrix-title" style={gridStyle}>
        <span />
        {all.map((item) => <b key={`${item.key}-label`}>{item.label}</b>)}
      </div>
      <div className="matrix-row matrix-head" style={gridStyle}>
        <span>主星</span>
        {all.map((item) => <b key={item.key}>{item.ten}</b>)}
      </div>
      <div className="matrix-row" style={gridStyle}>
        <span>天干</span>
        {all.map((item) => <MatrixGlyph key={`${item.key}-stem`} glyph={item.pillar[0]} note={item.ten} />)}
      </div>
      <div className="matrix-row" style={gridStyle}>
        <span>地支</span>
        {all.map((item) => <MatrixGlyph key={`${item.key}-branch`} glyph={item.pillar[1]} note={pillars?.[item.key]?.branch ? pillars[item.key]?.tenGod || "" : item.ten} />)}
      </div>
      <div className="matrix-row matrix-hidden" style={gridStyle}>
        <span>藏干</span>
        {all.map((item) => {
          const hidden = pillars?.[item.key]?.hiddenStems?.slice(0, 3).map((stem) => `${stem.stem} ${stem.tenGod}`).join(" ");
          return <small key={`${item.key}-hidden`}>{hidden || "丁 正财 己 正官"}</small>;
        })}
      </div>
      <MatrixTextRow label="星运" values={all.map((item) => pillars?.[item.key]?.diShi || "长生")} gridStyle={gridStyle} />
      <MatrixTextRow label="自坐" values={all.map((item) => pillars?.[item.key]?.diShi || "临官")} gridStyle={gridStyle} />
      <MatrixTextRow label="纳音" values={all.map((item) => pillars?.[item.key]?.naYin || "待排盘")} gridStyle={gridStyle} />
      <MatrixTextRow label="空亡" values={all.map(() => kongWang)} gridStyle={gridStyle} />
      <MatrixTextRow label="神煞" values={all.map((item) => pillars?.[item.key]?.shenSha?.slice(0, 5).join("、") || "待排盘")} gridStyle={gridStyle} />
    </section>
  );
}

function MatrixTextRow({ label, values, gridStyle }: { label: string; values: string[]; gridStyle: CSSProperties }) {
  return (
    <div className="matrix-row matrix-text" style={gridStyle}>
      <span>{label}</span>
      {values.map((value, index) => <small key={`${label}-${index}`}>{value}</small>)}
    </div>
  );
}

function MatrixGlyph({ glyph, note }: { glyph: string; note: string }) {
  return (
    <i className={`glyph glyph--${elementClass(glyph)}`}>
      <b>{glyph}</b>
      <small>{note}</small>
    </i>
  );
}

function LuckCell({ top, middle, gz, note, active = false }: { top: string; middle: string; gz: string; note: string; active?: boolean }) {
  return (
    <div className={active ? "luck-cell is-current" : "luck-cell"}>
      <small>{top}</small>
      <em>{middle}</em>
      <b><span className={`text-${elementClass(gz[0])}`}>{gz[0]}</span><span className={`text-${elementClass(gz[1])}`}>{gz[1]}</span></b>
      <i>{note}</i>
    </div>
  );
}

function ReportChapter({ title, children }: { title: string; children: ReactNode }) {
  return <article className="report-chapter"><h2>{title}</h2>{children}</article>;
}

function PatternSection({ profile, chart, strength }: { profile: Profile; chart?: ChartRecord; strength: StrengthProfile }) {
  const dayMaster = chart?.bazi?.dayMaster || profile.pillars.day[0];
  const pattern = getPatternProfile(profile, chart, strength);
  return (
    <section className="section-card">
      <div className="section-title-row">
        <h3>格局</h3>
        <span>i</span>
      </div>
      <div className="pattern-panel">
        <b>{pattern.name}</b>
        <small>{pattern.subtitle}</small>
      </div>
      <p className="soft-note">{pattern.description}</p>
      <div className="related-tags">
        {pattern.tags.map((item) => <span key={item}>{item}</span>)}
      </div>
      <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
    </section>
  );
}

function ElementSection({ stats, useful }: { stats: StatItem[]; useful: UsefulGods }) {
  return (
    <section className="section-card">
      <div className="section-title-row">
        <h3>五行</h3>
        <span>i</span>
      </div>
      <div className="vertical-bars">
        {stats.map((item) => <VerticalBar key={item.key} item={item} />)}
      </div>
      <p className="soft-note">
        五行统计来自天干、地支和藏干权重。当前最需要关注的是{useful.primary.join("、")}，用于平衡命局结构并形成稳定输出。
      </p>
      <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
    </section>
  );
}

function TenGodSection({ stats }: { stats: StatItem[] }) {
  return (
    <section className="section-card">
      <div className="section-title-row">
        <h3>十神</h3>
        <span>i</span>
      </div>
      <div className="vertical-bars vertical-bars--ten">
        {stats.map((item) => <VerticalBar key={item.key} item={item} />)}
      </div>
      <p className="soft-note">
        十神用于观察行动模式、资源来源、表达方式和财官结构。比例越高，说明该类能量越容易在性格和现实选择里显化。
      </p>
      <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
    </section>
  );
}

function VerticalBar({ item }: { item: StatItem }) {
  return (
    <div className="vertical-bar">
      <b>{item.percent}%</b>
      <span><i className={`bar-fill text-${item.element}`} style={{ height: `${Math.max(item.percent, 4)}%` }} /></span>
      <small>{item.label}</small>
    </div>
  );
}

function SpiritSection({ groups }: { groups: Array<{ title: string; items: string[] }> }) {
  return (
    <section className="section-card">
      <div className="section-title-row">
        <h3>神煞</h3>
        <span>i</span>
      </div>
      <div className="spirit-groups">
        {groups.map((group) => (
          <div className="spirit-group" key={group.title}>
            <b>{group.title}</b>
            <div>{group.items.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
        ))}
      </div>
      <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
    </section>
  );
}

function StrengthSection({ dayMaster, strength }: { dayMaster: string; strength: StrengthProfile }) {
  return (
    <section className="section-card strength-card">
      <div className="section-title-row">
        <h3>命局强弱</h3>
        <span>i</span>
      </div>
      <div className={`strength-orb strength-${strength.level}`}>
        <i />
        <b>{getElementName(elementClass(dayMaster))} · {strength.label}</b>
        <small>综合同党、生扶、月令和地支根气估算</small>
      </div>
      <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
    </section>
  );
}

function UsefulGodSection({ useful, profile }: { useful: UsefulGods; profile: Profile }) {
  return (
    <section className="section-card">
      <div className="section-title-row">
        <h3>喜用神</h3>
        <span>i</span>
      </div>
      <div className="useful-grid">
        <div>
          <b>喜</b>
          <p>{useful.primary.join("、")}</p>
        </div>
        <div>
          <b>忌</b>
          <p>{useful.avoid.join("、")}</p>
        </div>
      </div>
      <div className="useful-line">
        <b>喜用神参考</b>
        <span>{useful.primary.map((item) => <i key={item} className={`dot dot-${elementClass(item)}`} />)}</span>
      </div>
      <p className="soft-note">结合当前{profile.fortune}，喜用神会决定职业方向、内容表达、环境选择和年度策略。</p>
      <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
    </section>
  );
}

function YinYangSection({ profile }: { profile: Profile }) {
  const chars = Object.values(profile.pillars).join("");
  const yang = Array.from(chars).filter((char) => "甲丙戊庚壬子寅辰午申戌".includes(char)).length;
  const yin = Math.max(chars.length - yang, 0);
  const percent = Math.round((yang / Math.max(chars.length, 1)) * 100);
  return (
    <section className="section-card yin-card">
      <div className="section-title-row">
        <h3>阴阳</h3>
        <span>i</span>
      </div>
      <div className="yin-wrap">
        <div className="yin-dial" style={{ background: `conic-gradient(#5d5d5d 0 ${percent}%, #efe7dc ${percent}% 100%)` }}><b>{percent}%</b></div>
        <p>阳性 {yang} 个，阴性 {yin} 个。阴阳比例用于观察外放程度、决策速度和情绪调节方式。</p>
      </div>
      <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
    </section>
  );
}

function ZodiacSection({ profile }: { profile: Profile }) {
  const branch = profile.pillars.year[1];
  return (
    <section className="section-card zodiac-card">
      <div className="section-title-row">
        <h3>生肖</h3>
        <span>i</span>
      </div>
      <div className="zodiac-body">
        <span className="large-avatar">玄</span>
        <p><b>{getZodiac(branch)}</b>年出生的人，年柱代表外在身份、早年环境和社会第一印象。结合四柱整体，生肖只做辅助入口，最终仍以完整命盘结构为准。</p>
      </div>
      <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
    </section>
  );
}

function DayPillarSection({ profile, chart }: { profile: Profile; chart?: ChartRecord }) {
  const day = profile.pillars.day;
  const pillar = chart?.bazi?.fourPillars?.day;
  return (
    <section className="section-card">
      <div className="section-title-row">
        <h3>日柱详解</h3>
        <span>i</span>
      </div>
      <div className="day-pillar">
        <b>{day}</b>
        <span>{pillar?.diShi || "长生"}</span>
        <small>{pillar?.naYin || "纳音待排盘"}</small>
      </div>
      <div className="report-mini-table">
        <div><b>十神关系</b><span>{profile.tenGods.day}坐{pillar?.hiddenStems?.map((item) => item.tenGod).join("、") || "藏干待排盘"}</span></div>
        <div><b>日主状态</b><span>{pillar?.diShi || "待排盘"}，用于判断内在稳定性、行动韧性和自我认同。</span></div>
      </div>
      <p className="soft-note">日柱是命主的自我核心，前端展示结构固定，文案由日干、日支、藏干、星运和纳音规则生成。</p>
      <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
    </section>
  );
}

function AdjustSection({ useful }: { useful: UsefulGods }) {
  return (
    <section className="section-card">
      <div className="section-title-row">
        <h3>调候</h3>
        <span>i</span>
      </div>
      <div className="toggle-tabs"><button className="is-active">寒湿</button><button>燥热</button><button>平衡</button></div>
      <p className="soft-note">调候关注命局气候，不只看五行多少。当前建议优先补足{useful.primary.join("、")}相关的环境、职业属性和行为节奏。</p>
      <button className="ask-ai"><Sparkles size={14} />问参天AI</button>
    </section>
  );
}

function FlowSection({ profile, useful }: { profile: Profile; useful: UsefulGods }) {
  const labels = ["年柱", "月柱", "日柱", "时柱"];
  const pillars = Object.values(profile.pillars);
  return (
    <section className="section-card flow-card">
      <div className="section-title-row">
        <h3>阴阳五行流通</h3>
        <span>i</span>
      </div>
      <div className="flow-line">
        {pillars.map((pillar, index) => (
          <div key={`${labels[index]}-${pillar}`}>
            <small>{labels[index]}</small>
            <b className={`text-${elementClass(pillar[0])}`}>{pillar[0]}</b>
            <span className={`text-${elementClass(pillar[1])}`}>{pillar[1]}</span>
          </div>
        ))}
      </div>
      <p className="soft-note">流通图用于观察天干地支之间的生克路径。当前优先让{useful.primary.join("、")}形成稳定通关，再做事业与关系策略。</p>
    </section>
  );
}

function elementClass(glyph: string) {
  if ("甲乙寅卯".includes(glyph)) return "wood";
  if ("丙丁巳午".includes(glyph)) return "fire";
  if ("戊己辰戌丑未".includes(glyph)) return "earth";
  if ("庚辛申酉".includes(glyph)) return "metal";
  if ("壬癸亥子".includes(glyph)) return "water";
  if (glyph === "木") return "wood";
  if (glyph === "火") return "fire";
  if (glyph === "土") return "earth";
  if (glyph === "金") return "metal";
  if (glyph === "水") return "water";
  return "earth";
}

type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";
type StatItem = { key: string; label: string; value: number; percent: number; element: ElementKey };
type StrengthProfile = { score: number; level: "strong" | "balanced" | "weak"; label: string; title: string };
type UsefulGods = { primary: string[]; avoid: string[] };

function getElementStats(profile: Profile, chart?: ChartRecord): StatItem[] {
  const weights: Record<ElementKey, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  Object.values(profile.pillars).forEach((pillar) => {
    addElementWeight(weights, pillar[0], 2);
    addElementWeight(weights, pillar[1], 2);
  });
  Object.values(chart?.bazi?.fourPillars || {}).forEach((pillar) => {
    pillar.hiddenStems?.forEach((stem) => addElementWeight(weights, stem.stem, stem.qiType === "本气" ? 1.2 : .6));
  });
  return normalizeStats([
    ["wood", "木"],
    ["fire", "火"],
    ["earth", "土"],
    ["metal", "金"],
    ["water", "水"]
  ].map(([key, label]) => ({ key, label, value: weights[key as ElementKey], element: key as ElementKey })));
}

function getTenGodStats(profile: Profile, chart?: ChartRecord): StatItem[] {
  const labels = ["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"];
  const counts = Object.fromEntries(labels.map((label) => [label, 0])) as Record<string, number>;
  Object.values(profile.tenGods).forEach((god) => { counts[god] = (counts[god] || 0) + 2; });
  Object.values(chart?.bazi?.fourPillars || {}).forEach((pillar) => {
    if (pillar.tenGod) counts[pillar.tenGod] = (counts[pillar.tenGod] || 0) + 1;
    pillar.hiddenStems?.forEach((stem) => { counts[stem.tenGod] = (counts[stem.tenGod] || 0) + .7; });
  });
  return normalizeStats(labels.map((label) => ({ key: label, label, value: counts[label] || 0, element: tenGodElement(label) })));
}

function normalizeStats<T extends Omit<StatItem, "percent">>(items: T[]): StatItem[] {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  return items.map((item) => ({ ...item, percent: Math.round((item.value / total) * 100) }));
}

function addElementWeight(weights: Record<ElementKey, number>, glyph: string, weight: number) {
  const key = elementClass(glyph) as ElementKey;
  weights[key] += weight;
}

function getStrengthProfile(dayMaster: string, stats: StatItem[]): StrengthProfile {
  const dayElement = elementClass(dayMaster) as ElementKey;
  const support = supportElements(dayElement);
  const score = stats.filter((item) => item.element === dayElement || support.includes(item.element)).reduce((sum, item) => sum + item.percent, 0);
  const level = score >= 58 ? "strong" : score <= 38 ? "weak" : "balanced";
  return {
    score,
    level,
    label: level === "strong" ? "身旺" : level === "weak" ? "身弱" : "中和",
    title: level === "strong" ? "身旺，宜泄耗制化" : level === "weak" ? "身弱，宜生扶护身" : "中和，宜顺势成局"
  };
}

function getUsefulGods(dayMaster: string, level: StrengthProfile["level"]): UsefulGods {
  const dayElement = elementClass(dayMaster) as ElementKey;
  const cycles: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const index = cycles.indexOf(dayElement);
  const produces = cycles[(index + 1) % cycles.length];
  const controls = cycles[(index + 2) % cycles.length];
  const supports = cycles[(index + 4) % cycles.length];
  const primary = level === "strong" ? [getElementName(produces), getElementName(controls)] : level === "weak" ? [getElementName(supports), getElementName(dayElement)] : [getElementName(produces), getElementName(supports)];
  const avoid = level === "strong" ? [getElementName(supports), getElementName(dayElement)] : [getElementName(controls), getElementName(produces)];
  return { primary, avoid };
}

function getShenShaGroups(chart?: ChartRecord) {
  const all = Object.values(chart?.bazi?.fourPillars || {}).flatMap((pillar) => pillar.shenSha || []);
  const unique = Array.from(new Set(all)).filter(Boolean);
  if (!unique.length) {
    return [
      { title: "桃花多多", items: ["桃花", "红艳", "天喜"] },
      { title: "聪明伶俐", items: ["文昌贵人", "太极贵人", "华盖"] },
      { title: "领导才能", items: ["将星"] },
      { title: "贵人相助", items: ["天德贵人", "月德贵人", "福星贵人"] }
    ];
  }
  return [
    { title: "贵人相助", items: unique.filter((item) => item.includes("贵人")).slice(0, 6) },
    { title: "才华气质", items: unique.filter((item) => ["华盖", "文昌", "天喜", "桃花", "红艳"].some((key) => item.includes(key))).slice(0, 6) },
    { title: "行动与权柄", items: unique.filter((item) => ["将星", "驿马", "羊刃", "禄"].some((key) => item.includes(key))).slice(0, 6) },
    { title: "其他提示", items: unique.slice(0, 8) }
  ].map((group) => ({ ...group, items: group.items.length ? group.items : ["待补充"] }));
}

function buildPatternNarrative(profile: Profile, chart: ChartRecord | undefined, strength: StrengthProfile) {
  const dayMaster = chart?.bazi?.dayMaster || profile.pillars.day[0];
  const monthBranch = profile.pillars.month[1];
  return `命主为${dayMaster}日主，生于${monthBranch}月，当前判断为${strength.label}。基本信息页按固定模板展示，但结论来自排盘：四柱、藏干、十神、五行比例、神煞和大运共同决定分析文本。当前处在${profile.fortune}，适合围绕${profile.focus.slice(0, 2).join("、")}建立长期策略。`;
}

function getPatternProfile(profile: Profile, chart: ChartRecord | undefined, strength: StrengthProfile) {
  const dayStem = chart?.bazi?.dayMaster || profile.pillars.day[0];
  const branches = Object.values(profile.pillars).map((pillar) => pillar[1]);
  const monthGod = profile.tenGods.month;
  const hasYangRen = Object.values(chart?.bazi?.fourPillars || {}).some((pillar) => pillar.shenSha?.some((name) => name.includes("羊刃")));
  const hasSevenKill = Object.values(chart?.bazi?.fourPillars || {}).some((pillar) => pillar.tenGod === "七杀" || pillar.hiddenStems?.some((stem) => stem.tenGod === "七杀"));
  const hasWaterCombo = ["申", "子", "辰"].every((branch) => branches.includes(branch));
  const name = hasYangRen && hasSevenKill ? "羊刃格，宜驾杀成权" : hasWaterCombo ? "三合成局，宜顺势疏导" : `${monthGod || strength.label}成格`;
  const tags = Array.from(new Set([
    hasYangRen ? "羊刃" : "月令",
    hasSevenKill ? "七杀" : monthGod,
    hasWaterCombo ? "申子辰三合" : strength.label,
    ...profile.focus
  ].filter(Boolean))).slice(0, 8);
  return {
    name,
    subtitle: `${dayStem}日主 · ${strength.label} · ${profile.fortune}`,
    description: `${name}。此格局来自月令、日主强弱、地支成局、十神透藏和神煞共同判断；适合把旺处转成秩序，把才华与资源落到长期目标上。`,
    tags
  };
}

function getElementName(key: string) {
  return ({ wood: "木", fire: "火", earth: "土", metal: "金", water: "水" } as Record<string, string>)[key] || key;
}

function supportElements(key: ElementKey): ElementKey[] {
  return ({ wood: ["water"], fire: ["wood"], earth: ["fire"], metal: ["earth"], water: ["metal"] } as Record<ElementKey, ElementKey[]>)[key];
}

function tenGodElement(label: string): ElementKey {
  if (["比肩", "劫财"].includes(label)) return "water";
  if (["食神", "伤官"].includes(label)) return "wood";
  if (["偏财", "正财"].includes(label)) return "fire";
  if (["七杀", "正官"].includes(label)) return "earth";
  return "metal";
}

function getZodiac(branch: string) {
  return ({ 子: "鼠", 丑: "牛", 寅: "虎", 卯: "兔", 辰: "龙", 巳: "蛇", 午: "马", 未: "羊", 申: "猴", 酉: "鸡", 戌: "狗", 亥: "猪" } as Record<string, string>)[branch] || "生肖";
}

function ProfileView({ profile, setView }: { profile: Profile; setView: (view: View) => void }) {
  return (
    <section className="profile-view">
      <div className="tabs">
        <button className="is-active"><UserRound size={16} />基本信息</button>
        <button><CalendarDays size={16} />大运流年</button>
        <button><FileText size={16} />2026年度报告</button>
        <button><ClipboardList size={16} />个性报告</button>
      </div>

      <div className="profile-card">
        <div>
          <span className="large-avatar">玄</span>
        </div>
        <div>
          <h1>{profile.nickname}</h1>
          <p>性别：{profile.gender}</p>
          <p>出生地点：{profile.birthplace}</p>
          <p>公历：{profile.birthAt}</p>
          <p>农历：{profile.lunarBirth}</p>
          <p>真太阳时(公历)：{profile.trueSolarTime}</p>
          <button onClick={() => setView("chat")}>一键获取命理指令</button>
        </div>
      </div>

      <div className="chart-table">
        <div className="table-head">
          <span />
          <span>年柱</span>
          <span>月柱</span>
          <span>日柱</span>
          <span>时柱</span>
        </div>
        <ChartRow label="天干" values={[profile.pillars.year[0], profile.pillars.month[0], profile.pillars.day[0], profile.pillars.hour[0]]} notes={[profile.tenGods.year, profile.tenGods.month, profile.tenGods.day, profile.tenGods.hour]} />
        <ChartRow label="地支" values={[profile.pillars.year[1], profile.pillars.month[1], profile.pillars.day[1], profile.pillars.hour[1]]} notes={["正印", "劫财", "偏印", "七杀"]} />
        <ChartRow label="纳音" values={["石榴木", "壁上土", "剑锋金", "覆灯火"]} />
        <ChartRow label="星运" values={["沐浴", "帝旺", "长生", "墓"]} />
      </div>
    </section>
  );
}

function ChartRow({ label, values, notes = [] }: { label: string; values: string[]; notes?: string[] }) {
  return (
    <div className="chart-row">
      <span className="row-label">{label}</span>
      {values.map((value, index) => (
        <span className="chart-cell" key={`${label}-${value}-${index}`}>
          <b>{value}</b>
          {notes[index] && <small>{notes[index]}</small>}
        </span>
      ))}
    </div>
  );
}

function AdminView({
  agents,
  activeAgent,
  setActiveAgent,
  skills,
  agentSkills,
  toggleSkill,
  runtimeError,
  providerStatuses
}: {
  agents: Agent[];
  activeAgent: Agent;
  setActiveAgent: (agent: Agent) => void;
  skills: Skill[];
  agentSkills: Skill[];
  toggleSkill: (skillId: string) => void;
  runtimeError: string;
  providerStatuses: ProviderStatus[];
}) {
  return (
    <section className="admin-view">
      <div className="admin-hero">
        <h1>技能与智能体后台</h1>
        <p>当前已接入本地 API 和 JSON 数据库。后续可把 runtime adapter 换成 Dify、FastGPT 或 LangGraph。</p>
      </div>
      {runtimeError && <div className="runtime-error">{runtimeError}</div>}

      <div className="admin-section">
        <h2>智能体</h2>
        <div className="agent-grid">
          {agents.map((agent) => (
            <button
              className={agent.id === activeAgent.id ? "agent-card is-active" : "agent-card"}
              onClick={() => setActiveAgent(agent)}
              key={agent.id}
            >
              <span>{agent.avatar}</span>
              <b>{agent.name}</b>
              <small>{agent.description}</small>
              <ProviderBadge agent={agent} status={providerStatuses.find((item) => item.agentId === agent.id)} />
            </button>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <h2>Provider 状态</h2>
        <div className="provider-list">
          {agents.map((agent) => (
            <ProviderStatusCard
              agent={agent}
              status={providerStatuses.find((item) => item.agentId === agent.id)}
              key={`${agent.id}-provider`}
            />
          ))}
        </div>
      </div>

      <div className="admin-section">
        <h2>当前智能体编排</h2>
        <div className="pipeline">
          <span>档案上下文</span>
          <span>真实排盘数据</span>
          {agentSkills.map((skill) => (
            <span key={skill.id}>{skill.name}</span>
          ))}
          <span>Markdown 输出</span>
        </div>
      </div>

      <div className="admin-section">
        <h2>档案注入能力</h2>
        <div className="context-list">
          {agents.map((agent) => (
            <article className="context-card" key={`${agent.id}-context`}>
              <b>{agent.name}</b>
              <p>自动注入用户档案、八字四柱、当前大运、真实排盘 chart，并可继续绑定专属 skill。</p>
              <small>{agent.skillIds.length} 个 skill 已绑定</small>
            </article>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <h2>Skill Registry</h2>
        <div className="skill-list">
          {skills.map((skill) => (
            <article className="skill-card" key={skill.id}>
              <div>
                <h3>{skill.name}</h3>
                <p>{skill.description}</p>
                <small>v{skill.version} · 输入：{skill.inputSchema.join(" / ")}</small>
              </div>
              <button className={`status status--${skill.status}`} onClick={() => toggleSkill(skill.id)}>
                {skill.status}
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <h2>预留接口</h2>
        <div className="api-box">
          <code>GET /api/bootstrap</code>
          <code>POST /api/agents/:agentId/run</code>
          <code>POST /api/skills</code>
          <code>POST /api/agents</code>
          <code>POST /api/profiles</code>
          <code>PATCH /api/skills/:skillId</code>
          <code>PATCH /api/skills/:skillId/versions/:version/publish</code>
          <code>POST /api/profiles/:profileId/threads</code>
        </div>
      </div>
    </section>
  );
}

function ProviderBadge({ agent, status }: { agent: Agent; status?: ProviderStatus }) {
  return (
    <small className={status?.ready ? "provider-badge provider-badge--ready" : "provider-badge"}>
      {agent.modelProvider} · {status?.ready ? "ready" : "needs config"}
    </small>
  );
}

function ProviderStatusCard({ agent, status }: { agent: Agent; status?: ProviderStatus }) {
  const config = agent.runtimeConfig || {};

  return (
    <article className="provider-card">
      <div>
        <h3>{agent.name}</h3>
        <p>{agent.modelProvider}</p>
      </div>
      <dl>
        <div>
          <dt>endpoint</dt>
          <dd>{status?.endpointConfigured ? "已配置" : "未配置"}</dd>
        </div>
        <div>
          <dt>api key</dt>
          <dd>{status?.apiKeyConfigured ? "已配置" : config.apiKeyEnv || "不需要"}</dd>
        </div>
        <div>
          <dt>adapter</dt>
          <dd>{status?.adapterImplemented ? "已接入" : "未接入"}</dd>
        </div>
      </dl>
      <b className={status?.ready ? "provider-ready" : "provider-missing"}>
        {status?.ready ? "Ready" : "Needs config"}
      </b>
    </article>
  );
}

function ProfileModal({
  profiles,
  activeProfile,
  setActiveProfile,
  close
}: {
  profiles: Profile[];
  activeProfile: Profile;
  setActiveProfile: (profile: Profile) => void;
  close: () => void;
}) {
  return (
    <div className="modal-layer">
      <section className="profile-modal" role="dialog" aria-modal="true">
        <header>
          <h2>选择八字档案</h2>
          <button className="icon-button" onClick={close}><X size={22} /></button>
        </header>
        <label className="search-box">
          <UserRound size={18} />
          <input placeholder="请输入昵称搜索" />
        </label>
        <div className="modal-list">
          {profiles.map((profile) => (
            <button
              className={profile.id === activeProfile.id ? "modal-profile is-active" : "modal-profile"}
              onClick={() => setActiveProfile(profile)}
              key={profile.id}
            >
              <span className="avatar-sm">玄</span>
              <span>{profile.nickname}</span>
              <small>{profile.fortune}</small>
            </button>
          ))}
        </div>
        <footer>
          <button className="secondary-action"><Plus size={17} />新增档案</button>
          <button className="primary-action" onClick={close}>确定</button>
        </footer>
      </section>
    </div>
  );
}

function Markdown({ content }: { content: string }) {
  return (
    <div
      className="markdown"
      dangerouslySetInnerHTML={{ __html: marked.parse(content, { async: false }) }}
    />
  );
}
