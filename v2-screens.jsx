// v2 screens — gold + black, merged per user direction
// Each section = ONE screen (the chosen direction), with sub-states where useful.

// ============ DASHBOARD: C base + period switcher + recent + sess/W-L =====
function Dashboard() {
  return (
    <Phone title="Welcome back" nav="home" headerRight={
      <Pill>Alex</Pill>
    }>
      <PeriodTabs value="Month"/>

      <Card style={{ marginBottom: 10, padding: 14 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <svg width="86" height="86" viewBox="0 0 86 86">
            <circle cx="43" cy="43" r="36" fill="none" stroke={V.line} strokeWidth="5"/>
            <circle cx="43" cy="43" r="36" fill="none"
              stroke="url(#gold)" strokeWidth="5"
              strokeDasharray={`${2*Math.PI*36*0.6} ${2*Math.PI*36}`}
              transform="rotate(-90 43 43)" strokeLinecap="round"/>
            <defs>
              <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={V.goldLt}/>
                <stop offset="1" stopColor={V.goldDk}/>
              </linearGradient>
            </defs>
            <text x="43" y="42" textAnchor="middle" fontFamily={V.mono}
                  fontSize="13" fontWeight="700" fill={V.ink}>60%</text>
            <text x="43" y="54" textAnchor="middle" fontFamily={V.ui}
                  fontSize="7" fill={V.mute}>OF BUDGET</text>
          </svg>
          <div style={{ flex: 1 }}>
            <Mono>MAY BUDGET · $500</Mono>
            <div style={{ fontFamily: V.display, fontSize: 24, fontWeight: 600,
                          color: V.ink, lineHeight: 1, marginTop: 6 }}>
              $200 <span style={{ color: V.mute, fontSize: 14 }}>left</span>
            </div>
            <Mono size={10} color={V.pos} style={{ marginTop: 6, display: 'block' }}>
              +$214 net · 13 days left
            </Mono>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        <Card style={{ padding: 10 }}>
          <Mono size={8}>SESSIONS</Mono>
          <div style={{ fontFamily: V.mono, fontSize: 18, fontWeight: 700, color: V.ink, marginTop: 2 }}>12</div>
        </Card>
        <Card style={{ padding: 10 }}>
          <Mono size={8}>W / L</Mono>
          <div style={{ fontFamily: V.mono, fontSize: 18, fontWeight: 700, marginTop: 2 }}>
            <span style={{ color: V.pos }}>7</span>
            <span style={{ color: V.mute, fontWeight: 400 }}>/</span>
            <span style={{ color: V.neg }}>5</span>
          </div>
        </Card>
        <Card style={{ padding: 10 }}>
          <Mono size={8}>AVG</Mono>
          <div style={{ fontFamily: V.mono, fontSize: 18, fontWeight: 700, color: V.pos, marginTop: 2 }}>+$18</div>
        </Card>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Hand size={16}>Recent</Hand>
        <Mono size={9} color={V.gold}>SEE ALL →</Mono>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { d: 'May 10', c: 'MGM Vegas',  g: 'BJ + Poker',  v: '+$120', s: '+' },
          { d: 'May 7',  c: 'Bellagio',   g: 'Poker',       v: '-$80',  s: '-' },
          { d: 'May 3',  c: 'Cosmo',      g: 'Blackjack',   v: '+$210', s: '+' },
        ].map((r, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 10px', borderRadius: 10,
            background: V.card, border: `1px solid ${V.line}`,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: V.ink }}>{r.c}</div>
              <Mono size={9}>{r.d} · {r.g}</Mono>
            </div>
            <span style={{ fontFamily: V.mono, fontSize: 13, fontWeight: 700,
                           color: r.s === '+' ? V.pos : V.neg }}>{r.v}</span>
          </div>
        ))}
      </div>

      <Card dashed style={{ marginTop: 10, padding: 10, background: 'rgba(212,175,106,0.04)' }}>
        <Hand size={13}>⏸ Reality check at 90 min · Reminder on</Hand>
      </Card>
    </Phone>
  );
}

// ============ ADD SESSION: A+B merged, with MULTI-GAME support ===========
function AddSession() {
  return (
    <Phone title="New session" nav="add" noNav>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: -6, marginBottom: 10 }}>
        <Mono size={11} color={V.mute}>Cancel</Mono>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{ width: 28, height: 4, borderRadius: 2,
                                  background: i <= 1 ? V.gold : V.line }}/>
          ))}
        </div>
        <Mono size={11} color={V.gold}>Save</Mono>
      </div>

      <Field label="Casino" value="MGM Grand · Las Vegas"/>
      <Field label="Date" value="Sat May 10 · 8:14 PM"/>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    margin: '10px 0 6px' }}>
        <Mono>GAMES PLAYED</Mono>
        <Mono size={10} color={V.gold}>+ ADD GAME</Mono>
      </div>

      {/* Sub-game ledger - the multi-game answer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SubGame game="Blackjack" buyIn="$200" cashOut="$320" net="+$120" sign="+"/>
        <SubGame game="Poker"     buyIn="$100" cashOut="$60"  net="-$40"  sign="-"/>
        <SubGame game="Roulette"  buyIn="$50"  cashOut="$90"  net="+$40"  sign="+" expanded/>
      </div>

      <Card soft accent style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Mono color={V.goldLt}>SESSION NET</Mono>
          <span style={{ fontFamily: V.display, fontSize: 26, fontWeight: 600, color: V.pos }}>
            +$120
          </span>
        </div>
        <Mono size={9} style={{ marginTop: 4, display: 'block' }}>
          $350 in · $470 out · 3 games · 2h 14m
        </Mono>
      </Card>

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
                    color: V.mute, fontSize: 11 }}>
        <span style={{ fontFamily: V.mono }}>▾</span> More: mood, tags, notes, alcohol
      </div>
    </Phone>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <Mono>{label}</Mono>
      <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: 10,
                    background: V.card, border: `1px solid ${V.line}`,
                    fontSize: 13, fontWeight: 500, color: V.ink }}>{value}</div>
    </div>
  );
}

function SubGame({ game, buyIn, cashOut, net, sign, expanded }) {
  return (
    <Card style={{ padding: expanded ? 12 : 10, borderColor: expanded ? V.gold : V.line }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 22, height: 22, borderRadius: 11, background: V.card2,
                         border: `1px solid ${V.line2}`,
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         fontSize: 11, color: V.gold }}>♤</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: V.ink }}>{game}</span>
        </div>
        <span style={{ fontFamily: V.mono, fontSize: 13, fontWeight: 700,
                       color: sign === '+' ? V.pos : V.neg }}>{net}</span>
      </div>
      {expanded && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
          <div style={{ padding: '6px 8px', borderRadius: 8, background: V.bg2 }}>
            <Mono size={8}>BUY-IN</Mono>
            <div style={{ fontFamily: V.mono, fontSize: 13, color: V.ink, marginTop: 1 }}>{buyIn}</div>
          </div>
          <div style={{ padding: '6px 8px', borderRadius: 8, background: V.bg2 }}>
            <Mono size={8}>CASH-OUT</Mono>
            <div style={{ fontFamily: V.mono, fontSize: 13, color: V.ink, marginTop: 1 }}>{cashOut}</div>
          </div>
        </div>
      )}
      {!expanded && (
        <Mono size={9} style={{ marginTop: 4, display: 'block' }}>
          {buyIn} → {cashOut}
        </Mono>
      )}
    </Card>
  );
}

// ============ ANALYTICS: A+B merged, with filters ========================
function Analytics() {
  return (
    <Phone title="Analytics" nav="log">
      <PeriodTabs value="Month"/>

      {/* filter chips */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 10, overflow: 'hidden' }}>
        <Pill solid gold>All casinos</Pill>
        <Pill>All games</Pill>
        <Pill>Tags</Pill>
        <Pill>+ Filter</Pill>
      </div>

      {/* cumulative chart from A */}
      <Card style={{ marginBottom: 8, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <Mono>CUMULATIVE</Mono>
            <div style={{ fontFamily: V.display, fontSize: 22, fontWeight: 600,
                          color: V.pos, marginTop: 2, lineHeight: 1 }}>+$214</div>
          </div>
          <Mono size={10}>30 DAYS</Mono>
        </div>
        <svg viewBox="0 0 280 90" style={{ width: '100%', marginTop: 8 }}>
          {[0,1,2,3].map(i=>(
            <line key={i} x1="0" y1={20+i*20} x2="280" y2={20+i*20}
                  stroke={V.line} strokeWidth="0.5" strokeDasharray="2 3"/>
          ))}
          <path d="M0 70 L25 60 L50 66 L75 50 L100 56 L125 42 L150 50 L175 30 L200 38 L225 22 L250 28 L280 16"
                fill="none" stroke={V.gold} strokeWidth="1.8"/>
          <path d="M0 70 L25 60 L50 66 L75 50 L100 56 L125 42 L150 50 L175 30 L200 38 L225 22 L250 28 L280 16 L280 90 L0 90 Z"
                fill={V.gold} opacity="0.08"/>
          <circle cx="280" cy="16" r="3.5" fill={V.gold} stroke={V.bg} strokeWidth="2"/>
        </svg>
      </Card>

      {/* Mood × Result scatter (B) */}
      <Card style={{ marginBottom: 8, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Hand size={14}>Mood → Result</Hand>
          <Mono>PATTERN</Mono>
        </div>
        <svg viewBox="0 0 260 100" style={{ width: '100%', marginTop: 6 }}>
          <line x1="20" y1="50" x2="250" y2="50" stroke={V.line} strokeWidth="0.5" strokeDasharray="2 3"/>
          <line x1="135" y1="8" x2="135" y2="95" stroke={V.line} strokeWidth="0.5" strokeDasharray="2 3"/>
          <text x="22" y="12" fontSize="7" fill={V.mute} fontFamily={V.mono}>WIN</text>
          <text x="22" y="95" fontSize="7" fill={V.mute} fontFamily={V.mono}>LOSS</text>
          <text x="200" y="95" fontSize="7" fill={V.mute} fontFamily={V.mono}>HAPPY→</text>
          <text x="22" y="95" fontSize="7" fill={V.mute} fontFamily={V.mono}></text>
          {[
            [60,70,V.neg],[80,80,V.neg],[105,55,V.gold],[150,32,V.pos],
            [180,22,V.pos],[195,45,V.pos],[115,65,V.neg],[160,35,V.pos],
            [70,82,V.neg],[215,28,V.pos],[155,50,V.gold],[200,36,V.pos],
          ].map(([x,y,c],i)=>(
            <circle key={i} cx={x} cy={y} r="4" fill={c} opacity="0.7"/>
          ))}
        </svg>
        <Hand size={12} color={V.ink2}>
          → "Tilted" sessions averaged -$74. Worth a pause.
        </Hand>
      </Card>

      {/* Top performers from A */}
      <Card style={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Hand size={14}>By casino</Hand>
          <Mono size={9} color={V.gold}>BY GAME →</Mono>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['Bellagio','+$640', 80, false],
            ['Cosmo',   '+$310', 50, false],
            ['MGM',     '+$210', 32, false],
            ['Caesars', '-$180', 28, true],
          ].map(([n,v,w,neg])=>(
            <div key={n}>
              <div style={{ display:'flex', justifyContent:'space-between',
                            fontSize:10, marginBottom:3 }}>
                <span style={{ color: V.ink2 }}>{n}</span>
                <span style={{ fontFamily: V.mono, color: neg?V.neg:V.pos, fontWeight: 600 }}>{v}</span>
              </div>
              <Bar pct={w} neg={neg}/>
            </div>
          ))}
        </div>
      </Card>
    </Phone>
  );
}

// ============ LEARN HUB (C) ==============================================
function Learn() {
  return (
    <Phone title="Learn" nav="learn">
      <Card accent soft style={{ marginBottom: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Mono color={V.goldLt}>STREAK</Mono>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <span style={{ fontFamily: V.display, fontSize: 30, fontWeight: 600, color: V.ink }}>7</span>
              <Mono size={10}>days · 82% accuracy</Mono>
            </div>
          </div>
          <div style={{ fontSize: 28, color: V.gold }}>♠</div>
        </div>
        <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
          {Array.from({length: 14}).map((_,i)=>(
            <div key={i} style={{ flex: 1, height: 16, borderRadius: 3,
                                  background: i < 7 ? V.gold : V.card2,
                                  border: `1px solid ${V.line}` }}/>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { t: 'Lessons',    s: '5 of 12 done',  glyph: '☷', big: true },
          { t: 'Trainer',    s: 'Play hands',    glyph: '♠', big: true },
          { t: 'Flashcards', s: '120 cards',     glyph: '♢' },
          { t: 'Quiz',       s: 'Last: 8/10',    glyph: '?' },
          { t: 'Chart',      s: 'Reference',     glyph: '▦' },
          { t: 'Mistakes',   s: '12 to review',  glyph: '!' },
        ].map(c => (
          <div key={c.t} style={{
            padding: 14, borderRadius: 14, aspectRatio: '1.08',
            border: `1px solid ${c.big ? V.gold : V.line}`,
            background: c.big ? 'rgba(212,175,106,0.06)' : V.card,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 26, color: c.big ? V.gold : V.ink2 }}>{c.glyph}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: V.ink }}>{c.t}</div>
              <Mono size={9} style={{ marginTop: 2, display: 'block' }}>{c.s}</Mono>
            </div>
          </div>
        ))}
      </div>
    </Phone>
  );
}

// ============ TRAINER: prompt + reasoning panel + hint ===================
function PlayingCard({ r, s, hidden, size = 1 }) {
  const w = 40 * size, h = 56 * size;
  const red = s === '♥' || s === '♦';
  if (hidden) {
    return <div style={{
      width: w, height: h, borderRadius: 6,
      background: V.card2, border: `1.5px solid ${V.goldDk}`,
      backgroundImage: `repeating-linear-gradient(45deg, ${V.card} 0 5px, transparent 5px 10px)`,
    }}/>;
  }
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: '#f7f3ea',
      border: `1.5px solid #1c1c1f`,
      padding: 5, fontFamily: V.mono, fontWeight: 700,
      color: red ? '#a14a4a' : '#1a1a1a', position: 'relative',
    }}>
      <div style={{ fontSize: 11*size }}>{r}</div>
      <div style={{ fontSize: 12*size, lineHeight: 1 }}>{s}</div>
      <div style={{ position: 'absolute', bottom: 3, right: 4, fontSize: 11*size,
                    transform: 'rotate(180deg)' }}>{r}{s}</div>
    </div>
  );
}

function Trainer() {
  return (
    <Phone title="Trainer" nav="learn">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Pill gold>Hard hands</Pill>
        <Mono size={10}>HAND 24 · 82% ACC · STREAK 4</Mono>
      </div>

      {/* table */}
      <div style={{
        background: 'linear-gradient(180deg, #1a1f1a, #11150e)',
        border: `1px solid ${V.line}`,
        borderRadius: 14, padding: '14px 12px',
      }}>
        <Mono color={V.mute2}>DEALER</Mono>
        <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'center' }}>
          <PlayingCard r="10" s="♣"/>
          <PlayingCard hidden/>
        </div>

        <div style={{ height: 12 }}/>
        <Mono color={V.mute2}>YOUR HAND · 16</Mono>
        <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'center' }}>
          <PlayingCard r="9" s="♠"/>
          <PlayingCard r="7" s="♦"/>
        </div>
      </div>

      {/* hint row */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <div style={{ flex: 1, padding: '7px', textAlign: 'center', borderRadius: 8,
                      border: `1px dashed ${V.gold}`, color: V.gold, fontSize: 11 }}>
          💡 Show hint
        </div>
        <div style={{ flex: 1, padding: '7px', textAlign: 'center', borderRadius: 8,
                      border: `1px solid ${V.line2}`, color: V.ink2, fontSize: 11 }}>
          Skip hand
        </div>
      </div>

      {/* action grid */}
      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        {[
          ['HIT',    false],
          ['STAND',  false],
          ['DOUBLE', false],
          ['SPLIT',  false],
          ['SURR',   false],
          ['INSURE', false],
        ].map(([k]) => (
          <div key={k} style={{
            padding: '11px 0', textAlign: 'center', borderRadius: 10,
            background: V.card, border: `1px solid ${V.line2}`,
            color: V.ink, fontSize: 11, fontWeight: 700, fontFamily: V.mono,
          }}>{k}</div>
        ))}
      </div>

      {/* reasoning preview (visible expanded state) */}
      <Card accent soft style={{ marginTop: 10, padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Hand size={14} color={V.goldLt}>Why this hand?</Hand>
          <Mono size={9} color={V.gold}>TAP TO EXPAND</Mono>
        </div>
        <Mono size={10} style={{ marginTop: 4, display: 'block', color: V.ink2 }}>
          16 vs 10 is the hardest spot in BJ — you'll lose either way, but
          surrendering saves half.
        </Mono>
      </Card>
    </Phone>
  );
}

// Trainer feedback state — separate artboard
function TrainerFeedback() {
  return (
    <Phone title="Trainer" nav="learn">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Pill gold>Soft hands</Pill>
        <Mono size={10}>STREAK · 4</Mono>
      </div>

      <div style={{
        background: 'linear-gradient(180deg, #1a1f1a, #11150e)',
        border: `1px solid ${V.line}`, borderRadius: 14, padding: 10,
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', justifyContent: 'space-around' }}>
          <div>
            <Mono color={V.mute2}>DEALER</Mono>
            <div style={{ marginTop: 4 }}><PlayingCard r="6" s="♥"/></div>
          </div>
          <div>
            <Mono color={V.mute2}>SOFT 17</Mono>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <PlayingCard r="A" s="♠"/>
              <PlayingCard r="6" s="♣"/>
            </div>
          </div>
        </div>
      </div>

      <Card style={{ marginTop: 10, padding: 12, borderColor: V.neg,
                     background: 'rgba(215,122,122,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Hand size={15} color={V.neg}>You chose: Stand</Hand>
          <Mono color={V.gold}>CORRECT: DOUBLE</Mono>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: V.ink2, lineHeight: 1.55 }}>
          <span style={{ color: V.gold, fontWeight: 600 }}>Why double:</span>
          {' '}Soft 17 can't bust on one hit (Ace flips to 1). Dealer 6 is the
          weakest upcard — high bust rate. You want more money on the table when
          you have the edge.
        </div>
        <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: V.card2 }}>
          <Mono size={9} color={V.goldLt}>RULE OF THUMB</Mono>
          <div style={{ fontSize: 11, color: V.ink, marginTop: 3 }}>
            Soft 13–18 → double vs. dealer 4, 5, 6.
          </div>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
          <Pill>soft</Pill><Pill>A6</Pill><Pill>weak dealer</Pill>
        </div>
      </Card>

      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, padding: '12px', textAlign: 'center',
                      border: `1px solid ${V.line2}`, borderRadius: 10, fontSize: 12, color: V.ink2 }}>
          Add to review
        </div>
        <div style={{ flex: 2, padding: '12px', textAlign: 'center',
                      background: `linear-gradient(155deg, ${V.goldLt}, ${V.goldDk})`,
                      color: '#1a1207', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
          Next hand →
        </div>
      </div>
    </Phone>
  );
}

// ============ STRATEGY CHART (C) — all three, dark ========================
const ACTIONS = { H: '#b86a3c', S: '#7bb98c', D: V.gold, P: '#a76dc4',
                  R: '#d77a7a', Ds: V.gold };
const COLS = ['2','3','4','5','6','7','8','9','10','A'];

const HARD = [
  ['17+','S','S','S','S','S','S','S','S','S','S'],
  ['16', 'S','S','S','S','S','H','H','H','H','H'],
  ['15', 'S','S','S','S','S','H','H','H','H','H'],
  ['14', 'S','S','S','S','S','H','H','H','H','H'],
  ['13', 'S','S','S','S','S','H','H','H','H','H'],
  ['12', 'H','H','S','S','S','H','H','H','H','H'],
  ['11', 'D','D','D','D','D','D','D','D','D','H'],
  ['10', 'D','D','D','D','D','D','D','D','H','H'],
  ['9',  'H','D','D','D','D','H','H','H','H','H'],
  ['8-', 'H','H','H','H','H','H','H','H','H','H'],
];
const SOFT = [
  ['A,9','S','S','S','S','S','S','S','S','S','S'],
  ['A,8','S','S','S','S','S','S','S','S','S','S'],
  ['A,7','S','Ds','Ds','Ds','Ds','S','S','H','H','H'],
  ['A,6','H','D','D','D','D','H','H','H','H','H'],
  ['A,5','H','H','D','D','D','H','H','H','H','H'],
  ['A,2','H','H','H','D','D','H','H','H','H','H'],
];
const PAIRS = [
  ['A,A','P','P','P','P','P','P','P','P','P','P'],
  ['T,T','S','S','S','S','S','S','S','S','S','S'],
  ['9,9','P','P','P','P','P','S','P','P','S','S'],
  ['8,8','P','P','P','P','P','P','P','P','P','P'],
  ['7,7','P','P','P','P','P','P','H','H','H','H'],
  ['5,5','D','D','D','D','D','D','D','D','H','H'],
  ['2,2','P','P','P','P','P','P','H','H','H','H'],
];

function MiniChart({ rows, title }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    marginBottom: 4 }}>
        <Mono color={V.goldLt}>{title}</Mono>
        <Mono size={9}>{rows.length} rows</Mono>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '18px repeat(10, 1fr)', gap: 1 }}>
        <div/>
        {COLS.map(c => (
          <div key={c} style={{ textAlign: 'center', fontSize: 8, fontFamily: V.mono,
                                color: V.mute, paddingBottom: 1 }}>{c}</div>
        ))}
        {rows.map((row, ri) => (
          <React.Fragment key={ri}>
            <div style={{ fontSize: 8, fontFamily: V.mono, color: V.mute,
                          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                          paddingRight: 2 }}>{row[0]}</div>
            {row.slice(1).map((a, ci) => (
              <div key={ci} style={{ aspectRatio: '1', background: ACTIONS[a],
                                     borderRadius: 1, opacity: 0.92 }}/>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Chart() {
  return (
    <Phone title="Strategy" nav="learn" headerRight={<Pill>4–8 deck</Pill>}>
      <Mono style={{ display: 'block', marginBottom: 8 }}>
        FULL REFERENCE · DEALER STANDS SOFT 17
      </Mono>

      <Card style={{ padding: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MiniChart rows={HARD}  title="HARD HANDS"/>
          <MiniChart rows={SOFT}  title="SOFT HANDS"/>
          <MiniChart rows={PAIRS} title="PAIRS"/>
        </div>
      </Card>

      <Card style={{ padding: 10 }}>
        <Mono color={V.goldLt}>LEGEND</Mono>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          <Legend c={ACTIONS.H} l="Hit"/>
          <Legend c={ACTIONS.S} l="Stand"/>
          <Legend c={ACTIONS.D} l="Double"/>
          <Legend c={ACTIONS.P} l="Split"/>
          <Legend c={ACTIONS.R} l="Surrender"/>
          <Legend c={ACTIONS.Ds} l="Ds = Double if able, else Stand" stretch/>
        </div>
      </Card>
    </Phone>
  );
}

function Legend({ c, l, stretch }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10,
                   color: V.ink2, width: stretch ? '100%' : 'auto' }}>
      <span style={{ width: 12, height: 12, background: c, borderRadius: 3 }}/>
      {l}
    </span>
  );
}

Object.assign(window, { Dashboard, AddSession, Analytics, Learn, Trainer, TrainerFeedback, Chart });
