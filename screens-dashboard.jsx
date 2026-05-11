// Dashboard variants — three takes on the home screen.

function DashA() {
  // A — Classic finance card: hero net, stat grid, trend, RG reminder
  return (
    <Phone title="Home" nav="dashboard">
      <Card style={{ marginBottom: 8 }}>
        <Mono>NET · ALL TIME</Mono>
        <div style={{ fontFamily: WF.mono, fontSize: 30, fontWeight: 700,
                      color: WF.pos, lineHeight: 1, marginTop: 4 }}>
          +$1,284
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center' }}>
          <Pill>↑ 12 sessions</Pill>
          <Pill>14 wins / 8 loss</Pill>
        </div>
        {/* mini trend */}
        <svg viewBox="0 0 240 50" style={{ width: '100%', marginTop: 8 }}>
          <path d="M0 38 L20 32 L40 36 L60 24 L80 28 L100 20 L120 30 L140 18 L160 22 L180 12 L200 16 L220 10 L240 14"
                fill="none" stroke={WF.accent} strokeWidth="1.5" />
          <path d="M0 38 L20 32 L40 36 L60 24 L80 28 L100 20 L120 30 L140 18 L160 22 L180 12 L200 16 L220 10 L240 14 L240 50 L0 50 Z"
                fill={WF.accent} opacity="0.08" />
        </svg>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <Card><Stat label="this month" value="+$214" sign="+" /></Card>
        <Card><Stat label="wagered" value="$8.4k" /></Card>
        <Card><Stat label="biggest win" value="+$520" sign="+" /></Card>
        <Card><Stat label="biggest loss" value="-$310" sign="-" /></Card>
      </div>

      <Card dashed style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ width: 22, height: 22, borderRadius: 11,
                      border: `1px solid ${WF.line}`, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11 }}>i</div>
        <div>
          <H size={14}>You're 60% into May's budget.</H>
          <div style={{ fontSize: 10, color: WF.mute, marginTop: 2 }}>
            Tap to review your limits or take a break.
          </div>
        </div>
      </Card>
    </Phone>
  );
}

function DashB() {
  // B — Period-switcher; single big number + ledger preview underneath
  return (
    <Phone title="Hello, Alex" nav="dashboard">
      <div style={{ display: 'flex', gap: 4, marginBottom: 8,
                    borderBottom: `1px solid ${WF.line}`, paddingBottom: 4 }}>
        {['Week','Month','Year','All'].map((p,i) => (
          <div key={p} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 6,
            background: i === 1 ? WF.ink : 'transparent',
            color: i === 1 ? WF.paper : WF.ink2,
            fontWeight: i === 1 ? 600 : 400,
          }}>{p}</div>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '14px 0 6px' }}>
        <Mono>MAY · NET P/L</Mono>
        <div style={{ fontFamily: WF.mono, fontSize: 40, fontWeight: 700,
                      color: WF.pos, lineHeight: 1, marginTop: 6 }}>
          +$214
        </div>
        <div style={{ fontSize: 10, color: WF.mute, marginTop: 6, fontFamily: WF.hand, fontSize: 14 }}>
          across 5 sessions · 3W 2L
        </div>
      </div>

      <svg viewBox="0 0 260 60" style={{ width: '100%', marginTop: 4, marginBottom: 10 }}>
        {[0,1,2,3,4].map(i => (
          <g key={i} transform={`translate(${30 + i*48}, 0)`}>
            <rect x="-12" y={20 + (i%2)*8} width="24" height={40 - (i%2)*8 - i*2}
                  fill="none" stroke={WF.line} strokeWidth="1" />
            <rect x="-12" y={20 + (i%2)*8} width="24" height={(40 - (i%2)*8 - i*2) * 0.6}
                  fill={i === 4 ? WF.neg : WF.accent} opacity="0.4" />
          </g>
        ))}
      </svg>

      <H size={16}>Recent</H>
      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { d: 'Sat May 10', c: 'MGM Vegas',  g: 'Blackjack', v: '+$120', s: '+' },
          { d: 'Wed May 7',  c: 'Bellagio',   g: 'Poker',     v: '-$80',  s: '-' },
          { d: 'Sat May 3',  c: 'Cosmo',      g: 'Blackjack', v: '+$210', s: '+' },
        ].map((r, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 8px', borderRadius: 8,
            border: `1px solid ${WF.line}`,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{r.c}</div>
              <div style={{ fontSize: 9, color: WF.mute }}>{r.d} · {r.g}</div>
            </div>
            <Mono size={13} color={r.s === '+' ? WF.pos : WF.neg}>{r.v}</Mono>
          </div>
        ))}
      </div>
    </Phone>
  );
}

function DashC() {
  // C — Dark variant: bankroll-first, ring indicator for monthly budget
  return (
    <Phone title="Bankroll" nav="dashboard" dark>
      <Card dark style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {/* budget ring */}
        <svg width="76" height="76" viewBox="0 0 76 76">
          <circle cx="38" cy="38" r="32" fill="none" stroke={WF.d_line} strokeWidth="4" />
          <circle cx="38" cy="38" r="32" fill="none" stroke={WF.accent} strokeWidth="4"
            strokeDasharray={`${2*Math.PI*32*0.6} ${2*Math.PI*32}`}
            transform="rotate(-90 38 38)" strokeLinecap="round" />
          <text x="38" y="36" textAnchor="middle" fontFamily={WF.mono}
                fontSize="11" fontWeight="700" fill={WF.d_ink}>60%</text>
          <text x="38" y="48" textAnchor="middle" fontFamily={WF.ui}
                fontSize="7" fill={WF.d_mute}>of budget</text>
        </svg>
        <div>
          <Mono dark>MAY BUDGET · $500</Mono>
          <div style={{ fontFamily: WF.mono, fontSize: 22, fontWeight: 700,
                        color: WF.d_ink, lineHeight: 1, marginTop: 4 }}>
            $200 left
          </div>
          <div style={{ fontSize: 10, color: WF.d_mute, marginTop: 4 }}>
            13 days remaining
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
        <Card dark style={{ padding: 8 }}>
          <Mono dark size={8}>SESS</Mono>
          <div style={{ fontFamily: WF.mono, fontSize: 16, fontWeight: 700, color: WF.d_ink }}>12</div>
        </Card>
        <Card dark style={{ padding: 8 }}>
          <Mono dark size={8}>WIN %</Mono>
          <div style={{ fontFamily: WF.mono, fontSize: 16, fontWeight: 700, color: WF.d_ink }}>58%</div>
        </Card>
        <Card dark style={{ padding: 8 }}>
          <Mono dark size={8}>AVG</Mono>
          <div style={{ fontFamily: WF.mono, fontSize: 16, fontWeight: 700, color: WF.pos }}>+$18</div>
        </Card>
      </div>

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <H size={14} dark>Calendar</H>
        <Mono dark size={9}>MAY</Mono>
      </div>
      {/* heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginTop: 4 }}>
        {Array.from({ length: 28 }).map((_, i) => {
          const intensity = [0,0,0,0.3,0,0.6,0.9,0,0,0.4,0,0,0.7,0,0,0,0.3,0,0,0.5,0,0,0,0.8,0,0,0,0.2][i] || 0;
          const neg = [5,9,16,23].includes(i);
          return (
            <div key={i} style={{
              aspectRatio: '1', borderRadius: 3,
              background: intensity === 0
                ? WF.d_fill
                : neg ? `rgba(161,74,74,${0.3+intensity*0.7})` : `rgba(58,109,240,${0.3+intensity*0.7})`,
              border: `1px solid ${WF.d_line}`,
            }} />
          );
        })}
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: WF.d_mute,
                    display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: WF.warn }} />
        Reality check at 90 min · Reminder on
      </div>
    </Phone>
  );
}

Object.assign(window, { DashA, DashB, DashC });
