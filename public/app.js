const API_BASE = "/api/v1";
const TOKEN_KEY = "blackstack.auth.tokens";
const BUDGET_RING_CIRCUMFERENCE = 2 * Math.PI * 42;

const PASSWORD_RULES = [
  { id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter (a-z)", test: (p) => /[a-z]/.test(p) },
  { id: "digit", label: "One number (0-9)", test: (p) => /\d/.test(p) },
];

const SESSION_TAG_OPTIONS = ["disciplined", "tilted", "chasing", "lucky", "crowded", "heads-up"];
const MOOD_OPTIONS = [
  { value: 1, label: "1 - Low" },
  { value: 2, label: "2 - Tense" },
  { value: 3, label: "3 - Steady" },
  { value: 4, label: "4 - Sharp" },
  { value: 5, label: "5 - Locked in" },
];

const state = {
  authMode: "login",
  guestMode: false,
  tokens: loadTokens(),
  user: null,
  stats: null,
  budget: null,
  budgetFormOpen: false,
  statsPeriod: "all",
  sessions: [],
  selectedSessionId: null,
  selectedSession: null,
  sessionHands: [],
  sessionStats: null,
  editingHandId: null,
  trainerScenario: null,
  trainerProgress: null,
  trainerFeedback: null,
  trainerFilter: "mix",
  trainerStartedAt: null,
  currentView: "dashboard",
  loading: {
    app: true,
    stats: false,
    budget: false,
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
    state.budget = null;
    state.budgetFormOpen = false;
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

  try {
    await Promise.all([
      loadUserStats(state.statsPeriod, false).catch(() => {
        state.stats = null;
      }),
      loadBudget(false).catch(() => {
        state.budget = null;
      }),
      api("/sessions").then((sessions) => {
        state.sessions = sessions?.data ?? [];
        state.selectedSessionId = state.sessions[0]?.id ?? null;
        if (state.selectedSessionId) {
          return loadSessionDetails(state.selectedSessionId);
        }
        state.selectedSession = null;
        state.sessionHands = [];
        state.sessionStats = null;
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
  } finally {
    state.loading.app = false;
    render();
  }
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
          ${state.user
            ? `<span class="pill gold">${escapeHtml(state.user.name)}</span><button class="ghost-btn" data-action="logout">Log out</button>`
            : state.guestMode
              ? `<span class="pill">Guest</span><button class="ghost-btn" data-action="exit-guest">Sign in</button>`
              : `<span class="pill">Not signed in</span><button class="ghost-btn" data-action="try-guest">Try as guest</button><button class="primary-btn" data-action="focus-auth">Get started</button>`}
        </div>
      </div>
    </div>
    <main class="app-shell">
      ${renderNotices()}
      ${state.user ? renderAuthenticatedApp() : state.guestMode ? renderGuestApp() : renderUnauthedApp()}
    </main>
    ${renderModals()}
  `;

  bindGlobalEvents();
  paintBudgetCard();
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
  const isRegister = state.authMode === "register";
  return `
    <section class="hero">
      <div class="hero-grid unauthed">
        <div>
          <span class="eyebrow">Track. Train. Play responsibly.</span>
          <h2>A serious blackjack logbook for the real world.</h2>
          <p>
            Log casino sessions, capture hands in cents, and drill basic strategy with live feedback and progress.
          </p>
          <div class="hero-metrics">
            <div class="metric">
              <label>Track</label>
              <strong>Sessions, bankroll, hand history</strong>
            </div>
            <div class="metric">
              <label>Learn</label>
              <strong>Strategy trainer with progress</strong>
            </div>
          </div>
          <div class="toolbar" style="margin-top:18px">
            <button class="ghost-btn" data-action="try-guest">Continue as guest</button>
          </div>
        </div>
        <div class="auth-layout">
          <section class="auth-card">
            <span class="eyebrow">Account</span>
            <h2>${isRegister ? "Create your account" : "Sign in to continue"}</h2>
            <p class="inline-note">
              ${isRegister
                ? "Build a personal log of sessions, hands, and trainer progress."
                : "Unlock session history, trainer progress, and bankroll stats."}
            </p>
            <div class="auth-tabs">
              <button class="auth-tab ${!isRegister ? "active" : ""}" data-action="set-auth-mode" data-mode="login">Sign in</button>
              <button class="auth-tab ${isRegister ? "active" : ""}" data-action="set-auth-mode" data-mode="register">Register</button>
            </div>
            <form class="auth-form" data-form="auth" novalidate>
              ${isRegister ? `
                <div class="field">
                  <label for="auth-name">Name</label>
                  <input id="auth-name" name="name" type="text" placeholder="Alex Cardcounter" required minlength="2" />
                  <span class="field-error" data-error-for="name"></span>
                </div>
              ` : ""}
              <div class="field">
                <label for="auth-email">Email</label>
                <input id="auth-email" name="email" type="email" placeholder="alex@example.com" required autocomplete="email" />
                <span class="field-error" data-error-for="email"></span>
              </div>
              <div class="field">
                <label for="auth-password">Password</label>
                <input id="auth-password" name="password" type="password" placeholder="${isRegister ? "Min 8 chars · upper · lower · number" : "Your password"}" required autocomplete="${isRegister ? "new-password" : "current-password"}" />
                ${isRegister ? `
                  <div class="password-strength-bar" data-strength><span></span><span></span><span></span><span></span></div>
                  <ul class="password-rules" data-password-rules>
                    ${PASSWORD_RULES.map((rule) => `<li data-rule="${rule.id}">${rule.label}</li>`).join("")}
                  </ul>
                ` : ""}
                <span class="field-error" data-error-for="password"></span>
              </div>
              <button class="primary-btn" type="submit">${isRegister ? "Create account" : "Sign in"}</button>
            </form>
          </section>
        </div>
      </div>
    </section>
  `;
}

function renderGuestApp() {
  return `
    <section class="guest-banner">
      <p><strong>Guest mode.</strong> Browse the strategy chart and rules. Sign in to save sessions, log hands, and track trainer progress.</p>
      <div class="toolbar">
        <button class="primary-btn" data-action="exit-guest">Sign in</button>
      </div>
    </section>
    <section class="trainer-layout">
      <article class="trainer-card">
        <div class="section-head">
          <div>
            <h2>Basic Strategy Reference</h2>
            <p>Read-only chart preview. The interactive trainer requires an account.</p>
          </div>
        </div>
        ${renderChartPreview()}
      </article>
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
            <button class="ghost-btn" data-action="open-modal" data-modal="hand-log" ${state.selectedSession?.status === "ACTIVE" ? "" : "disabled"}>Log hand</button>
            <button class="ghost-btn" data-action="open-modal" data-modal="session-complete" ${state.selectedSession?.status === "ACTIVE" ? "" : "disabled"}>Complete session</button>
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
              ${renderSessionMetadata(activeSession)}
              <div class="detail-grid compact">
                ${renderDetailStat("Buy-In", formatMoney(activeSession.buyIn))}
                ${renderDetailStat("Live P/L", formatMoney(activeSession.liveNetProfit ?? 0), toneClass(activeSession.liveNetProfit ?? 0))}
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
      <div class="dashboard-side-stack">
        ${renderBudgetCardShell()}
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
      </div>
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

function renderBudgetCardShell() {
  return `
    <article class="session-card budget-card" id="budget-card" data-state="unset" hidden>
      <div class="section-head budget-card__head">
        <div>
          <h2>Monthly Budget</h2>
          <p>Net-loss cap for the current calendar month.</p>
        </div>
        <button type="button" class="subtle-btn" id="budget-edit-btn" data-action="edit-budget" hidden>Edit</button>
      </div>

      <div class="budget-card__body" id="budget-card-body">
        <svg class="budget-ring" id="budget-ring-svg" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="budget-ring__track" cx="50" cy="50" r="42" stroke-width="10" fill="none"></circle>
          <circle
            class="budget-ring__bar"
            id="budget-ring-bar"
            cx="50"
            cy="50"
            r="42"
            stroke-width="10"
            fill="none"
            stroke-linecap="round"
            transform="rotate(-90 50 50)"
            stroke-dasharray="263.8938"
            stroke-dashoffset="263.8938"
          ></circle>
          <text class="budget-ring__label" id="budget-ring-label" x="50" y="50">-</text>
        </svg>

        <div class="budget-card__figures">
          <span class="budget-card__primary" id="budget-primary">Set a monthly budget</span>
          <span id="budget-net">Track net loss against a cap.</span>
          <span id="budget-days"></span>
        </div>
      </div>

      <form class="surface-form budget-card__form" id="budget-form" data-form="budget" hidden>
        <div class="field">
          <label for="budget-input">Monthly net-loss cap (USD)</label>
          <input type="number" id="budget-input" name="budgetDollars" min="1" step="1" inputmode="numeric" required />
          <span class="field-error" data-error-for="budgetDollars"></span>
        </div>
        <div class="budget-card__actions">
          <button type="submit" class="primary-btn">Save</button>
          <button type="button" class="ghost-btn" id="budget-cancel-btn" data-action="cancel-budget">Cancel</button>
        </div>
      </form>

      <p class="budget-card__warning" id="budget-warning" hidden>
        You're over your monthly budget.
      </p>
    </article>
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
  const liveNetProfit = session.liveNetProfit ?? state.sessionStats?.liveNetProfit ?? 0;
  return `
    <div class="section-head">
      <div>
        <h2>${escapeHtml(session.casinoName)}</h2>
        <p>${formatDateTime(session.startedAt)} · ${session.status.toLowerCase()} session · ${session.decks}-deck table</p>
      </div>
      <div class="toolbar">
        <span class="pill ${session.status === "ACTIVE" ? "gold" : "success"}">${session.status}</span>
        <button class="ghost-btn" data-action="open-modal" data-modal="session-edit">Edit</button>
        ${session.status === "COMPLETED" ? `<button class="ghost-btn" data-action="reopen-session">Reopen</button>` : `<button class="ghost-btn" data-action="open-modal" data-modal="hand-log">Log hand</button>`}
        <button class="subtle-btn danger" data-action="delete-session">Delete</button>
      </div>
    </div>
    <div class="detail-grid">
      ${renderDetailStat("Buy-In", formatMoney(session.buyIn))}
      ${renderDetailStat("Cash-Out", session.cashOut === null ? "Open" : formatMoney(session.cashOut), toneClass(netProfit))}
      ${renderDetailStat("Table Range", `${formatMoney(session.tableMin)} - ${formatMoney(session.tableMax)}`)}
      ${renderDetailStat("Net Profit", netProfit === null ? "Pending" : formatMoney(netProfit), toneClass(netProfit))}
      ${renderDetailStat("Live P/L", formatMoney(liveNetProfit), toneClass(liveNetProfit))}
      ${renderDetailStat("Hands Played", formatCount(state.sessionStats?.handsPlayed ?? session.handsPlayed))}
      ${renderDetailStat("Win Rate", formatPercent(state.sessionStats?.winRate))}
    </div>
    ${renderSessionMetadata(session)}
    ${session.notes ? `<div class="feedback info"><strong>Notes</strong><br />${escapeHtml(session.notes)}</div>` : ""}
    ${session.completionNotes ? `<div class="feedback info"><strong>Completion Notes</strong><br />${escapeHtml(session.completionNotes)}</div>` : ""}
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
          <div class="toolbar">
            <button class="ghost-btn" data-action="open-modal" data-modal="profile-edit">Edit profile</button>
            <button class="ghost-btn" data-action="open-modal" data-modal="password-change">Change password</button>
          </div>
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
      <article class="profile-card">
        <div class="section-head">
          <div>
            <h2>Account Controls</h2>
            <p>Export a complete JSON copy or permanently remove this account.</p>
          </div>
        </div>
        <div class="toolbar">
          <button class="ghost-btn" data-action="export-account">Export JSON</button>
          <button class="subtle-btn danger" data-action="open-modal" data-modal="account-delete">Delete account</button>
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
                ${table[key].map((value) => `<td data-action="${value}">${value}</td>`).join("")}
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

function renderSessionMetadata(session) {
  const tags = renderSessionTags(session.tags);
  const moodStart = formatMood(session.moodStart);
  const moodEnd = formatMood(session.moodEnd);

  if (!tags && !moodStart && !moodEnd) return "";

  return `
    <div class="session-meta">
      ${moodStart ? `<span class="meta-item">Start ${escapeHtml(moodStart)}</span>` : ""}
      ${moodEnd ? `<span class="meta-item">End ${escapeHtml(moodEnd)}</span>` : ""}
      ${tags}
    </div>
  `;
}

function renderSessionTags(tags = []) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  return `
    <div class="tag-list">
      ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function renderSessionRow(session) {
  const visibleProfit = session.status === "ACTIVE" ? session.liveNetProfit : session.netProfit;
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
        <span>${formatMood(session.moodStart) || "Mood open"}</span>
        <strong class="${toneClass(visibleProfit)}">${session.status === "ACTIVE" ? `Live ${formatMoney(visibleProfit ?? 0)}` : formatMoney(visibleProfit)}</strong>
      </div>
      ${renderSessionTags(session.tags)}
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
        <span class="row-actions">
          <button class="subtle-btn" data-action="edit-hand" data-hand-id="${hand.id}">Edit</button>
          <button class="subtle-btn danger" data-action="delete-hand" data-hand-id="${hand.id}">Delete</button>
        </span>
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
    ${renderModal("session-edit", "Edit Session", "Correct table details, buy-in, tags, mood, or notes.", renderSessionEditForm())}
    ${renderModal("session-complete", "Complete Session", "Close out the session with a final cash-out value.", renderCompleteSessionForm())}
    ${renderModal("hand-log", "Log a Hand", "Capture bet sizing, outcome, cards, and payout in cents.", renderHandForm())}
    ${renderModal("hand-edit", "Edit Hand", "Correct a logged hand and refresh session totals.", renderHandForm(getEditingHand(), "edit-hand", "hand-edit"))}
    ${renderModal("profile-edit", "Edit Profile", "Update the basics tied to your account.", renderProfileForm())}
    ${renderModal("password-change", "Change Password", "Confirm the current password before setting a new one.", renderPasswordForm())}
    ${renderModal("account-delete", "Delete Account", "This permanently removes profile, sessions, hands, budgets, and trainer progress.", renderDeleteAccountForm())}
  `;
}

function getEditingHand() {
  if (!state.editingHandId) return null;
  return state.sessionHands.find((hand) => hand.id === state.editingHandId) ?? null;
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

function renderMoodOptions(selectedValue) {
  return MOOD_OPTIONS.map((mood) => `
    <option value="${mood.value}" ${Number(selectedValue) === mood.value ? "selected" : ""}>${mood.label}</option>
  `).join("");
}

function renderTagCheckboxes(selectedTags = []) {
  const selected = new Set(selectedTags);
  return SESSION_TAG_OPTIONS.map((tag) => `
    <label class="metadata-chip">
      <input type="checkbox" name="tags" value="${tag}" ${selected.has(tag) ? "checked" : ""} />
      <span>${escapeHtml(tag)}</span>
    </label>
  `).join("");
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
        <div class="field">
          <label for="session-mood-start">Starting Mood</label>
          <select id="session-mood-start" name="moodStart">
            <option value="">Not set</option>
            ${renderMoodOptions()}
          </select>
        </div>
      </div>
      <div class="field">
        <label>Session Tags</label>
        <div class="metadata-picker">
          ${renderTagCheckboxes()}
        </div>
      </div>
      <div class="field">
        <label for="session-custom-tags">Custom Tags</label>
        <input id="session-custom-tags" name="customTags" type="text" placeholder="solo table, late shoe" />
      </div>
      <div class="field">
        <label for="session-notes">Notes</label>
        <textarea id="session-notes" name="notes" placeholder="Table energy, focus level, goals for the session."></textarea>
      </div>
      <button class="primary-btn" type="submit">Create session</button>
    </form>
  `;
}

function renderSessionEditForm() {
  const session = state.selectedSession;
  if (!session) return renderEmptyCard("No session selected", "Choose a session before editing details.");
  return `
    <form class="surface-form" data-form="update-session">
      <div class="field-grid">
        <div class="field">
          <label for="session-edit-casino">Casino</label>
          <input id="session-edit-casino" name="casinoName" type="text" value="${escapeHtml(session.casinoName ?? "")}" required />
        </div>
        <div class="field">
          <label for="session-edit-decks">Decks</label>
          <input id="session-edit-decks" name="decks" type="number" min="1" value="${escapeHtml(String(session.decks ?? 6))}" required />
        </div>
        <div class="field">
          <label for="session-edit-min">Table Min ($)</label>
          <input id="session-edit-min" name="tableMin" type="number" min="0" step="1" value="${Math.round((session.tableMin ?? 0) / 100)}" required />
        </div>
        <div class="field">
          <label for="session-edit-max">Table Max ($)</label>
          <input id="session-edit-max" name="tableMax" type="number" min="0" step="1" value="${Math.round((session.tableMax ?? 0) / 100)}" required />
        </div>
        <div class="field">
          <label for="session-edit-buyin">Buy-In ($)</label>
          <input id="session-edit-buyin" name="buyIn" type="number" min="0" step="1" value="${Math.round((session.buyIn ?? 0) / 100)}" required />
        </div>
        <div class="field">
          <label for="session-edit-mood-start">Starting Mood</label>
          <select id="session-edit-mood-start" name="moodStart">
            <option value="">Not set</option>
            ${renderMoodOptions(session.moodStart)}
          </select>
        </div>
      </div>
      <div class="field">
        <label>Session Tags</label>
        <div class="metadata-picker">
          ${renderTagCheckboxes(session.tags)}
        </div>
      </div>
      <div class="field">
        <label for="session-edit-custom-tags">Custom Tags</label>
        <input id="session-edit-custom-tags" name="customTags" type="text" placeholder="solo table, late shoe" />
      </div>
      <div class="field">
        <label for="session-edit-notes">Notes</label>
        <textarea id="session-edit-notes" name="notes">${escapeHtml(session.notes ?? "")}</textarea>
      </div>
      <button class="primary-btn" type="submit">Save session</button>
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
      <div class="field">
        <label for="complete-mood-end">Ending Mood</label>
        <select id="complete-mood-end" name="moodEnd">
          <option value="">Not set</option>
          ${renderMoodOptions()}
        </select>
      </div>
      <div class="field">
        <label for="complete-notes">Completion Notes</label>
        <textarea id="complete-notes" name="completionNotes" placeholder="What changed, whether you followed the plan, and why you left."></textarea>
      </div>
      <button class="primary-btn" type="submit">Complete session</button>
    </form>
  `;
}

function renderHandForm(hand = null, formName = "log-hand", prefix = "hand") {
  const actionLabel = formName === "edit-hand" ? "Save changes" : "Save hand";
  return `
    <form class="surface-form" data-form="${formName}">
      <div class="field-grid">
        <div class="field">
          <label for="${prefix}-bet">Bet ($)</label>
          <input id="${prefix}-bet" name="bet" type="number" min="0" step="1" value="${hand ? Math.round((hand.bet ?? 0) / 100) : ""}" required />
        </div>
        <div class="field">
          <label for="${prefix}-result">Result</label>
          <select id="${prefix}-result" name="result">
            ${["WIN", "LOSS", "PUSH", "BLACKJACK", "SURRENDER"].map((result) => `<option ${hand?.result === result ? "selected" : ""}>${result}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="${prefix}-player-total">Player Total</label>
          <input id="${prefix}-player-total" name="playerTotal" type="number" min="1" max="21" value="${hand?.playerTotal ?? ""}" required />
        </div>
        <div class="field">
          <label for="${prefix}-dealer-total">Dealer Total</label>
          <input id="${prefix}-dealer-total" name="dealerTotal" type="number" min="1" max="31" value="${hand?.dealerTotal ?? ""}" required />
        </div>
        <div class="field">
          <label for="${prefix}-payout">Payout ($ net)</label>
          <input id="${prefix}-payout" name="payout" type="number" step="1" value="${hand ? Math.round((hand.payout ?? 0) / 100) : ""}" required />
        </div>
      </div>
      <div class="field-grid">
        <div class="field">
          <label for="${prefix}-player-cards">Player Cards</label>
          <input id="${prefix}-player-cards" name="playerCards" type="text" placeholder="A,K" value="${escapeHtml(hand?.playerCards?.join(",") ?? "")}" required />
        </div>
        <div class="field">
          <label for="${prefix}-dealer-cards">Dealer Cards</label>
          <input id="${prefix}-dealer-cards" name="dealerCards" type="text" placeholder="9,7" value="${escapeHtml(hand?.dealerCards?.join(",") ?? "")}" required />
        </div>
      </div>
      <div class="field-grid">
        <div class="field">
          <label><input type="checkbox" name="splitHand" ${hand?.splitHand ? "checked" : ""} /> Split hand</label>
        </div>
        <div class="field">
          <label><input type="checkbox" name="doubled" ${hand?.doubled ? "checked" : ""} /> Doubled</label>
        </div>
        <div class="field">
          <label><input type="checkbox" name="surrendered" ${hand?.surrendered ? "checked" : ""} /> Surrendered</label>
        </div>
      </div>
      <button class="primary-btn" type="submit">${actionLabel}</button>
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

function renderPasswordForm() {
  return `
    <form class="surface-form" data-form="change-password">
      <div class="field">
        <label for="password-current">Current Password</label>
        <input id="password-current" name="currentPassword" type="password" autocomplete="current-password" required />
        <span class="field-error" data-error-for="currentPassword"></span>
      </div>
      <div class="field">
        <label for="password-new">New Password</label>
        <input id="password-new" name="newPassword" type="password" autocomplete="new-password" required />
        <span class="field-error" data-error-for="newPassword"></span>
      </div>
      <div class="field">
        <label for="password-confirm">Confirm New Password</label>
        <input id="password-confirm" name="confirmPassword" type="password" autocomplete="new-password" required />
        <span class="field-error" data-error-for="confirmPassword"></span>
      </div>
      <button class="primary-btn" type="submit">Change password</button>
    </form>
  `;
}

function renderDeleteAccountForm() {
  return `
    <form class="surface-form" data-form="delete-account">
      <div class="feedback error">
        <strong>Permanent deletion</strong>
        <p>This removes your profile, sessions, hands, budget settings, and trainer progress. Export JSON first if you need a copy.</p>
      </div>
      <div class="field">
        <label for="delete-password">Password</label>
        <input id="delete-password" name="password" type="password" autocomplete="current-password" required />
        <span class="field-error" data-error-for="password"></span>
      </div>
      <button class="primary-btn danger-btn" type="submit">Delete account</button>
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

  bindAuthValidation();
}

function bindAuthValidation() {
  const form = document.querySelector('form[data-form="auth"]');
  if (!form) return;

  const emailInput = form.querySelector("#auth-email");
  const passwordInput = form.querySelector("#auth-password");
  const nameInput = form.querySelector("#auth-name");
  const isRegister = state.authMode === "register";

  if (emailInput) {
    emailInput.addEventListener("input", () => validateEmailField(emailInput));
    emailInput.addEventListener("blur", () => validateEmailField(emailInput, true));
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      if (isRegister) updatePasswordRulesUi(passwordInput.value);
      validatePasswordField(passwordInput, isRegister);
    });
  }

  if (nameInput) {
    nameInput.addEventListener("blur", () => validateNameField(nameInput));
  }
}

function setFieldError(form, fieldName, message) {
  const errorEl = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (errorEl) errorEl.textContent = message || "";
  const input = form.querySelector(`[name="${fieldName}"]`);
  if (input) {
    if (message) {
      input.classList.add("invalid");
      input.classList.remove("valid");
      input.setAttribute("aria-invalid", "true");
    } else {
      input.classList.remove("invalid");
      input.classList.add("valid");
      input.removeAttribute("aria-invalid");
    }
  }
}

function validateEmailField(input, showEmptyError = false) {
  const value = input.value.trim();
  const form = input.form;
  if (!value) {
    setFieldError(form, "email", showEmptyError ? "Email is required." : "");
    if (!showEmptyError) input.classList.remove("invalid", "valid");
    return !showEmptyError;
  }
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  setFieldError(form, "email", ok ? "" : "Enter a valid email address.");
  return ok;
}

function validateNameField(input) {
  const value = input.value.trim();
  const form = input.form;
  if (!value) {
    setFieldError(form, "name", "Name is required.");
    return false;
  }
  if (value.length < 2) {
    setFieldError(form, "name", "Name must be at least 2 characters.");
    return false;
  }
  setFieldError(form, "name", "");
  return true;
}

function validatePasswordField(input, isRegister) {
  const value = input.value;
  const form = input.form;
  if (!value) {
    setFieldError(form, "password", "");
    input.classList.remove("invalid", "valid");
    return false;
  }
  if (!isRegister) {
    setFieldError(form, "password", "");
    return true;
  }
  const failing = PASSWORD_RULES.filter((rule) => !rule.test(value));
  if (failing.length) {
    setFieldError(form, "password", `Still needed: ${failing.map((r) => r.label.toLowerCase()).join(", ")}.`);
    return false;
  }
  setFieldError(form, "password", "");
  return true;
}

function updatePasswordRulesUi(value) {
  const list = document.querySelector("[data-password-rules]");
  if (!list) return;
  let passed = 0;
  PASSWORD_RULES.forEach((rule) => {
    const item = list.querySelector(`[data-rule="${rule.id}"]`);
    if (!item) return;
    if (rule.test(value)) {
      item.classList.add("met");
      passed += 1;
    } else {
      item.classList.remove("met");
    }
  });
  const bar = document.querySelector("[data-strength]");
  if (bar) {
    bar.classList.remove("s1", "s2", "s3", "s4");
    if (passed > 0) bar.classList.add(`s${passed}`);
  }
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

  if (action === "edit-budget") {
    state.budgetFormOpen = true;
    paintBudgetCard();
    document.querySelector("#budget-input")?.focus();
    return;
  }

  if (action === "cancel-budget") {
    state.budgetFormOpen = state.budget?.budgetCents === null;
    paintBudgetCard();
    return;
  }

  if (action === "open-modal") {
    openModal(event.currentTarget.dataset.modal);
    return;
  }

  if (action === "edit-hand") {
    state.editingHandId = event.currentTarget.dataset.handId;
    render();
    openModal("hand-edit");
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
    state.guestMode = false;
    render();
    document.querySelector("#auth-email")?.focus();
    return;
  }

  if (action === "try-guest") {
    state.guestMode = true;
    state.currentView = "trainer";
    render();
    return;
  }

  if (action === "exit-guest") {
    state.guestMode = false;
    state.authMode = "login";
    render();
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

  if (action === "reopen-session") {
    await reopenSession();
    return;
  }

  if (action === "delete-session") {
    await deleteSelectedSession();
    return;
  }

  if (action === "delete-hand") {
    await deleteHand(event.currentTarget.dataset.handId);
    return;
  }

  if (action === "export-account") {
    await exportAccountData();
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

    if (formName === "update-session") {
      await updateSession(formData);
      closeModal("session-edit");
      return;
    }

    if (formName === "log-hand") {
      await logHand(formData);
      closeModal("hand-log");
      return;
    }

    if (formName === "edit-hand") {
      await updateHand(formData);
      closeModal("hand-edit");
      return;
    }

    if (formName === "update-profile") {
      await updateProfile(formData);
      closeModal("profile-edit");
      return;
    }

    if (formName === "change-password") {
      await changePassword(formData);
      closeModal("password-change");
      return;
    }

    if (formName === "delete-account") {
      await deleteAccount(formData);
      closeModal("account-delete");
      return;
    }

    if (formName === "budget") {
      await saveBudget(formData);
    }
  } catch (error) {
    addNotice(error.message || "Something went wrong.", "error");
  }
}

async function submitAuth(formData) {
  const form = document.querySelector('form[data-form="auth"]');
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const isRegister = state.authMode === "register";
  const name = isRegister ? String(formData.get("name") || "").trim() : "";

  const errors = [];
  if (!email) errors.push("Email is required.");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Enter a valid email address.");
  if (!password) errors.push("Password is required.");
  if (isRegister) {
    if (!name || name.length < 2) errors.push("Name must be at least 2 characters.");
    const failing = PASSWORD_RULES.filter((rule) => !rule.test(password));
    if (failing.length) errors.push(`Password needs: ${failing.map((r) => r.label.toLowerCase()).join(", ")}.`);
  }

  if (form) {
    setFieldError(form, "email", email ? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Enter a valid email address.") : "Email is required.");
    setFieldError(form, "password", password ? (isRegister ? (PASSWORD_RULES.every((r) => r.test(password)) ? "" : "Password does not meet the requirements above.") : "") : "Password is required.");
    if (isRegister) setFieldError(form, "name", name.length >= 2 ? "" : "Name must be at least 2 characters.");
  }

  if (errors.length) {
    throw new Error(errors[0]);
  }

  const payload = { email, password };
  const endpoint = isRegister ? "/auth/register" : "/auth/login";
  if (isRegister) payload.name = name;

  const data = await api(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);

  persistTokens(data);
  state.guestMode = false;
  state.currentView = "dashboard";
  addNotice(isRegister ? "Account created. Welcome." : "Signed in successfully.", "success");
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
  state.budget = null;
  state.budgetFormOpen = false;
  state.sessions = [];
  state.selectedSessionId = null;
  state.selectedSession = null;
  state.sessionHands = [];
  state.sessionStats = null;
  state.editingHandId = null;
  state.trainerProgress = null;
  state.trainerScenario = null;
  state.trainerFeedback = null;
  state.currentView = "dashboard";
  state.guestMode = false;
  state.authMode = "login";
  state.loading.app = false;
  addNotice("Signed out.", "success");
  render();
}

async function createSession(formData) {
  const moodStart = optionalNumber(formData.get("moodStart"));
  const payload = {
    casinoName: String(formData.get("casinoName") || "").trim(),
    tableMin: dollarsToCents(formData.get("tableMin")),
    tableMax: dollarsToCents(formData.get("tableMax")),
    decks: Number(formData.get("decks")),
    buyIn: dollarsToCents(formData.get("buyIn")),
    notes: String(formData.get("notes") || "").trim() || undefined,
    tags: parseSessionTags(formData),
    moodStart: moodStart || undefined,
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

  const moodEnd = optionalNumber(formData.get("moodEnd"));
  const completionNotes = String(formData.get("completionNotes") || "").trim();

  await api(`/sessions/${state.selectedSessionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      cashOut: dollarsToCents(formData.get("cashOut")),
      status: "COMPLETED",
      moodEnd: moodEnd || undefined,
      completionNotes: completionNotes || undefined,
    }),
  });

  addNotice("Session completed.", "success");
  state.currentView = "sessions";
  await hydrateApp();
}

async function updateSession(formData) {
  if (!state.selectedSessionId) {
    throw new Error("Choose a session first.");
  }

  const moodStart = optionalNumber(formData.get("moodStart"));
  const payload = {
    casinoName: String(formData.get("casinoName") || "").trim(),
    tableMin: dollarsToCents(formData.get("tableMin")),
    tableMax: dollarsToCents(formData.get("tableMax")),
    decks: Number(formData.get("decks")),
    buyIn: dollarsToCents(formData.get("buyIn")),
    notes: String(formData.get("notes") || "").trim() || undefined,
    tags: parseSessionTags(formData),
    moodStart: moodStart || undefined,
  };

  await api(`/sessions/${state.selectedSessionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  addNotice("Session updated.", "success");
  await hydrateApp();
  state.currentView = "sessions";
}

async function reopenSession() {
  if (!state.selectedSessionId) {
    throw new Error("Choose a session first.");
  }

  await api(`/sessions/${state.selectedSessionId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "ACTIVE" }),
  });

  addNotice("Session reopened.", "success");
  state.currentView = "sessions";
  await hydrateApp();
}

async function deleteSelectedSession() {
  if (!state.selectedSessionId) {
    throw new Error("Choose a session first.");
  }
  if (!window.confirm("Delete this session and all hands? This cannot be undone.")) return;

  await api(`/sessions/${state.selectedSessionId}`, { method: "DELETE" });
  addNotice("Session deleted.", "success");
  state.currentView = "sessions";
  state.selectedSessionId = null;
  state.selectedSession = null;
  state.sessionHands = [];
  state.sessionStats = null;
  await hydrateApp();
}

async function logHand(formData) {
  if (!state.selectedSessionId) {
    throw new Error("Choose a session first.");
  }

  const payload = buildHandPayload(formData);

  await api(`/sessions/${state.selectedSessionId}/hands`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  addNotice("Hand saved.", "success");
  state.currentView = "sessions";
  await loadSessionDetails(state.selectedSessionId);
  const [stats] = await Promise.all([
    loadUserStats(state.statsPeriod, false),
    loadBudget(false).catch(() => null),
  ]);
  state.stats = stats;
  render();
}

async function updateHand(formData) {
  if (!state.selectedSessionId || !state.editingHandId) {
    throw new Error("Choose a hand first.");
  }

  await api(`/sessions/${state.selectedSessionId}/hands/${state.editingHandId}`, {
    method: "PATCH",
    body: JSON.stringify(buildHandPayload(formData)),
  });

  addNotice("Hand updated.", "success");
  const sessionId = state.selectedSessionId;
  state.editingHandId = null;
  await loadSessionDetails(sessionId);
  const [stats] = await Promise.all([
    loadUserStats(state.statsPeriod, false),
    loadBudget(false).catch(() => null),
  ]);
  state.stats = stats;
  render();
}

async function deleteHand(handId) {
  if (!state.selectedSessionId || !handId) {
    throw new Error("Choose a hand first.");
  }
  if (!window.confirm("Delete this hand from the session history?")) return;

  await api(`/sessions/${state.selectedSessionId}/hands/${handId}`, { method: "DELETE" });
  addNotice("Hand deleted.", "success");
  const sessionId = state.selectedSessionId;
  await loadSessionDetails(sessionId);
  const [stats] = await Promise.all([
    loadUserStats(state.statsPeriod, false),
    loadBudget(false).catch(() => null),
  ]);
  state.stats = stats;
  render();
}

function buildHandPayload(formData) {
  return {
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

async function loadBudget(shouldRender = true) {
  state.loading.budget = true;
  if (shouldRender) paintBudgetCard();

  try {
    state.budget = await api("/users/me/budget");
    if (state.budget?.budgetCents === null) {
      state.budgetFormOpen = true;
    }
    return state.budget;
  } catch (error) {
    if (shouldRender) {
      addNotice(error.message || "Could not refresh monthly budget.", "error");
    }
    throw error;
  } finally {
    state.loading.budget = false;
    if (shouldRender) paintBudgetCard();
  }
}

async function saveBudget(formData) {
  const dollars = Number(formData.get("budgetDollars"));
  const form = document.querySelector("#budget-form");

  if (!Number.isFinite(dollars) || dollars < 1) {
    if (form) setFieldError(form, "budgetDollars", "Enter a whole-dollar budget of at least $1.");
    throw new Error("Enter a monthly budget of at least $1.");
  }

  if (form) setFieldError(form, "budgetDollars", "");

  state.budget = await api("/users/me/budget", {
    method: "PUT",
    body: JSON.stringify({ amountCents: Math.round(dollars * 100) }),
  }).then(() => api("/users/me/budget"));
  state.budgetFormOpen = false;
  addNotice("Monthly budget saved.", "success");
  render();
}

function paintBudgetCard() {
  const card = document.querySelector("#budget-card");
  if (!card) return;

  const body = document.querySelector("#budget-card-body");
  const editBtn = document.querySelector("#budget-edit-btn");
  const form = document.querySelector("#budget-form");
  const warning = document.querySelector("#budget-warning");
  const input = document.querySelector("#budget-input");
  const primary = document.querySelector("#budget-primary");
  const net = document.querySelector("#budget-net");
  const days = document.querySelector("#budget-days");

  const view = state.budget;
  const hasBudget = view?.budgetCents !== null && view?.budgetCents !== undefined;
  const formOpen = state.budgetFormOpen || !hasBudget;

  card.hidden = false;
  card.dataset.state = hasBudget ? (view.state ?? "ok") : "unset";
  card.classList.toggle("loading", state.loading.budget);
  setBudgetRing(hasBudget ? view.percentUsed : null);

  if (primary) primary.textContent = hasBudget
    ? `${formatMoney(view.lossUsedCents)} / ${formatMoney(view.budgetCents)}`
    : "Set a monthly budget";
  if (net) net.textContent = hasBudget
    ? `Net P/L ${formatMoney(view.netResultCents)}`
    : "Track net loss against a personal cap.";
  if (days) days.textContent = hasBudget ? `${view.daysLeftInMonth} days left this month` : "";
  if (editBtn) editBtn.hidden = !hasBudget || formOpen;
  if (body) body.hidden = formOpen && !hasBudget;
  if (form) form.hidden = !formOpen;
  if (warning) warning.hidden = view?.state !== "over";
  if (input && hasBudget && !state.budgetFormOpen) {
    input.value = String(Math.round(view.budgetCents / 100));
  }
}

function setBudgetRing(percentUsed) {
  const bar = document.querySelector("#budget-ring-bar");
  const label = document.querySelector("#budget-ring-label");
  const percent = percentUsed === null || percentUsed === undefined
    ? 0
    : Math.min(100, Math.max(0, percentUsed));
  const offset = BUDGET_RING_CIRCUMFERENCE * (1 - percent / 100);

  if (bar) bar.setAttribute("stroke-dashoffset", String(offset));
  if (label) label.textContent = percentUsed === null || percentUsed === undefined ? "-" : `${percentUsed}%`;
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

async function changePassword(formData) {
  const form = document.querySelector('form[data-form="change-password"]');
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!currentPassword) {
    if (form) setFieldError(form, "currentPassword", "Current password is required.");
    throw new Error("Current password is required.");
  }
  if (!PASSWORD_RULES.every((rule) => rule.test(newPassword))) {
    if (form) setFieldError(form, "newPassword", "Use at least 8 characters with uppercase, lowercase, and a number.");
    throw new Error("New password does not meet the password rules.");
  }
  if (newPassword !== confirmPassword) {
    if (form) setFieldError(form, "confirmPassword", "Passwords do not match.");
    throw new Error("Passwords do not match.");
  }

  await api("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  addNotice("Password changed.", "success");
}

async function exportAccountData() {
  const data = await api("/users/me/export");
  const exportedAt = data.exportedAt ? data.exportedAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `blackstack-export-${exportedAt}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  addNotice("Account export downloaded.", "success");
}

async function deleteAccount(formData) {
  const form = document.querySelector('form[data-form="delete-account"]');
  const password = String(formData.get("password") || "");
  if (!password) {
    if (form) setFieldError(form, "password", "Password is required.");
    throw new Error("Password is required.");
  }
  if (!window.confirm("Delete your BlackStack account permanently?")) return;

  await api("/users/me", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });

  clearTokens();
  state.user = null;
  state.stats = null;
  state.budget = null;
  state.budgetFormOpen = false;
  state.sessions = [];
  state.selectedSessionId = null;
  state.selectedSession = null;
  state.sessionHands = [];
  state.sessionStats = null;
  state.trainerProgress = null;
  state.trainerScenario = null;
  state.trainerFeedback = null;
  state.currentView = "dashboard";
  state.authMode = "login";
  addNotice("Account deleted.", "success");
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
    addNotice("Deal a scenario first.", "error");
    return;
  }

  try {
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
  } catch (error) {
    addNotice(error.message || "Could not submit attempt.", "error");
  }
}

function openModal(name) {
  primeModal(name);
  document.querySelector(`[data-modal="${name}"]`)?.classList.add("open");
}

function closeModal(name) {
  document.querySelector(`[data-modal="${name}"]`)?.classList.remove("open");
  if (name === "hand-edit") {
    state.editingHandId = null;
  }
}

function primeModal(name) {
  if (name === "session-complete" && state.selectedSession) {
    const input = document.querySelector("#complete-cashout");
    if (input) {
      input.value = String(Math.round((state.selectedSession.buyIn ?? 0) / 100));
    }
    const mood = document.querySelector("#complete-mood-end");
    if (mood && state.selectedSession.moodEnd) {
      mood.value = String(state.selectedSession.moodEnd);
    }
    const notes = document.querySelector("#complete-notes");
    if (notes) {
      notes.value = state.selectedSession.completionNotes ?? "";
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
      state.budget = null;
      state.budgetFormOpen = false;
      state.sessions = [];
      state.selectedSessionId = null;
      state.selectedSession = null;
      state.sessionHands = [];
      state.sessionStats = null;
      state.editingHandId = null;
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

function optionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSessionTags(formData) {
  const selectedTags = formData.getAll("tags");
  const customTags = String(formData.get("customTags") || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return Array.from(new Set([...selectedTags, ...customTags].map((tag) => String(tag).toLowerCase()))).slice(0, 8);
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

function formatMood(value) {
  const mood = MOOD_OPTIONS.find((option) => option.value === Number(value));
  return mood?.label ?? "";
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
