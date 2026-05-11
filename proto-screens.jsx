// Main screens: Home, Log, Analytics, Learn, Me, Bankroll, Chart, SessionDetail

// === HOME =================================================================
function HomeScreen({ onOpenSession, onGoTo, period, setPeriod }) {
  const sessions = MOCK_SESSIONS.slice(0, 3);
  return (
    <>
      <Header
        left={<Avatar/>}
        title="BlackStack"
        right={<IconBtn onClick={() => onGoTo('bankroll')}>⚙</IconBtn>}
      />
      <PeriodTabs value={period} onChange={setPeriod}/>
      <Scrollable style={{ padding: '0 20px' }}>
        <Card onClick={() => onGoTo('bankroll')} style={{ padding: 18, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <BudgetRing pct={60}/>
            <div style={{ flex: 1 }}>
              <Mono>{period.toUpperCase()} BUDGET · $500</Mono>
              <div style={{ fontFamily: V.display, fontSize: 28, fontWeight: 600,
                            color: V.ink, lineHeight: 1, marginTop: 6 }}>
                $200 <span style={{ color: V.mute, fontSize: 16, fontWeight: 500 }}>left</span>
              </div>
              <Mono size={11} color={V.pos} style={{ marginTop: 8, display: 'block' }}>
                +$214 net · 13 days left
              </Mono>
            </div>
            <span style={{ color: V.mute, fontSize: 20 }}>›</span>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <SmallStat label="SESSIONS" v="12"/>
          <SmallStat label="W / L" v={<><span style={{color:V.pos}}>7</span><span style={{color:V.mute}}>/</span><span style={{color:V.neg}}>5</span></>}/>
          <SmallStat label="AVG" v="+$18" color={V.pos}/>
        </div>

        <Card onClick={() => onGoTo('analytics')} style={{ marginBottom: 14, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <Mono>NET TREND</Mono>
              <div style={{ fontFamily: V.display, fontSize: 22, fontWeight: 600,
                            color: V.pos, lineHeight: 1, marginTop: 4 }}>+$214</div>
            </div>
            <Mono size={10} color={V.gold}>ANALYTICS →</Mono>
          </div>
          <TrendChart small/>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Hand size={18}>Recent</Hand>
          <button onClick={() => onGoTo('log')}
            style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
            <Mono size={10} color={V.gold}>SEE ALL →</Mono>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 12 }}>
          {sessions.map((r, i) => (
            <SessionRow key={i} session={r} onClick={() => onOpenSession(r)}/>
          ))}
        </div>

        <Card dashed style={{ padding: 12, marginBottom: 16, background: 'rgba(212,175,106,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⏸</span>
            <Hand size={14}>Reality check at 90 min · Reminders on</Hand>
          </div>
        </Card>
      </Scrollable>
    </>
  );
}

// === LOG / HISTORY ========================================================
function LogScreen({ onOpenSession }) {
  return (
    <>
      <Header title="History" right={<IconBtn>⌕</IconBtn>}/>
      <Scrollable style={{ padding: '0 20px' }}>
        {['MAY','APRIL'].map(month => (
          <div key={month} style={{ marginBottom: 16 }}>
            <Mono style={{ marginBottom: 8, display: 'block' }}>{month} 2025</Mono>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {MOCK_SESSIONS.filter(s => s.month === month).map((r, i) => (
                <SessionRow key={i} session={r} onClick={() => onOpenSession(r)}/>
              ))}
            </div>
          </div>
        ))}
        <div style={{ paddingBottom: 12 }}/>
      </Scrollable>
    </>
  );
}

// === ANALYTICS ============================================================
function AnalyticsScreen({ onBack, period, setPeriod }) {
  const [filter, setFilter] = React.useState('All');
  return (
    <>
      <Header left={<IconBtn onClick={onBack}>‹</IconBtn>} title="Analytics"/>
      <PeriodTabs value={period} onChange={setPeriod}/>
      <Scrollable style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
          {['All','Casinos','Games','Tags','+ Filter'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="btn-press"
              style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                background: filter === f ? V.gold : 'transparent',
                color: filter === f ? '#1a1207' : V.ink2,
                border: `1px solid ${filter === f ? V.gold : V.line2}`,
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: V.ui,
              }}>{f}</button>
          ))}
        </div>

        <Card style={{ marginBottom: 10, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <Mono>CUMULATIVE</Mono>
              <div style={{ fontFamily: V.display, fontSize: 24, fontWeight: 600,
                            color: V.pos, marginTop: 2 }}>+$214</div>
            </div>
            <Mono size={10}>30 DAYS</Mono>
          </div>
          <TrendChart/>
        </Card>

        <Card style={{ marginBottom: 10, padding: 14 }}>
          <Hand size={15}>Mood → Result</Hand>
          <Mono size={9} style={{ display: 'block', marginTop: 2 }}>
            Each dot = one session
          </Mono>
          <svg viewBox="0 0 280 110" style={{ width: '100%', marginTop: 8 }}>
            <line x1="20" y1="55" x2="270" y2="55" stroke={V.line} strokeWidth="0.5" strokeDasharray="2 3"/>
            <line x1="145" y1="10" x2="145" y2="100" stroke={V.line} strokeWidth="0.5" strokeDasharray="2 3"/>
            <text x="22" y="14" fontSize="7" fill={V.mute} fontFamily={V.mono}>WIN</text>
            <text x="22" y="105" fontSize="7" fill={V.mute} fontFamily={V.mono}>LOSS</text>
            <text x="220" y="105" fontSize="7" fill={V.mute} fontFamily={V.mono}>HAPPY →</text>
            {[
              [60,75,V.neg],[80,85,V.neg],[105,60,V.gold],[150,32,V.pos],
              [180,22,V.pos],[195,45,V.pos],[120,70,V.neg],[160,35,V.pos],
              [70,88,V.neg],[225,28,V.pos],[155,52,V.gold],[210,38,V.pos],
            ].map(([x,y,c],i)=>(
              <circle key={i} cx={x} cy={y} r="5" fill={c} opacity="0.75"/>
            ))}
          </svg>
          <Hand size={13} color={V.ink2} style={{ marginTop: 4, display: 'block' }}>
            → "Tilted" sessions averaged -$74. Worth a pause.
          </Hand>
        </Card>

        <Card style={{ marginBottom: 12, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <Hand size={15}>By casino</Hand>
            <Mono size={9} color={V.gold}>BY GAME →</Mono>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Bellagio','+$640', 80, false],
              ['Cosmo',   '+$310', 50, false],
              ['MGM',     '+$210', 32, false],
              ['Caesars', '-$180', 28, true],
            ].map(([n,v,w,neg])=>(
              <div key={n}>
                <div style={{ display:'flex', justifyContent:'space-between',
                              fontSize:11, marginBottom:4 }}>
                  <span style={{ color: V.ink2 }}>{n}</span>
                  <span style={{ fontFamily: V.mono, color: neg?V.neg:V.pos, fontWeight: 600 }}>{v}</span>
                </div>
                <Bar pct={w} neg={neg}/>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ paddingBottom: 14 }}/>
      </Scrollable>
    </>
  );
}

// === LEARN HUB ============================================================
function LearnScreen({ onOpenTrainer, onOpenChart, onOpenLesson }) {
  return (
    <>
      <Header title="Learn"/>
      <Scrollable style={{ padding: '0 20px' }}>
        <Card accent soft style={{ marginBottom: 14, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Mono color={V.goldLt}>STREAK</Mono>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span style={{ fontFamily: V.display, fontSize: 34, fontWeight: 600, color: V.ink, lineHeight: 1 }}>7</span>
                <Mono size={11}>days · 82% acc</Mono>
              </div>
            </div>
            <div style={{ fontSize: 36, color: V.gold }}>♠</div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
            {Array.from({length: 14}).map((_,i)=>(
              <div key={i} style={{
                flex: 1, height: 20, borderRadius: 4,
                background: i < 7 ? `linear-gradient(180deg, ${V.goldLt}, ${V.goldDk})` : V.card2,
                border: `1px solid ${V.line}`,
                transition: 'background .3s',
              }}/>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 12 }}>
          <TileCard glyph="☷" title="Lessons" sub="5 of 12 done" big onClick={onOpenLesson}/>
          <TileCard glyph="♠" title="Trainer" sub="Play hands" big onClick={onOpenTrainer}/>
          <TileCard glyph="♢" title="Flashcards" sub="120 cards"/>
          <TileCard glyph="?" title="Quiz" sub="Last: 8/10"/>
          <TileCard glyph="▦" title="Chart" sub="Reference" onClick={onOpenChart}/>
          <TileCard glyph="!" title="Mistakes" sub="12 to review"/>
        </div>
      </Scrollable>
    </>
  );
}

function TileCard({ glyph, title, sub, big, onClick }) {
  return (
    <button onClick={onClick} className="tap-surface btn-press" style={{
      padding: 16, borderRadius: 18, aspectRatio: '1.05', cursor: 'pointer',
      border: `1px solid ${big ? V.gold : V.line}`,
      background: big ? 'rgba(212,175,106,0.06)' : V.card,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      textAlign: 'left', fontFamily: V.ui, color: V.ink,
    }}>
      <div style={{ fontSize: 30, color: big ? V.gold : V.ink2 }}>{glyph}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: V.ink }}>{title}</div>
        <Mono size={10} style={{ marginTop: 3, display: 'block' }}>{sub}</Mono>
      </div>
    </button>
  );
}

// === ME / Settings ========================================================
function MeScreen({ onGoTo }) {
  return (
    <>
      <Header title="Me"/>
      <Scrollable style={{ padding: '0 20px' }}>
        <Card style={{ marginBottom: 14, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Avatar big/>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Alex</div>
            <Mono size={10}>JOINED MAR 2025 · 12 SESSIONS</Mono>
          </div>
        </Card>

        <SettingsGroup title="MONEY">
          <SettingsRow label="Bankroll & limits" right="$200 / $500" onClick={() => onGoTo('bankroll')}/>
          <SettingsRow label="Default currency" right="USD"/>
        </SettingsGroup>

        <SettingsGroup title="REMINDERS">
          <SettingsRow label="Reality check" right="every 90 min"/>
          <SettingsRow label="Loss alerts" right="On"/>
          <SettingsRow label="Time alerts" right="On"/>
        </SettingsGroup>

        <SettingsGroup title="SUPPORT">
          <SettingsRow label="Take a break" right="24h / 7d / 30d"/>
          <SettingsRow label="Get help" right="1-800-GAMBLER" gold/>
        </SettingsGroup>

        <div style={{ paddingBottom: 12, marginTop: 8 }}>
          <Mono style={{ display: 'block', textAlign: 'center' }}>BLACKSTACK v0.1</Mono>
        </div>
      </Scrollable>
    </>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Mono style={{ display: 'block', marginBottom: 8, paddingLeft: 4 }}>{title}</Mono>
      <Card style={{ padding: 0 }}>
        {React.Children.map(children, (c, i) => (
          <div style={{ borderTop: i === 0 ? 'none' : `1px solid ${V.line}` }}>{c}</div>
        ))}
      </Card>
    </div>
  );
}

function SettingsRow({ label, right, onClick, gold }) {
  return (
    <button onClick={onClick} className={onClick ? 'tap-surface btn-press' : ''}
      style={{
        width: '100%', padding: '14px 16px',
        background: 'transparent', border: 'none', cursor: onClick ? 'pointer' : 'default',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        color: V.ink, fontSize: 14, fontFamily: V.ui, textAlign: 'left',
      }}>
      <span>{label}</span>
      <span style={{ color: gold ? V.gold : V.mute, fontSize: 12, fontFamily: V.mono }}>
        {right} {onClick && '›'}
      </span>
    </button>
  );
}

// === BANKROLL =============================================================
function BankrollScreen({ onBack }) {
  const [budget, setBudget] = React.useState(500);
  return (
    <>
      <Header left={<IconBtn onClick={onBack}>‹</IconBtn>} title="Bankroll & limits"/>
      <Scrollable style={{ padding: '0 20px' }}>
        <Card style={{ marginBottom: 14, padding: 16 }}>
          <Mono>MAY BUDGET</Mono>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontFamily: V.display, fontSize: 28, fontWeight: 600 }}>
              $300 <span style={{ color: V.mute, fontSize: 16 }}>/ ${budget}</span>
            </span>
            <Pill gold>60%</Pill>
          </div>
          <div style={{ marginTop: 10 }}><Bar pct={60}/></div>
          <Mono size={10} style={{ marginTop: 8, display: 'block' }}>
            13 days left · $200 remaining
          </Mono>
        </Card>

        <Hand size={15} style={{ display: 'block', marginBottom: 8 }}>Guardrails</Hand>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {[
            { k: 'Monthly budget',          v: `$${budget}`, p: 60 },
            { k: 'Per-session max loss',    v: '$150', p: 30 },
            { k: 'Per-session max time',    v: '2 hrs', p: 40 },
            { k: 'Bankroll goal',           v: '$2,000', p: 65 },
          ].map(s => (
            <Card key={s.k} style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{s.k}</span>
                <Mono size={11} color={V.ink}>{s.v}</Mono>
              </div>
              <SliderTrack value={s.p}/>
            </Card>
          ))}
        </div>

        <Card dashed style={{ padding: 14, background: 'rgba(212,175,106,0.05)', marginBottom: 14 }}>
          <Hand size={16}>Need to step back?</Hand>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <Pill>24h break</Pill>
            <Pill>7 days</Pill>
            <Pill>30 days</Pill>
            <Pill gold solid>Get help</Pill>
          </div>
        </Card>
        <div style={{ paddingBottom: 12 }}/>
      </Scrollable>
    </>
  );
}

function SliderTrack({ value }) {
  return (
    <div style={{ position: 'relative', height: 22 }}>
      <div style={{ position: 'absolute', top: 9, left: 0, right: 0, height: 4,
                    background: V.card2, borderRadius: 2, border: `1px solid ${V.line}` }}/>
      <div style={{ position: 'absolute', top: 9, left: 0, width: `${value}%`, height: 4,
                    background: `linear-gradient(90deg, ${V.goldDk}, ${V.goldLt})`, borderRadius: 2 }}/>
      <div style={{ position: 'absolute', top: 0, left: `calc(${value}% - 11px)`,
                    width: 22, height: 22, borderRadius: 11, background: V.ink,
                    border: `2px solid ${V.gold}`,
                    boxShadow: '0 2px 6px rgba(0,0,0,.4)' }}/>
    </div>
  );
}

// === CHART ================================================================
const ACT = { H:'#b86a3c', S:'#7bb98c', D:V.gold, P:'#a76dc4', R:'#d77a7a', Ds:V.gold };
const COLS_CH = ['2','3','4','5','6','7','8','9','10','A'];
function ChartScreen({ onBack }) {
  return (
    <>
      <Header left={<IconBtn onClick={onBack}>‹</IconBtn>} title="Strategy" right={<Pill>4–8 deck</Pill>}/>
      <Scrollable style={{ padding: '0 20px' }}>
        <Mono style={{ display: 'block', marginBottom: 12 }}>
          FULL REFERENCE · DEALER STANDS SOFT 17
        </Mono>
        <Card style={{ padding: 14, marginBottom: 12 }}>
          <ChartGrid rows={Object.entries(STRAT.hard).reverse().map(([k,v])=>[k,...v])} title="HARD HANDS"/>
        </Card>
        <Card style={{ padding: 14, marginBottom: 12 }}>
          <ChartGrid rows={Object.entries(STRAT.soft).reverse().map(([k,v])=>[`A,${k}`,...v])} title="SOFT HANDS"/>
        </Card>
        <Card style={{ padding: 14, marginBottom: 12 }}>
          <ChartGrid rows={Object.entries(STRAT.pair).map(([k,v])=>[`${k},${k}`,...v])} title="PAIRS"/>
        </Card>
        <Card style={{ padding: 12, marginBottom: 14 }}>
          <Mono color={V.goldLt}>LEGEND</Mono>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
            <Legend c={ACT.H} l="Hit"/><Legend c={ACT.S} l="Stand"/>
            <Legend c={ACT.D} l="Double"/><Legend c={ACT.P} l="Split"/>
            <Legend c={ACT.R} l="Surrender"/>
          </div>
        </Card>
      </Scrollable>
    </>
  );
}

function ChartGrid({ rows, title }) {
  return (
    <div>
      <Mono color={V.goldLt} style={{ display: 'block', marginBottom: 6 }}>{title}</Mono>
      <div style={{ display: 'grid', gridTemplateColumns: '24px repeat(10, 1fr)', gap: 2 }}>
        <div/>
        {COLS_CH.map(c => (
          <div key={c} style={{ textAlign: 'center', fontSize: 9, fontFamily: V.mono,
                                color: V.mute, paddingBottom: 2 }}>{c}</div>
        ))}
        {rows.map((row, ri) => (
          <React.Fragment key={ri}>
            <div style={{ fontSize: 9, fontFamily: V.mono, color: V.mute,
                          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                          paddingRight: 3 }}>{row[0]}</div>
            {row.slice(1).map((a, ci) => (
              <div key={ci} style={{ aspectRatio: '1', background: ACT[a],
                                     borderRadius: 2, opacity: 0.92 }}/>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Legend({ c, l }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                   fontSize: 11, color: V.ink2 }}>
      <span style={{ width: 14, height: 14, background: c, borderRadius: 3 }}/>{l}
    </span>
  );
}

// === SESSION DETAIL =======================================================
function SessionDetail({ session, onClose }) {
  if (!session) return null;
  const net = session.games.reduce((a,g) => a + g.net, 0);
  return (
    <div style={{ padding: '54px 20px 20px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <IconBtn onClick={onClose}>✕</IconBtn>
        <Mono>{session.date}</Mono>
        <div style={{ width: 36 }}/>
      </div>
      <div style={{ fontFamily: V.display, fontSize: 26, fontWeight: 600 }}>{session.casino}</div>
      <Mono style={{ display: 'block', marginTop: 4 }}>
        {session.duration} · {session.games.length} GAME{session.games.length > 1 ? 'S' : ''}
      </Mono>
      <Card soft accent style={{ marginTop: 14, padding: 16 }}>
        <Mono color={V.goldLt}>SESSION NET</Mono>
        <div style={{ fontFamily: V.display, fontSize: 36, fontWeight: 600,
                      color: net >= 0 ? V.pos : V.neg, marginTop: 4 }}>
          {net >= 0 ? '+' : ''}${net}
        </div>
      </Card>
      <Hand size={15} style={{ display: 'block', marginTop: 18, marginBottom: 8 }}>Games</Hand>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {session.games.map((g, i) => (
          <Card key={i} style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 600 }}>{g.name}</span>
              <span style={{ fontFamily: V.mono, fontWeight: 700,
                             color: g.net >= 0 ? V.pos : V.neg }}>
                {g.net >= 0 ? '+' : ''}${g.net}
              </span>
            </div>
            <Mono size={10}>${g.buyIn} in → ${g.cashOut} out</Mono>
          </Card>
        ))}
      </div>
      {session.tags && (
        <>
          <Hand size={15} style={{ display: 'block', marginTop: 18, marginBottom: 8 }}>Tags</Hand>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {session.tags.map(t => <Pill key={t}>{t}</Pill>)}
          </div>
        </>
      )}
      {session.notes && (
        <Card style={{ marginTop: 14, padding: 12 }}>
          <Mono>NOTES</Mono>
          <div style={{ marginTop: 6, fontSize: 13, color: V.ink2, lineHeight: 1.5 }}>{session.notes}</div>
        </Card>
      )}
    </div>
  );
}

// === Reusable mini-components =============================================
function Avatar({ big }) {
  const s = big ? 48 : 32;
  return <div style={{
    width: s, height: s, borderRadius: s/2,
    background: `linear-gradient(155deg, ${V.goldLt}, ${V.goldDk})`,
    color: '#1a1207', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: s * 0.4, fontWeight: 700, fontFamily: V.display,
    border: `1.5px solid ${V.line}`,
  }}>A</div>;
}

function BudgetRing({ pct }) {
  const r = 36, c = 2 * Math.PI * r;
  return (
    <svg width="92" height="92" viewBox="0 0 92 92">
      <circle cx="46" cy="46" r={r} fill="none" stroke={V.line} strokeWidth="5"/>
      <circle cx="46" cy="46" r={r} fill="none" stroke="url(#g)" strokeWidth="5"
        strokeDasharray={`${c * pct/100} ${c}`}
        transform="rotate(-90 46 46)" strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .6s cubic-bezier(.2,.7,.2,1)' }}/>
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={V.goldLt}/>
          <stop offset="1" stopColor={V.goldDk}/>
        </linearGradient>
      </defs>
      <text x="46" y="45" textAnchor="middle" fontFamily={V.mono}
            fontSize="14" fontWeight="700" fill={V.ink}>{pct}%</text>
      <text x="46" y="58" textAnchor="middle" fontFamily={V.ui}
            fontSize="7" fill={V.mute}>OF BUDGET</text>
    </svg>
  );
}

function SmallStat({ label, v, color }) {
  return (
    <div style={{ padding: 10, background: V.card, borderRadius: 12,
                  border: `1px solid ${V.line}` }}>
      <Mono size={8}>{label}</Mono>
      <div style={{ fontFamily: V.mono, fontSize: 18, fontWeight: 700,
                    color: color || V.ink, marginTop: 2 }}>{v}</div>
    </div>
  );
}

function SessionRow({ session, onClick }) {
  const sign = session.net >= 0 ? '+' : '';
  return (
    <button onClick={onClick} className="tap-surface btn-press" style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 14px', borderRadius: 12,
      background: V.card, border: `1px solid ${V.line}`,
      cursor: 'pointer', textAlign: 'left', width: '100%', color: V.ink, fontFamily: V.ui,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{session.casino}</div>
        <Mono size={10}>{session.date} · {session.gameSummary}</Mono>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontFamily: V.mono, fontSize: 14, fontWeight: 700,
                       color: session.net >= 0 ? V.pos : V.neg }}>
          {sign}${Math.abs(session.net)}
        </span>
        <div style={{ color: V.mute, fontSize: 14, marginTop: -2 }}>›</div>
      </div>
    </button>
  );
}

function TrendChart({ small }) {
  const h = small ? 60 : 110;
  return (
    <svg viewBox={`0 0 280 ${h}`} style={{ width: '100%', marginTop: 8 }}>
      {[0,1,2,3].map(i=>(
        <line key={i} x1="0" y1={(h-20)*i/3+10} x2="280" y2={(h-20)*i/3+10}
              stroke={V.line} strokeWidth="0.5" strokeDasharray="2 3"/>
      ))}
      <path d={`M0 ${h-20} L25 ${h-30} L50 ${h-24} L75 ${h-40} L100 ${h-34} L125 ${h-48} L150 ${h-40} L175 ${h-60} L200 ${h-52} L225 ${h-72} L250 ${h-66} L280 ${h-80}`}
            fill="none" stroke={V.gold} strokeWidth="1.8"/>
      <path d={`M0 ${h-20} L25 ${h-30} L50 ${h-24} L75 ${h-40} L100 ${h-34} L125 ${h-48} L150 ${h-40} L175 ${h-60} L200 ${h-52} L225 ${h-72} L250 ${h-66} L280 ${h-80} L280 ${h} L0 ${h} Z`}
            fill={V.gold} opacity="0.08"/>
      <circle cx="280" cy={h-80} r="3.5" fill={V.gold} stroke={V.bg} strokeWidth="2"/>
    </svg>
  );
}

// === Mock data ============================================================
const MOCK_SESSIONS = [
  { date: 'May 10', month: 'MAY', casino: 'MGM Grand', net: 120, duration: '2h 14m',
    gameSummary: 'BJ + Poker + Roulette', tags: ['disciplined','fun'],
    notes: 'Stayed within budget, walked away on a good run.',
    games: [
      { name: 'Blackjack', buyIn: 200, cashOut: 320, net: 120 },
      { name: 'Poker',     buyIn: 100, cashOut: 60,  net: -40 },
      { name: 'Roulette',  buyIn: 50,  cashOut: 90,  net: 40 },
    ] },
  { date: 'May 7',  month: 'MAY', casino: 'Bellagio', net: -80, duration: '1h 22m',
    gameSummary: 'Poker', tags: ['tired','learning'],
    games: [ { name: 'Poker', buyIn: 200, cashOut: 120, net: -80 } ] },
  { date: 'May 3',  month: 'MAY', casino: 'Cosmo', net: 210, duration: '3h 04m',
    gameSummary: 'Blackjack', tags: ['lucky','disciplined'],
    games: [ { name: 'Blackjack', buyIn: 300, cashOut: 510, net: 210 } ] },
  { date: 'Apr 28', month: 'APRIL', casino: 'Caesars', net: -180, duration: '2h 41m',
    gameSummary: 'BJ + Slots', tags: ['tilted','chasing'],
    games: [
      { name: 'Blackjack', buyIn: 200, cashOut: 80, net: -120 },
      { name: 'Slots',     buyIn: 100, cashOut: 40, net: -60 },
    ] },
  { date: 'Apr 22', month: 'APRIL', casino: 'Wynn', net: 95, duration: '1h 50m',
    gameSummary: 'Blackjack',
    games: [ { name: 'Blackjack', buyIn: 150, cashOut: 245, net: 95 } ] },
];

Object.assign(window, {
  HomeScreen, LogScreen, AnalyticsScreen, LearnScreen, MeScreen,
  BankrollScreen, ChartScreen, SessionDetail, MOCK_SESSIONS,
});
