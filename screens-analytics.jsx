// Analytics — 3 variants

function AnalyticsA() {
  // A — Tabs + cumulative bankroll line
  return (
    <Phone title="Analytics" nav="history">
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {['P/L','By Casino','By Game','Mood'].map((t,i)=>(
          <Pill key={t} solid={i===0} accent={i===0}>{t}</Pill>
        ))}
      </div>

      <Card style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Mono>CUMULATIVE BANKROLL</Mono>
          <Mono>YTD</Mono>
        </div>
        <svg viewBox="0 0 260 110" style={{ width: '100%', marginTop: 6 }}>
          {/* grid */}
          {[0,1,2,3,4].map(i=>(
            <line key={i} x1="0" y1={20*i+10} x2="260" y2={20*i+10}
                  stroke={WF.fill2} strokeWidth="0.5" strokeDasharray="2 2"/>
          ))}
          <line x1="0" y1="70" x2="260" y2="70" stroke={WF.mute} strokeWidth="0.5"/>
          {/* line */}
          <path d="M0 80 L20 70 L40 78 L60 60 L80 55 L100 65 L120 45 L140 50 L160 30 L180 38 L200 22 L220 32 L240 18 L260 24"
                fill="none" stroke={WF.accent} strokeWidth="1.5"/>
          <path d="M0 80 L20 70 L40 78 L60 60 L80 55 L100 65 L120 45 L140 50 L160 30 L180 38 L200 22 L220 32 L240 18 L260 24 L260 110 L0 110 Z"
                fill={WF.accent} opacity="0.08"/>
          {/* dots */}
          <circle cx="240" cy="18" r="3" fill={WF.accent} stroke="#fff" strokeWidth="1.5"/>
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      fontFamily: WF.mono, fontSize: 8, color: WF.mute, marginTop: 2 }}>
          <span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span>
        </div>
      </Card>

      <Card>
        <H size={14}>Top performers</H>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['Bellagio','+$640', 80],
            ['Cosmo',   '+$310', 50],
            ['MGM Grand','+$210', 32],
            ['Caesars', '-$180', 28],
          ].map(([n,v,w])=>(
            <div key={n}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:3 }}>
                <span>{n}</span><Mono color={v.startsWith('-')?WF.neg:WF.pos}>{v}</Mono>
              </div>
              <Bar pct={w} neg={v.startsWith('-')}/>
            </div>
          ))}
        </div>
      </Card>
    </Phone>
  );
}

function AnalyticsB() {
  // B — Mood × Result scatter + heatmap
  return (
    <Phone title="Patterns" nav="history">
      <Card style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <H size={14}>Mood vs. Result</H>
          <Mono>30 DAYS</Mono>
        </div>
        <svg viewBox="0 0 240 130" style={{ width: '100%', marginTop: 6 }}>
          <line x1="20" y1="65" x2="230" y2="65" stroke={WF.mute} strokeWidth="0.5" strokeDasharray="2 2"/>
          <line x1="125" y1="10" x2="125" y2="125" stroke={WF.mute} strokeWidth="0.5" strokeDasharray="2 2"/>
          <text x="20" y="14" fontSize="7" fill={WF.mute} fontFamily={WF.mono}>WIN</text>
          <text x="20" y="124" fontSize="7" fill={WF.mute} fontFamily={WF.mono}>LOSS</text>
          <text x="190" y="124" fontSize="7" fill={WF.mute} fontFamily={WF.mono}>HAPPY →</text>
          <text x="22" y="124" fontSize="7" fill={WF.mute} fontFamily={WF.mono}>← TILT</text>
          {[
            [60,80,WF.neg],[80,90,WF.neg],[100,60,WF.warn],[140,40,WF.pos],
            [170,30,WF.pos],[180,55,WF.pos],[110,75,WF.neg],[155,45,WF.pos],
            [70,95,WF.neg],[200,35,WF.pos],[145,60,WF.warn],[185,42,WF.pos],
          ].map(([x,y,c],i)=>(
            <circle key={i} cx={x} cy={y} r="4" fill={c} opacity="0.6" stroke={c} strokeWidth="1"/>
          ))}
        </svg>
        <div style={{ fontSize: 10, color: WF.mute, fontFamily: WF.hand, fontSize: 13, marginTop: 4 }}>
          ⓘ Sessions where you felt "tilted" averaged -$74.
        </div>
      </Card>

      <H size={14}>Calendar heatmap</H>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 2, marginTop: 6 }}>
        {Array.from({length: 91}).map((_, i) => {
          const seed = (i * 9301 + 49297) % 233280 / 233280;
          const v = seed > 0.7 ? seed : 0;
          const neg = i % 13 === 5;
          return (
            <div key={i} style={{
              aspectRatio: '1', borderRadius: 2,
              background: v === 0 ? WF.fill : neg ? `rgba(161,74,74,${0.3+v*0.7})` : `rgba(58,109,240,${0.3+v*0.7})`,
              border: `0.5px solid ${WF.line}`,
            }}/>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    fontFamily: WF.mono, fontSize: 8, color: WF.mute, marginTop: 4 }}>
        <span>MAR</span><span>APR</span><span>MAY</span>
      </div>
    </Phone>
  );
}

function AnalyticsC() {
  // C — Per-game breakdown, dark
  return (
    <Phone title="Breakdown" nav="history" dark>
      <Card dark style={{ marginBottom: 8 }}>
        <Mono dark>BY GAME · ALL TIME</Mono>
        {/* donut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="32" fill="none" stroke={WF.accent} strokeWidth="14"
                    strokeDasharray={`${2*Math.PI*32*0.45} ${2*Math.PI*32}`} transform="rotate(-90 45 45)"/>
            <circle cx="45" cy="45" r="32" fill="none" stroke={WF.warn} strokeWidth="14"
                    strokeDasharray={`${2*Math.PI*32*0.25} ${2*Math.PI*32}`}
                    strokeDashoffset={`-${2*Math.PI*32*0.45}`} transform="rotate(-90 45 45)"/>
            <circle cx="45" cy="45" r="32" fill="none" stroke={WF.pos} strokeWidth="14"
                    strokeDasharray={`${2*Math.PI*32*0.18} ${2*Math.PI*32}`}
                    strokeDashoffset={`-${2*Math.PI*32*0.70}`} transform="rotate(-90 45 45)"/>
            <circle cx="45" cy="45" r="32" fill="none" stroke={WF.d_fill2} strokeWidth="14"
                    strokeDasharray={`${2*Math.PI*32*0.12} ${2*Math.PI*32}`}
                    strokeDashoffset={`-${2*Math.PI*32*0.88}`} transform="rotate(-90 45 45)"/>
          </svg>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              ['Blackjack', '45%', WF.accent, '+$820'],
              ['Poker',     '25%', WF.warn,   '-$120'],
              ['Roulette',  '18%', WF.pos,    '+$340'],
              ['Other',     '12%', WF.d_fill2,'+$244'],
            ].map(([n,p,c,v])=>(
              <div key={n} style={{ display:'flex', alignItems:'center', gap:6, fontSize:10 }}>
                <span style={{ width: 8, height: 8, background: c, borderRadius: 2 }}/>
                <span style={{ color: WF.d_ink, flex: 1 }}>{n}</span>
                <Mono dark size={9}>{p}</Mono>
                <Mono color={v.startsWith('-')?WF.neg:WF.pos} size={10}>{v}</Mono>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card dark>
        <H size={14} dark>Duration vs. P/L</H>
        <svg viewBox="0 0 240 80" style={{ width: '100%', marginTop: 6 }}>
          <line x1="0" y1="40" x2="240" y2="40" stroke={WF.d_line} strokeWidth="0.5"/>
          {[15,35,55,75,95,115,135,155,175,195,215].map((x,i)=>{
            const y = 40 - (Math.sin(i*0.8)*15 - i*1.5);
            return <circle key={i} cx={x} cy={y} r="3" fill={y<40?WF.pos:WF.neg} opacity="0.7"/>;
          })}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      fontFamily: WF.mono, fontSize: 8, color: WF.d_mute, marginTop: 2 }}>
          <span>30m</span><span>1h</span><span>2h</span><span>3h+</span>
        </div>
        <div style={{ fontSize: 10, color: WF.d_mute, marginTop: 6, fontFamily: WF.hand, fontSize: 13 }}>
          → Sessions over 2hr trend negative.
        </div>
      </Card>
    </Phone>
  );
}

Object.assign(window, { AnalyticsA, AnalyticsB, AnalyticsC });
