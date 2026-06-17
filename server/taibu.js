function parseBirthAt(birthAt) {
  const match = String(birthAt || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})/);
  if (!match) {
    throw new Error(`Invalid birthAt: ${birthAt}`);
  }

  return {
    birthYear: Number(match[1]),
    birthMonth: Number(match[2]),
    birthDay: Number(match[3]),
    birthHour: Number(match[4]),
    birthMinute: Number(match[5])
  };
}

function genderToTaibu(gender) {
  return gender === "女" || gender === "female" ? "female" : "male";
}

function profileToTaibuInput(profile, overrides = {}) {
  return {
    gender: genderToTaibu(profile.gender),
    ...parseBirthAt(profile.birthAt),
    calendarType: "solar",
    isLeapMonth: false,
    birthPlace: profile.birthplace,
    longitude: profile.longitude,
    detailLevel: "default",
    ...overrides
  };
}

async function executeTaibuTool(name, input) {
  const { executeTool } = await import("taibu-core/mcp");
  return executeTool(name, input);
}

async function calculateProfileCharts(profile) {
  const input = profileToTaibuInput(profile);
  const [bazi, dayun, ziwei] = await Promise.all([
    executeTaibuTool("bazi", input),
    executeTaibuTool("bazi_dayun", input),
    executeTaibuTool("ziwei", input)
  ]);

  return {
    profileId: profile.id,
    calculatedAt: new Date().toISOString(),
    source: "taibu-core/mcp",
    input,
    bazi,
    dayun,
    ziwei
  };
}

function patchProfileFromBazi(profile, bazi, dayun) {
  const pillars = bazi.fourPillars;
  const trueSolar = bazi.trueSolarTimeInfo;
  const currentDayun = findCurrentDayun(dayun);

  return {
    ...profile,
    trueSolarTime: trueSolar ? `${profile.birthAt.slice(0, 10)} ${trueSolar.trueSolarTime}:00` : profile.trueSolarTime,
    pillars: {
      year: `${pillars.year.stem}${pillars.year.branch}`,
      month: `${pillars.month.stem}${pillars.month.branch}`,
      day: `${pillars.day.stem}${pillars.day.branch}`,
      hour: `${pillars.hour.stem}${pillars.hour.branch}`
    },
    tenGods: {
      year: pillars.year.tenGod || "",
      month: pillars.month.tenGod || "",
      day: "日主",
      hour: pillars.hour.tenGod || ""
    },
    fortune: currentDayun ? `${currentDayun.ganZhi}大运（${currentDayun.startYear}-${currentDayun.startYear + 9}）` : profile.fortune
  };
}

function findCurrentDayun(dayun) {
  const year = new Date().getFullYear();
  return dayun.list.find((item) => year >= item.startYear && year <= item.startYear + 9) || dayun.list[0];
}

module.exports = {
  calculateProfileCharts,
  patchProfileFromBazi,
  profileToTaibuInput
};
