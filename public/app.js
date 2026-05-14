const API_BASE = "/api/v1";
const TOKEN_KEY = "blackstack.auth.tokens";

const state = {
  authMode: "login",
  tokens: loadTokens(),
  user: null,
  stats: null,
  statsPeriod: "all",
  sessions: [],
  selectedSessionId: null,
  selectedSession: null,
  sessionHands: [],
  sessionStats: null,
  trainerScenario: null,
  trainerProgress: null,
  trainerFeedback: null,
  trainerFilter: "mix",
  trainerStartedAt: null,
  currentView: "dashboard",
  loading: {
    app: true,
    stats: false,
    session: false,
    trainer: false,
  },
  notices: [],
};

const chartData = {
  hard: {
    21: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    20: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    19: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    18: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    17: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    16: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
    15: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
    14: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
    13: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
    12: ["H", "H", "S", "S", "S", "H", "H", "H", "H", "H"],
    11: ["D", "D", "D", "D", "D", "D", "D", "D", "D", "H"],
    10: ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"],
    9: ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
    8: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
    7: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
    6: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
    5: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  },
  soft: {
    9: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    8: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    7: ["S", "D", "D", "D", "D", "S", "S", "H", "H", "H"],
    6: ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
    5: ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"],
    4: ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"],
    3: ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"],
    2: ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"],
  },
  pair: {
    A: ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"],
    10: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    9: ["P", "P", "P", "P", "P", "S", "P", "P", "S", "S"],
    8: ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"],
    7: ["P", "P", "P", "P", "P", "P", "H", "H", "H", "H"],
    6: ["P", "P", "P", "P", "P", "H", "H", "H", "H", "H"],
    5: ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"],
    4: ["H", "H", "H", "P", "P", "H", "H", "H", "H", "H"],
    3: ["P", "P", "P", "P", "P", "P", "H", "H", "H", "H"],
    2: ["P", "P", "P", "P", "P", "P", "H", "H", "H", "H"],
  },
};

const ui = {
  root: document.querySelector("#app"),
};

init();

async function init() {
  render();
  if (state.tokens?.accessToken) {
    await hydrateApp();
  } else {
    state.loading.app = false;
    render();
  }
}

async function hydrateApp() {
  state.loading.app = true;
  render();

  try {
    const user = await api("/users/me");
    state.user = user;
  } catch (error) {
    clearTokens();
    state.user = null;
    state.stats = null;
    state.sessions = [];
    state.selectedSessionId = null;
    state.selectedSession = null;
    state.sessionHands = [];
    state.sessionStats = null;
    state.trainerProgress = null;
    addNotice(error.message || "Could not load your profile.", "error");
    state.loading.app = false;
    render();
    return;
  }

  await Promise.all([
    loadUserStats(state.statsPeriod, false).catch(() => {
      state.stats = null;
    }),
    api("/sessions").then((sessions) => {
      state.sessions = sessions.data;
      state.selectedSessionId = state.sessions[0]?.id ?? null;
      if (state.selectedSessionId) {
        return loadSessionDetails(state.selectedSessionId);
      } else {
        state.selectedSession = null;
        state.sessionHands = [];
        state.sessionStats = null;
      }
    }).catch(() => {
      state.sessions = [];
      state.selectedSessionId = null;
      state.selectedSession = null;
      state.sessionHands = [];
      state.sessionStats = null;
    }),
    api("/strategy/progress").then((progress) => {
      state.trainerProgress = progress;
    }).catch(() => {
      state.trainerProgress = null;
    }),
  ]);

  state.loading.app = false;
  render();
}

async function loadSessionDetails(sessionId) {
  if (!sessionId) return;
  state.loading.session = true;
  render();

  try {
    const [session, hands, sessionStats] = await Promise.all([
      api(`/sessions/${sessionId}`),
      api(`/sessions/${sessionId}/hands?page=1&pageSize=100`),
      api(`/sessions/${sessionId}/hands/stats`),
    ]);

    state.selectedSessionId = sessionId;
    state.selectedSession = session;
    state.sessionHands = hands.data;
    state.sessionStats = sessionStats;
  } catch (error) {
    addNotice(error.message || "Could not load session details.", "error");
  } finally {
    state.loading.session = false;
    render();
  }
}

function render() {
  ui.root.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <div class="brand-mark">♠</div>
          <div class="brand-copy">
            <h1>BlackStack</h1>
            <p>Responsive web tracker and trainer</p>
          </div>
        </div>
        <div class="topbar-actions">
          ${state.user ? `<span class="pill gold">${escapeHtml(state.user.name)}</span>` : `<span class="pill">Guest</span>`}
          ${state.user ? `<button class="ghost-btn" data-action="logout">Log out</button>` : `<button class="primary-btn" data-action="focus-auth">Get started</button>`}
        </div>
      </div>
    </div>
    <main class="app-shell">
      ${renderNotices()}
      ${state.user ? renderAuthenticatedApp() : renderUnauthedApp()}
    </main>
    ${renderModals()}
  `;

  bindGlobalEvents();
}

function renderNotices() {
  if (!state.notices.length) return "";
  return `<div class="main-column">${state.notices.map((notice, index) => `
    <div class="feedback ${notice.kind}">
      <div class="split-row">
        <span>${escapeHtml(notice.message)}</span>
        <button class="subtle-btn" data-action="dismiss-notice" data-index="${index}">Dismiss</button>
      </div>
    </div>
  `).join("")}</div>`;
}

function renderUnauthedApp() {
  return `
    <section class="hero">
      <div class="hero-grid">
        <div>
          <span class="eyebrow">Track. Train. Play responsibly.</span>
          <h2>A serious blackjack logbook for the real world.</h2>
          <p>
            BlackStack turns the visual direction from the prototypes into a working web application:
            log casino sessions, capture hands in cents, and drill basic strategy with live feedback and progress.
          </p>
          <div class="hero-metrics">
            <div class="metric">
              <label>Track side</label>
              <strong>Sessions, bankroll, hand history</strong>
            </div>
            <div class="metric">
              <label>Learn side</label>
              <strong>Strategy trainer, chart, progress</strong>
            </div>
            <div class="metric">
              <label>Form factor</label>
              <strong>Mobile-first, but fully responsive on desktop</strong>
            </div>
          </div>
        </div>
        <div class="auth-layout">
          <section class="auth-card">
            <span class="eyebrow">Account</span>
            <h2>Sign in to continue</h2>
            <p class="inline-note">
              Use your API-backed account to unlock session history, trainer progress, and bankroll stats.
            </p>
            <div class="auth-tabs">
              <button class="auth-tab ${state.authMode === "login" ? "active" : ""}" data-action="set-auth-mode" data-mode="login">Sign in</button>
              <button class="auth-tab ${state.authMode === "register" ? "active" : ""}" data-action="set-auth-mode" data-mode="register">Register</button>
            </div>
            <form class="auth-form" data-form="auth">
              ${state.authMode === "register" ? `
                <div class="field">
                  <label for="auth-name">Name</label>
                  <input id="auth-name" name="name" type="text" placeholder="Alex Cardcounter" required />
                </div>
              ` : ""}
              <div class="field">
                <label for="auth-email">Email</label>
                <input id="auth-email" name="email" type="email" placeholder="alex@example.com" required />
              </div>
              <div class="field">
                <label for="auth-password">Password</label>
                <input id="auth-password" name="password" type="password" placeholder="SecurePass1" required />
              </div>
              <button class="primary-btn" type="submit">${state.authMode === "login" ? "Sign in" : "Create account"}</button>
            </form>
          </section>
        </div>
      </div>
    </section>
  `;
}

function renderAuthenticatedApp() {
  return `
    <section class="hero">
      <div class="hero-grid">
        <div>
          <span class="eyebrow">Live application</span>
          <h2>${escapeHtml(state.user?.name ?? "Player")}, your game is finally on the web.</h2>
          <p>
            This responsive client is backed by your Express and Prisma API. Dashboard metrics, session flows,
            hand logging, and trainer progress all run against the real application state.
          </p>
        </div>
        <div class="hero-card">
          <label class="muted-label">Current bankroll summary</label>
          <div class="stats-grid">
            ${renderStatCard("Net Profit", formatMoney(state.stats?.netProfit), toneClass(state.stats?.netProfit))}
            ${renderStatCard("ROI", formatPercent(state.stats?.roi), toneClass((state.stats?.roi ?? 0) * 100))}
            ${renderStatCard("Hands Played", formatCount(state.stats?.handsPlayed))}
            ${renderStatCard("Average Bet", formatMoney(state.stats?.averageBet))}
          </div>
        </div>
      </div>
    </section>
    <section class="content-grid">
      <aside class="sidebar">
        <section class="panel">
          <span class="eyebrow">Workspace</span>
          <div class="nav-list">
            ${renderNavButton("dashboard", "Dashboard", "Stats, bankroll, live overview")}
            ${renderNavButton("sessions", "Sessions", "Create, inspect, and complete sessions")}
            ${renderNavButton("trainer", "Trainer", "Drill strategy with real progress")}
            ${renderNavButton("profile", "Profile", "Account snapshot and controls")}
          </div>
        </section>
        <section class="panel">
          <span class="eyebrow">Quick Actions</span>
          <div class="toolbar">
            <button class="primary-btn" data-action="open-modal" data-modal="session-create">New session</button>
            <button class="ghost-btn" data-action="open-modal" data-modal="hand-log" ${state.selectedSession ? "" : "disabled"}>Log hand</button>
            <button class="ghost-btn" data-action="open-modal" data-modal="session-complete" ${state.selectedSession ? "" : "disabled"}>Complete session</button>
          </div>
        </section>
      </aside>
      <section class="main-column">
        ${state.loading.app ? renderLoadingState() : renderCurrentView()}
      </section>
    </section>
  `;
}

function renderCurrentView() {
  if (state.currentView === "dashboard") return renderDashboardView();
  if (state.currentView === "sessions") return renderSessionsView();
  if (state.currentView === "trainer") return renderTrainerView();
  return renderProfileView();
}

function renderDashboardView() {
  const activeSession = state.sessions.find((session) => session.status === "ACTIVE");

  return `
    <section>
      <div class="section-head">
        <div>
          <h2>Dashboard</h2>
          <p>High-signal bankroll numbers, current play activity, and a fast path back into logging or training.</p>
        </div>
        <div class="period-tabs">
          ${renderPeriodTab("all", "All time")}
          ${renderPeriodTab("month", "Month")}
          ${renderPeriodTab("week", "Week")}
          ${renderPeriodTab("year", "Year")}
        </div>
      </div>
      <div class="stats-grid">
        ${renderStatCard("Sessions Played", formatCount(state.stats?.sessionsPlayed))}
        ${renderStatCard("Completed", formatCount(state.stats?.completedSessions))}
        ${renderStatCard("Session Win Rate", formatPercent(state.stats?.completedSessionWinRate), toneClass((state.stats?.completedSessionWinRate ?? 0) * 100))}
        ${renderStatCard("Avg Session Net", formatMoney(state.stats?.averageSessionNet), toneClass(state.stats?.averageSessionNet))}
      </div>
    </section>
    <section class="dashboard-grid">
      <article class="session-card dashboard-spotlight">
        <div class="section-head">
          <div>
            <h2>Current Focus</h2>
            <p>Jump straight back into the table session or strategy drill that matters right now.</p>
          </div>
          <span class="pill gold">Live</span>
        </div>
        ${activeSession ? `
          <div class="focus-stack">
            <div class="focus-card">
              <label class="muted-label">Active Session</label>
              <h3>${escapeHtml(activeSession.casinoName)}</h3>
              <p>${formatDateTime(activeSession.startedAt)} · ${activeSession.decks}-deck table · ${formatMoney(activeSession.tableMin)} minimum</p>
              <div class="detail-grid compact">
                ${renderDetailStat("Buy-In", formatMoney(activeSession.buyIn))}
                ${renderDetailStat("Hands", formatCount(activeSession.handsPlayed))}
              </div>
              <div class="toolbar">
                <button class="primary-btn" data-action="select-session" data-session-id="${activeSession.id}">Open session</button>
                <button class="ghost-btn" data-action="open-hand-log" data-session-id="${activeSession.id}">Log hand</button>
              </div>
            </div>
          </div>
        ` : `
          <div class="focus-stack">
            <div class="focus-card">
              <label class="muted-label">No Active Session</label>
              <h3>Ready for the next casino visit</h3>
              <p>Create a new session when you sit down, or spend a few reps in the trainer before your next table.</p>
              <div class="toolbar">
                <button class="primary-btn" data-action="open-modal" data-modal="session-create">Start session</button>
                <button class="ghost-btn" data-action="switch-view" data-view="trainer">Train first</button>
              </div>
            </div>
          </div>
        `}
      </article>
      <article class="session-card dashboard-actions">
        <div class="section-head">
          <div>
            <h2>Quick Actions</h2>
            <p>Keep the most common bankroll and practice flows one click away.</p>
          </div>
        </div>
        <div class="action-stack">
          <button class="nav-btn quick-action" data-action="open-modal" data-modal="session-create">
            <span>New Session</span>
            <small>Capture table limits, buy-in, and notes before you start.</small>
          </button>
          <button class="nav-btn quick-action" data-action="switch-view" data-view="sessions">
            <span>Review Sessions</span>
            <small>Inspect recent results, complete open sessions, and audit hand history.</small>
          </button>
          <button class="nav-btn quick-action" data-action="switch-view" data-view="trainer">
            <span>Run Trainer</span>
            <small>Drill hard totals, soft totals, and pairs against your live progress data.</small>
          </button>
        </div>
      </article>
    </section>
    <section class="sessions-grid dashboard-lower-grid">
      <article class="session-card">
        <div class="section-head">
          <div>
            <h2>Recent Sessions</h2>
            <p>The latest bankroll entries, sorted from newest to oldest.</p>
          </div>
          <button class="ghost-btn" data-action="switch-view" data-view="sessions">Open workspace</button>
        </div>
        <div class="session-list">
          ${state.sessions.length ? state.sessions.slice(0, 4).map(renderSessionRow).join("") : renderEmptyCard("No sessions yet", "Create your first session to start building a bankroll history.")}
        </div>
      </article>
      <article class="session-card">
        <div class="section-head">
          <div>
            <h2>Period Snapshot</h2>
            <p>${describeStatsWindow()} with bankroll performance and hands efficiency in one place.</p>
          </div>
          ${state.loading.stats ? `<span class="pill">Refreshing</span>` : `<span class="pill gold">${formatPeriodLabel(state.stats?.period ?? state.statsPeriod)}</span>`}
        </div>
        <div class="trainer-stats-grid">
          ${renderDetailStat("Hands Won", formatCount(state.stats?.handsWon))}
          ${renderDetailStat("Win Rate", formatPercent(state.stats?.winRate), toneClass((state.stats?.winRate ?? 0) * 100))}
          ${renderDetailStat("Total Payout", formatMoney(state.stats?.totalPayout), toneClass(state.stats?.totalPayout))}
          ${renderDetailStat("Average Bet", formatMoney(state.stats?.averageBet))}
        </div>
        <p class="helper">
          ${state.stats?.windowStart ? `Window started: ${formatDateTime(state.stats.windowStart)}` : "Showing your full recorded history so far."}
        </p>
      </article>
    </section>
    <section class="sessions-grid dashboard-lower-grid">
      <article class="session-card">
        <div class="section-head">
          <div>
            <h2>Casino Breakdown</h2>
            <p>Your strongest and weakest rooms in the current window.</p>
          </div>
        </div>
        <div class="session-list">
          ${state.stats?.topCasinos?.length ? state.stats.topCasinos.map(renderCasinoBreakdownRow).join("") : renderEmptyCard("No completed sessions yet", "Finish a few sessions to see which casinos are driving your bankroll results.")}
        </div>
      </article>
      <article class="session-card">
        <div class="section-head">
          <div>
            <h2>Trainer Snapshot</h2>
            <p>Your current pace and accuracy across basic strategy attempts.</p>
          </div>
          <button class="ghost-btn" data-action="switch-view" data-view="trainer">Open trainer</button>
        </div>
        <div class="trainer-stats-grid">
          ${renderDetailStat("Attempts", formatCount(state.trainerProgress?.attempts))}
          ${renderDetailStat("Correct", formatCount(state.trainerProgress?.correct))}
          ${renderDetailStat("Accuracy", formatPercent(state.trainerProgress?.accuracy))}
          ${renderDetailStat("Avg Response", formatDuration(state.trainerProgress?.averageResponseTimeMs))}
        </div>
        <p class="helper">
          ${state.trainerProgress?.lastAttemptAt ? `Last attempt: ${formatDateTime(state.trainerProgress.lastAttemptAt)}` : "No strategy attempts yet. Start with a random scenario to build the streak."}
        </p>
      </article>
    </section>
  `;
}

function renderSessionsView() {
  return `
    <section class="sessions-grid">
      <article class="session-card">
        <div class="section-head">
          <div>
            <h2>Sessions</h2>
            <p>Track casino visits, buy-ins, table conditions, and completion status.</p>
          </div>
          <button class="primary-btn" data-action="open-modal" data-modal="session-create">New session</button>
        </div>
        <div class="session-list">
          ${state.sessions.length ? state.sessions.map(renderSessionRow).join("") : renderEmptyCard("No sessions found", "Create a session to unlock hand logging and bankroll stats.")}
        </div>
      </article>
      <article class="session-card">
        ${state.loading.session ? `
          <div class="empty-state">
            <h3>Loading session</h3>
            <p>Pulling hands, session metrics, and table details from the API.</p>
          </div>
        ` : state.selectedSession ? renderSessionDetail() : renderEmptyCard("Choose a session", "Select a session from the list to inspect it, log hands, or complete it.")}
      </article>
    </section>
  `;
}

function renderSessionDetail() {
  const session = state.selectedSession;
  const netProfit = session.cashOut === null ? null : session.cashOut - session.buyIn;
  return `
    <div class="section-head">
      <div>
        <h2>${escapeHtml(session.casinoName)}</h2>
        <p>${formatDateTime(session.startedAt)} · ${session.status.toLowerCase()} session · ${session.decks}-deck table</p>
      </div>
      <div class="toolbar">
        <span class="pill ${session.status === "ACTIVE" ? "gold" : "success"}">${session.status}</span>
        <button class="ghost-btn" data-action="open-modal" data-modal="hand-log">Log hand</button>
      </div>
    </div>
    <div class="detail-grid">
      ${renderDetailStat("Buy-In", formatMoney(session.buyIn))}
      ${renderDetailStat("Cash-Out", session.cashOut === null ? "Open" : formatMoney(session.cashOut), toneClass(netProfit))}
      ${renderDetailStat("Table Range", `${formatMoney(session.tableMin)} - ${formatMoney(session.tableMax)}`)}
      ${renderDetailStat("Net Profit", netProfit === null ? "Pending" : formatMoney(netProfit), toneClass(netProfit))}
      ${renderDetailStat("Hands Played", formatCount(state.sessionStats?.handsPlayed ?? session.handsPlayed))}
      ${renderDetailStat("Win Rate", formatPercent(state.sessionStats?.winRate))}
    </div>
    ${session.notes ? `<div class="feedback info"><strong>Notes</strong><br />${escapeHtml(session.notes)}</div>` : ""}
    <div class="split-row">
      <h3 class="panel-title">Hand History</h3>
      <div class="toolbar">
        ${session.status === "ACTIVE" ? `<button class="ghost-btn" data-action="open-modal" data-modal="session-complete">Complete session</button>` : ""}
      </div>
    </div>
    <div class="hand-list">
      ${state.sessionHands.length ? state.sessionHands.map(renderHandRow).join("") : renderEmptyCard("No hands logged yet", "Use the hand logger to start building your session history.")}
    </div>
  `;
}

function renderTrainerView() {
  return `
    <section class="trainer-layout">
      <article class="trainer-card trainer-board">
        <div class="section-head">
          <div>
            <h2>Strategy Trainer</h2>
            <p>Pull a live scenario from the API, answer it, and record progress in your real account.</p>
          </div>
          <button class="primary-btn" data-action="new-scenario">Deal hand</button>
        </div>
        <div class="chip-row">
          ${renderTrainerFilter("mix", "All hands")}
          ${renderTrainerFilter("hard", "Hard")}
          ${renderTrainerFilter("soft", "Soft")}
          ${renderTrainerFilter("pair", "Pairs")}
        </div>
        <div class="trainer-stats-grid">
          ${renderDetailStat("Attempts", formatCount(state.trainerProgress?.attempts))}
          ${renderDetailStat("Correct", formatCount(state.trainerProgress?.correct))}
          ${renderDetailStat("Accuracy", formatPercent(state.trainerProgress?.accuracy))}
          ${renderDetailStat("Avg Time", formatDuration(state.trainerProgress?.averageResponseTimeMs))}
          ${renderDetailStat("Current Streak", formatCount(state.trainerProgress?.currentStreak))}
          ${renderDetailStat("Best Streak", formatCount(state.trainerProgress?.bestStreak))}
        </div>
        <div class="board-surface">
          ${state.loading.trainer ? `
            <div class="empty-state">
              <h3>Dealing…</h3>
              <p>Fetching a strategy scenario from the live backend.</p>
            </div>
          ` : state.trainerScenario ? renderScenarioBoard() : `
            <div class="empty-state">
              <h3>Ready to train</h3>
              <p>Fetch a random hand to start drilling the strategy engine you already built on the backend.</p>
            </div>
          `}
        </div>
        ${state.trainerFeedback ? renderTrainerFeedback() : ""}
        <div class="session-card">
          <div class="section-head">
            <div>
              <h2>Review Queue</h2>
              <p>Missed hands are resurfaced here so you can retake them on purpose.</p>
            </div>
          </div>
          <div class="session-list">
            ${state.trainerProgress?.recentMistakes?.length ? state.trainerProgress.recentMistakes.map(renderTrainerMistakeRow).join("") : renderEmptyCard("No mistakes in queue", "Once you miss a strategy hand, it will show up here with a quick path back into review.")}
          </div>
        </div>
      </article>
      <aside class="trainer-card trainer-aside">
        <div class="section-head">
          <div>
            <h2>Reference</h2>
            <p>Quick-glance basic strategy chart from the same rules used to seed the API.</p>
          </div>
        </div>
        <div class="feedback info">
          <strong>Reading the chart</strong>
          <p>Use the filter to focus your reps, then compare the action codes against the chart only after you commit to an answer.</p>
        </div>
        ${renderChartPreview()}
      </aside>
    </section>
  `;
}

function renderScenarioBoard() {
  const scenario = state.trainerScenario;
  const firstCard = scenario?.playerCards?.[0];
  const handLabel = scenario.isPair
    ? (firstCard ? `Pair of ${firstCard}s` : "Pair hand")
    : scenario.isSoft
      ? `Soft ${scenario.playerTotal}`
      : `Hard ${scenario.playerTotal}`;

  return `
    <div class="board-row">
      <h3>Dealer Shows</h3>
      <div class="cards-row">
        <div class="playing-card">${escapeHtml(scenario.dealerUpcard)}</div>
        <div class="playing-card">?</div>
      </div>
    </div>
    <div class="board-row">
      <h3>Your Hand</h3>
      <strong>${escapeHtml(handLabel)}</strong>
      <div class="cards-row">
        ${scenario.playerCards.map((card) => `<div class="playing-card">${escapeHtml(card)}</div>`).join("")}
      </div>
    </div>
    <div class="trainer-actions">
      ${["HIT", "STAND", "DOUBLE", "SPLIT", "SURRENDER"].map((action) => `
        <button class="trainer-action" data-action="submit-attempt" data-value="${action}">${action}</button>
      `).join("")}
    </div>
  `;
}

function renderTrainerFeedback() {
  const feedback = state.trainerFeedback;
  return `
    <div class="feedback ${feedback.correct ? "success" : "error"}">
      <strong>${feedback.correct ? "Correct play." : `Best play: ${feedback.correctAction}`}</strong>
      <p>${escapeHtml(feedback.reasoning)}</p>
      <p class="helper"><strong>Rule of thumb:</strong> ${escapeHtml(feedback.ruleOfThumb)}</p>
      <div class="toolbar">
        <button class="primary-btn" data-action="new-scenario">Next hand</button>
      </div>
    </div>
  `;
}

function renderTrainerMistakeRow(mistake) {
  return `
    <div class="session-row">
      <div class="row-top">
        <div>
          <div class="session-title">${escapeHtml(getScenarioLabel(mistake.scenario))}</div>
          <div class="helper">Dealer ${escapeHtml(mistake.scenario.dealerUpcard)} · missed ${formatCount(mistake.timesMissed)} time${mistake.timesMissed === 1 ? "" : "s"} · last ${formatDateTime(mistake.attemptedAt)}</div>
        </div>
        <strong class="money-negative">${escapeHtml(shortActionLabel(mistake.action))}</strong>
      </div>
      <div class="row-bottom">
        <span>Correct ${escapeHtml(shortActionLabel(mistake.correctAction))}</span>
        <span>Difficulty ${formatCount(mistake.scenario.difficulty)}</span>
        <button class="ghost-btn" data-action="review-scenario" data-scenario-id="${mistake.scenarioId}">Review hand</button>
      </div>
    </div>
  `;
}

function renderProfileView() {
  return `
    <section class="profile-grid">
      <article class="profile-card">
        <div class="section-head">
          <div>
            <h2>Profile</h2>
            <p>Identity, bankroll summary, and the current account-level API data.</p>
          </div>
          <button class="ghost-btn" data-action="open-modal" data-modal="profile-edit">Edit profile</button>
        </div>
        <div class="detail-grid">
          ${renderDetailStat("Name", escapeHtml(state.user?.name ?? "—"))}
          ${renderDetailStat("Email", escapeHtml(state.user?.email ?? "—"))}
          ${renderDetailStat("Role", escapeHtml(state.user?.role ?? "USER"))}
          ${renderDetailStat("Joined", state.user?.createdAt ? formatDateTime(state.user.createdAt) : "—")}
        </div>
      </article>
      <article class="profile-card">
        <div class="section-head">
          <div>
            <h2>Bankroll Health</h2>
            <p>Overall performance derived from the live `/users/me/stats` endpoint.</p>
          </div>
        </div>
        <div class="detail-grid">
          ${renderDetailStat("Total Buy-In", formatMoney(state.stats?.totalBuyIn))}
          ${renderDetailStat("Completed Buy-In", formatMoney(state.stats?.completedBuyIn))}
          ${renderDetailStat("Total Cash-Out", formatMoney(state.stats?.totalCashOut))}
          ${renderDetailStat("Hands Won", formatCount(state.stats?.handsWon))}
        </div>
      </article>
    </section>
  `;
}

function renderChartPreview() {
  return `
    <div class="charts-grid">
      ${renderChartSection("Hard Hands", chartData.hard, Object.keys(chartData.hard).reverse())}
      ${renderChartSection("Soft Hands", chartData.soft, Object.keys(chartData.soft).reverse(), true)}
      ${renderChartSection("Pairs", chartData.pair, Object.keys(chartData.pair))}
      <div class="chart-card">
        <span class="eyebrow">Legend</span>
        <div class="chart-legend">
          ${renderLegendChip("H", "#b86a3c", "Hit")}
          ${renderLegendChip("S", "#72b58a", "Stand")}
          ${renderLegendChip("D", "#d4af6a", "Double")}
          ${renderLegendChip("P", "#8d6cca", "Split")}
          ${renderLegendChip("R", "#de7c7c", "Surrender")}
        </div>
      </div>
    </div>
  `;
}

function renderChartSection(title, table, keys, isSoft = false) {
  const columns = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];
  return `
    <div class="chart-card">
      <span class="eyebrow">${title}</span>
      <div class="chart-table">
        <table>
          <thead>
            <tr>
              <th>Hand</th>
              ${columns.map((column) => `<th>${column}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${keys.map((key) => `
              <tr>
                <td>${isSoft ? `A,${key}` : key.includes ? key : key}</td>
                ${table[key].map((value) => `<td>${value}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderLegendChip(code, color, label) {
  return `<span class="legend-chip"><span class="legend-swatch" style="background:${color}"></span>${code} · ${label}</span>`;
}

function renderLoadingState() {
  return `
    <div class="empty-state">
      <h3>Loading application</h3>
      <p>Hydrating the dashboard, sessions, and trainer progress from the backend.</p>
    </div>
  `;
}

function renderSessionRow(session) {
  const netProfit = session.netProfit;
  return `
    <button class="session-row ${session.id === state.selectedSessionId ? "active" : ""}" data-action="select-session" data-session-id="${session.id}">
      <div class="row-top">
        <div>
          <div class="session-title">${escapeHtml(session.casinoName)}</div>
          <div class="helper">${formatDateTime(session.startedAt)} · ${session.decks}-deck · ${formatMoney(session.tableMin)} min</div>
        </div>
        <span class="pill ${session.status === "ACTIVE" ? "gold" : "success"}">${session.status}</span>
      </div>
      <div class="row-bottom">
        <span>${formatMoney(session.buyIn)} buy-in</span>
        <strong class="${toneClass(netProfit)}">${netProfit === null ? "Open" : formatMoney(netProfit)}</strong>
      </div>
    </button>
  `;
}

function renderCasinoBreakdownRow(casino) {
  return `
    <div class="session-row">
      <div class="row-top">
        <div>
          <div class="session-title">${escapeHtml(casino.casinoName)}</div>
          <div class="helper">${formatCount(casino.sessionsPlayed)} sessions · ${formatCount(casino.completedSessions)} completed · ${formatCount(casino.handsPlayed)} hands</div>
        </div>
        <strong class="${toneClass(casino.netProfit)}">${formatMoney(casino.netProfit)}</strong>
      </div>
      <div class="row-bottom">
        <span>ROI ${formatPercent(casino.roi)}</span>
        <span>Win rate ${formatPercent(casino.winRate)}</span>
        <span>Avg net ${formatMoney(casino.averageSessionNet)}</span>
      </div>
    </div>
  `;
}

function renderHandRow(hand) {
  return `
    <div class="hand-row">
      <div class="row-top">
        <div>
          <div class="session-title">Hand #${hand.handNumber}</div>
          <div class="helper">${hand.result} · ${hand.playerCards.join(", ")} vs ${hand.dealerCards.join(", ")}</div>
        </div>
        <strong class="${toneClass(hand.payout)}">${formatMoney(hand.payout)}</strong>
      </div>
      <div class="row-bottom">
        <span>Bet ${formatMoney(hand.bet)}</span>
        <span>Total ${hand.playerTotal} vs ${hand.dealerTotal}</span>
      </div>
    </div>
  `;
}

function renderStatCard(label, value, className = "") {
  return `
    <article class="stat-card">
      <label class="muted-label">${label}</label>
      <p class="stat-value ${className}">${value ?? "—"}</p>
    </article>
  `;
}

function renderDetailStat(label, value, className = "") {
  return `
    <div class="detail-item">
      <label class="muted-label">${label}</label>
      <strong class="${className}">${value ?? "—"}</strong>
    </div>
  `;
}

function renderNavButton(view, title, subtitle) {
  return `
    <button class="nav-btn ${state.currentView === view ? "active" : ""}" data-action="switch-view" data-view="${view}">
      <span>${title}</span>
      <small>${subtitle}</small>
    </button>
  `;
}

function renderPeriodTab(period, label) {
  return `
    <button class="tab-btn ${state.statsPeriod === period ? "active" : ""}" data-action="set-stats-period" data-period="${period}" ${state.loading.stats ? "disabled" : ""}>${label}</button>
  `;
}

function renderTrainerFilter(key, label) {
  return `
    <button class="action-chip ${state.trainerFilter === key ? "active" : ""}" data-action="set-trainer-filter" data-filter="${key}">
      ${label}
    </button>
  `;
}

function renderEmptyCard(title, copy) {
  return `
    <div class="empty-state">
      <h3>${title}</h3>
      <p>${copy}</p>
    </div>
  `;
}

function renderModals() {
  return `
    ${renderModal("session-create", "Create a Session", "Log the table conditions before you sit down.", renderSessionCreateForm())}
    ${renderModal("session-complete", "Complete Session", "Close out the session with a final cash-out value.", renderCompleteSessionForm())}
    ${renderModal("hand-log", "Log a Hand", "Capture bet sizing, outcome, cards, and payout in cents.", renderHandForm())}
    ${renderModal("profile-edit", "Edit Profile", "Update the basics tied to your account.", renderProfileForm())}
  `;
}

function renderModal(id, title, copy, body) {
  return `
    <div class="modal-backdrop" data-modal="${id}">
      <div class="modal">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">${title}</h2>
            <p>${copy}</p>
          </div>
          <button class="modal-close" data-action="close-modal" data-modal="${id}">✕</button>
        </div>
        ${body}
      </div>
    </div>
  `;
}

function renderSessionCreateForm() {
  return `
    <form class="surface-form" data-form="create-session">
      <div class="field-grid">
        <div class="field">
          <label for="session-casino">Casino</label>
          <input id="session-casino" name="casinoName" type="text" placeholder="Bellagio" required />
        </div>
        <div class="field">
          <label for="session-decks">Decks</label>
          <input id="session-decks" name="decks" type="number" min="1" value="6" required />
        </div>
        <div class="field">
          <label for="session-min">Table Min ($)</label>
          <input id="session-min" name="tableMin" type="number" min="0" step="1" value="25" required />
        </div>
        <div class="field">
          <label for="session-max">Table Max ($)</label>
          <input id="session-max" name="tableMax" type="number" min="0" step="1" value="200" required />
        </div>
        <div class="field">
          <label for="session-buyin">Buy-In ($)</label>
          <input id="session-buyin" name="buyIn" type="number" min="0" step="1" value="300" required />
        </div>
      </div>
      <div class="field">
        <label for="session-notes">Notes</label>
        <textarea id="session-notes" name="notes" placeholder="Table energy, focus level, goals for the session."></textarea>
      </div>
      <button class="primary-btn" type="submit">Create session</button>
    </form>
  `;
}

function renderCompleteSessionForm() {
  return `
    <form class="surface-form" data-form="complete-session">
      <div class="field">
        <label for="complete-cashout">Cash-Out ($)</label>
        <input id="complete-cashout" name="cashOut" type="number" min="0" step="1" required />
      </div>
      <button class="primary-btn" type="submit">Complete session</button>
    </form>
  `;
}

function renderHandForm() {
  return `
    <form class="surface-form" data-form="log-hand">
      <div class="field-grid">
        <div class="field">
          <label for="hand-bet">Bet ($)</label>
          <input id="hand-bet" name="bet" type="number" min="0" step="1" required />
        </div>
        <div class="field">
          <label for="hand-result">Result</label>
          <select id="hand-result" name="result">
            <option>WIN</option>
            <option>LOSS</option>
            <option>PUSH</option>
            <option>BLACKJACK</option>
            <option>SURRENDER</option>
          </select>
        </div>
        <div class="field">
          <label for="hand-player-total">Player Total</label>
          <input id="hand-player-total" name="playerTotal" type="number" min="1" max="21" required />
        </div>
        <div class="field">
          <label for="hand-dealer-total">Dealer Total</label>
          <input id="hand-dealer-total" name="dealerTotal" type="number" min="1" max="21" required />
        </div>
        <div class="field">
          <label for="hand-payout">Payout ($ net)</label>
          <input id="hand-payout" name="payout" type="number" step="1" required />
        </div>
      </div>
      <div class="field-grid">
        <div class="field">
          <label for="hand-player-cards">Player Cards</label>
          <input id="hand-player-cards" name="playerCards" type="text" placeholder="A,K" required />
        </div>
        <div class="field">
          <label for="hand-dealer-cards">Dealer Cards</label>
          <input id="hand-dealer-cards" name="dealerCards" type="text" placeholder="9,7" required />
        </div>
      </div>
      <div class="field-grid">
        <div class="field">
          <label><input type="checkbox" name="splitHand" /> Split hand</label>
        </div>
        <div class="field">
          <label><input type="checkbox" name="doubled" /> Doubled</label>
        </div>
        <div class="field">
          <label><input type="checkbox" name="surrendered" /> Surrendered</label>
        </div>
      </div>
      <button class="primary-btn" type="submit">Save hand</button>
    </form>
  `;
}

function renderProfileForm() {
  return `
    <form class="surface-form" data-form="update-profile">
      <div class="field-grid">
        <div class="field">
          <label for="profile-name">Name</label>
          <input id="profile-name" name="name" type="text" value="${escapeHtml(state.user?.name ?? "")}" required />
        </div>
        <div class="field">
          <label for="profile-email">Email</label>
          <input id="profile-email" name="email" type="email" value="${escapeHtml(state.user?.email ?? "")}" required />
        </div>
      </div>
      <button class="primary-btn" type="submit">Save profile</button>
    </form>
  `;
}

function bindGlobalEvents() {
  document.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", onActionClick);
  });

  document.querySelectorAll("[data-form]").forEach((form) => {
    form.addEventListener("submit", onFormSubmit);
  });
}

async function onActionClick(event) {
  const action = event.currentTarget.dataset.action;

  if (action === "set-auth-mode") {
    state.authMode = event.currentTarget.dataset.mode;
    render();
    return;
  }

  if (action === "switch-view") {
    state.currentView = event.currentTarget.dataset.view;
    render();
    if (state.currentView === "trainer" && !state.trainerScenario && !state.loading.trainer) {
      await loadTrainerScenario();
    }
    return;
  }

  if (action === "set-stats-period") {
    const period = event.currentTarget.dataset.period;
    if (!period || period === state.statsPeriod) return;
    await loadUserStats(period);
    return;
  }

  if (action === "open-modal") {
    openModal(event.currentTarget.dataset.modal);
    return;
  }

  if (action === "close-modal") {
    closeModal(event.currentTarget.dataset.modal);
    return;
  }

  if (action === "logout") {
    await logoutUser();
    return;
  }

  if (action === "focus-auth") {
    document.querySelector("#auth-email")?.focus();
    return;
  }

  if (action === "select-session") {
    state.currentView = "sessions";
    render();
    await loadSessionDetails(event.currentTarget.dataset.sessionId);
    return;
  }

  if (action === "open-hand-log") {
    const sessionId = event.currentTarget.dataset.sessionId;
    if (!sessionId) return;
    state.currentView = "sessions";
    render();
    await loadSessionDetails(sessionId);
    openModal("hand-log");
    return;
  }

  if (action === "new-scenario") {
    await loadTrainerScenario();
    return;
  }

  if (action === "review-scenario") {
    const scenarioId = event.currentTarget.dataset.scenarioId;
    if (!scenarioId) return;
    state.currentView = "trainer";
    await loadTrainerScenarioById(scenarioId);
    return;
  }

  if (action === "set-trainer-filter") {
    state.trainerFilter = event.currentTarget.dataset.filter;
    state.trainerFeedback = null;
    render();
    await loadTrainerScenario();
    return;
  }

  if (action === "submit-attempt") {
    await submitTrainerAttempt(event.currentTarget.dataset.value);
    return;
  }

  if (action === "dismiss-notice") {
    state.notices.splice(Number(event.currentTarget.dataset.index), 1);
    render();
  }
}

async function onFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formName = form.dataset.form;
  const formData = new FormData(form);

  try {
    if (formName === "auth") {
      await submitAuth(formData);
      return;
    }

    if (formName === "create-session") {
      await createSession(formData);
      closeModal("session-create");
      return;
    }

    if (formName === "complete-session") {
      await completeSession(formData);
      closeModal("session-complete");
      return;
    }

    if (formName === "log-hand") {
      await logHand(formData);
      closeModal("hand-log");
      return;
    }

    if (formName === "update-profile") {
      await updateProfile(formData);
      closeModal("profile-edit");
    }
  } catch (error) {
    addNotice(error.message || "Something went wrong.", "error");
  }
}

async function submitAuth(formData) {
  const payload = {
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || ""),
  };

  const endpoint = state.authMode === "login" ? "/auth/login" : "/auth/register";
  if (state.authMode === "register") {
    payload.name = String(formData.get("name") || "").trim();
  }

  const data = await api(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);

  persistTokens(data);
  addNotice(state.authMode === "login" ? "Signed in successfully." : "Account created successfully.", "success");
  await hydrateApp();
}

async function logoutUser() {
  try {
    if (state.tokens?.accessToken) {
      await api("/auth/logout", { method: "POST" });
    }
  } catch {
    // Logout is currently stateless on the server; local token cleanup still matters.
  }

  clearTokens();
  state.user = null;
  state.stats = null;
  state.sessions = [];
  state.selectedSessionId = null;
  state.selectedSession = null;
  state.sessionHands = [];
  state.sessionStats = null;
  state.trainerProgress = null;
  state.trainerScenario = null;
  state.trainerFeedback = null;
  state.currentView = "dashboard";
  addNotice("Signed out.", "success");
  render();
}

async function createSession(formData) {
  const payload = {
    casinoName: String(formData.get("casinoName") || "").trim(),
    tableMin: dollarsToCents(formData.get("tableMin")),
    tableMax: dollarsToCents(formData.get("tableMax")),
    decks: Number(formData.get("decks")),
    buyIn: dollarsToCents(formData.get("buyIn")),
    notes: String(formData.get("notes") || "").trim() || undefined,
  };

  const data = await api("/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  state.sessions.unshift({ ...data, netProfit: null });
  state.selectedSessionId = data.id;
  state.currentView = "sessions";
  addNotice(`Created session at ${data.casinoName}.`, "success");
  await hydrateApp();
}

async function completeSession(formData) {
  if (!state.selectedSessionId) {
    throw new Error("Choose a session first.");
  }

  await api(`/sessions/${state.selectedSessionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      cashOut: dollarsToCents(formData.get("cashOut")),
      status: "COMPLETED",
    }),
  });

  addNotice("Session completed.", "success");
  state.currentView = "sessions";
  await hydrateApp();
}

async function logHand(formData) {
  if (!state.selectedSessionId) {
    throw new Error("Choose a session first.");
  }

  const payload = {
    bet: dollarsToCents(formData.get("bet")),
    result: String(formData.get("result") || "PUSH"),
    playerCards: parseCards(formData.get("playerCards")),
    dealerCards: parseCards(formData.get("dealerCards")),
    playerTotal: Number(formData.get("playerTotal")),
    dealerTotal: Number(formData.get("dealerTotal")),
    payout: dollarsToCents(formData.get("payout")),
    splitHand: Boolean(formData.get("splitHand")),
    doubled: Boolean(formData.get("doubled")),
    surrendered: Boolean(formData.get("surrendered")),
  };

  await api(`/sessions/${state.selectedSessionId}/hands`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  addNotice("Hand saved.", "success");
  state.currentView = "sessions";
  await loadSessionDetails(state.selectedSessionId);
  const [stats] = await Promise.all([loadUserStats(state.statsPeriod, false)]);
  state.stats = stats;
  render();
}

async function loadUserStats(period = state.statsPeriod, shouldRender = true) {
  state.loading.stats = true;
  if (shouldRender) render();

  try {
    const query = period !== "all" ? `?period=${period}` : "";
    const stats = await api(`/users/me/stats${query}`);
    state.stats = stats;
    state.statsPeriod = period;
    return stats;
  } catch (error) {
    if (shouldRender) {
      addNotice(error.message || "Could not refresh bankroll analytics.", "error");
    }
    throw error;
  } finally {
    state.loading.stats = false;
    if (shouldRender) render();
  }
}

async function updateProfile(formData) {
  const user = await api("/users/me", {
    method: "PATCH",
    body: JSON.stringify({
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
    }),
  });

  state.user = user;
  addNotice("Profile updated.", "success");
  render();
}

async function loadTrainerScenario() {
  state.loading.trainer = true;
  state.trainerFeedback = null;
  state.trainerStartedAt = null;
  render();

  try {
    const query = buildTrainerQuery();
    state.trainerScenario = await api(`/strategy/scenarios/random${query}`);
    state.trainerStartedAt = Date.now();
  } catch (error) {
    addNotice(error.message || "Could not load a trainer scenario.", "error");
  } finally {
    state.loading.trainer = false;
    render();
  }
}

async function loadTrainerScenarioById(scenarioId) {
  state.loading.trainer = true;
  state.trainerFeedback = null;
  state.trainerStartedAt = null;
  render();

  try {
    state.trainerScenario = await api(`/strategy/scenarios/${scenarioId}`);
    state.trainerStartedAt = Date.now();
  } catch (error) {
    addNotice(error.message || "Could not load that review hand.", "error");
  } finally {
    state.loading.trainer = false;
    render();
  }
}

async function submitTrainerAttempt(action) {
  if (!state.trainerScenario) {
    throw new Error("Deal a scenario first.");
  }

  const response = await api("/strategy/attempts", {
    method: "POST",
    body: JSON.stringify({
      scenarioId: state.trainerScenario.id,
      action,
      timeMs: state.trainerStartedAt ? Math.max(250, Date.now() - state.trainerStartedAt) : 1000,
    }),
  });

  state.trainerFeedback = response.evaluation;
  state.trainerProgress = await api("/strategy/progress");
  render();
}

function openModal(name) {
  primeModal(name);
  document.querySelector(`[data-modal="${name}"]`)?.classList.add("open");
}

function closeModal(name) {
  document.querySelector(`[data-modal="${name}"]`)?.classList.remove("open");
}

function primeModal(name) {
  if (name === "session-complete" && state.selectedSession) {
    const input = document.querySelector("#complete-cashout");
    if (input) {
      input.value = String(Math.round((state.selectedSession.buyIn ?? 0) / 100));
    }
  }

  if (name === "hand-log") {
    const bet = document.querySelector("#hand-bet");
    if (bet && state.selectedSession) {
      bet.value = String(Math.round((state.selectedSession.tableMin ?? 0) / 100));
    }
  }
}

function buildTrainerQuery() {
  if (state.trainerFilter === "hard") return "?isSoft=false&isPair=false";
  if (state.trainerFilter === "soft") return "?isSoft=true&isPair=false";
  if (state.trainerFilter === "pair") return "?isPair=true";
  return "";
}

async function api(path, init = {}, requireAuth = true, retryOnAuthFailure = true) {
  const headers = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };

  if (requireAuth && state.tokens?.accessToken) {
    headers.Authorization = `Bearer ${state.tokens.accessToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && requireAuth && retryOnAuthFailure && state.tokens?.refreshToken) {
    try {
      const refreshed = await api("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: state.tokens.refreshToken }),
      }, false, false);

      persistTokens(refreshed);
      return api(path, init, requireAuth, false);
    } catch {
      clearTokens();
      state.user = null;
      state.stats = null;
      state.sessions = [];
      state.selectedSessionId = null;
      state.selectedSession = null;
      state.sessionHands = [];
      state.sessionStats = null;
      state.trainerProgress = null;
      state.trainerScenario = null;
      state.trainerFeedback = null;
      render();
      throw new Error("Your session expired. Please sign in again.");
    }
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Request failed.");
  }
  return payload.data;
}

function persistTokens(tokens) {
  state.tokens = tokens;
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

function clearTokens() {
  state.tokens = null;
  localStorage.removeItem(TOKEN_KEY);
}

function loadTokens() {
  try {
    const value = localStorage.getItem(TOKEN_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function addNotice(message, kind = "info") {
  state.notices.unshift({ message, kind });
  state.notices = state.notices.slice(0, 3);
  render();
}

function dollarsToCents(value) {
  return Math.round(Number(value || 0) * 100);
}

function parseCards(value) {
  return String(value || "")
    .split(",")
    .map((card) => card.trim().toUpperCase())
    .filter(Boolean);
}

function toneClass(value) {
  if (value === null || value === undefined) return "money-pending";
  if (value > 0) return "money-positive";
  if (value < 0) return "money-negative";
  return "";
}

function formatMoney(cents) {
  if (cents === null || cents === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatPercent(value) {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value * 100)}%`;
}

function formatCount(value) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDuration(value) {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value)} ms`;
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPeriodLabel(value) {
  if (value === "week") return "Last 7 days";
  if (value === "month") return "Last 30 days";
  if (value === "year") return "Last 12 months";
  return "All time";
}

function describeStatsWindow() {
  return formatPeriodLabel(state.stats?.period ?? state.statsPeriod);
}

function getScenarioLabel(scenario) {
  if (!scenario) return "Review hand";
  const firstCard = scenario.playerCards?.[0];
  if (scenario.isPair) return firstCard ? `Pair of ${firstCard}s` : "Pair hand";
  if (scenario.isSoft) return `Soft ${scenario.playerTotal}`;
  return `Hard ${scenario.playerTotal}`;
}

function shortActionLabel(action) {
  if (!action) return "—";
  return String(action).replaceAll("_", " ");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
