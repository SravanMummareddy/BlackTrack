// Blackjack Learn — 3 variants

function LearnA() {
  // A — Course outline / chapters
  return (
    <Phone title="Learn" nav="learn">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <H size={16}>Blackjack basics</H>
        <Pill>5 / 12</Pill>
      </div>
      <div style={{ marginBottom: 12 }}><Bar pct={42}/></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          ['1', 'What is blackjack?',      'done',   '4 min'],
          ['2', 'Card values',             'done',   '3 min'],
          ['3', 'Dealer rules',            'done',   '5 min'],
          ['4', 'Hard hands',              'done',   '6 min'],
          ['5', 'Soft hands',              'active', '7 min'],
          ['6', 'Pairs & splitting',       'next',   '6 min'],
          ['7', 'Doubling down',           'next',   '4 min'],
          ['8', 'House edge',              'next',   '5 min'],
        ].map(([n,t,s,d]) => (
          <div key={n} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 10,
            border: `1px solid ${s === 'active' ? WF.accent : WF.line}`,
            background: s === 'active' ? 'rgba(58,109,240,0.06)' : 'transparent',
          }}>
            <div style={{ width: 24, height: 24, borderRadius: 12,
                          border: `1px solid ${WF.line}`,
                          background: s === 'done' ? WF.ink : 'transparent',
                          color: s === 'done' ? WF.paper : WF.mute,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontFamily: WF.mono }}>
              {s === 'done' ? '✓' : n}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{t}</div>
              <Mono size={9}>{d} · {s === 'active' ? 'in progress' : s === 'done' ? 'completed' : 'locked'}</Mono>
            </div>
            <span style={{ color: WF.mute, fontSize: 14 }}>›</span>
          </div>
        ))}
      </div>
    </Phone>
  );
}

function LearnB() {
  // B — Lesson reader view
  return (
    <Phone title="" nav="learn">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: -4, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>←</span>
        <Pill>Lesson 5 · Soft hands</Pill>
        <span style={{ fontSize: 14, color: WF.mute }}>⌃</span>
      </div>

      <div style={{ fontFamily: WF.hand, fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>
        Soft hands have an Ace<br/>that counts as 11.
      </div>

      <div style={{ fontSize: 12, lineHeight: 1.5, color: WF.ink2, marginTop: 10 }}>
        A "soft" hand can't bust on the next hit — the Ace flips to 1 if needed.
        That's why basic strategy is more aggressive on softs.
      </div>

      {/* example card row */}
      <Card style={{ marginTop: 12, padding: 10 }}>
        <Mono>EXAMPLE</Mono>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
          {[
            ['A','♠'], ['7','♥']
          ].map(([r,s],i) => (
            <div key={i} style={{
              width: 44, height: 60, borderRadius: 6, border: `1.5px solid ${WF.line}`,
              background: '#fff', padding: 4, position: 'relative',
              fontFamily: WF.mono, fontWeight: 700,
            }}>
              <div style={{ fontSize: 13, color: s === '♥' ? WF.neg : WF.ink }}>{r}</div>
              <div style={{ fontSize: 14, color: s === '♥' ? WF.neg : WF.ink }}>{s}</div>
              <div style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 11,
                            color: s === '♥' ? WF.neg : WF.ink, transform: 'rotate(180deg)' }}>{r}{s}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12 }}>
          <Mono size={11}>SOFT 18</Mono> — A counts as 11
        </div>
      </Card>

      <Card style={{ marginTop: 10, padding: 10, background: WF.fill }}>
        <div style={{ fontFamily: WF.hand, fontSize: 14, fontWeight: 600 }}>Key rule</div>
        <div style={{ fontSize: 11, color: WF.ink2, marginTop: 4, lineHeight: 1.5 }}>
          Hit soft 17 vs. dealer 9, 10, A. Stand on soft 19+.
        </div>
      </Card>

      <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, padding: '10px', textAlign: 'center',
                      border: `1px solid ${WF.line}`, borderRadius: 10, fontSize: 12 }}>← Prev</div>
        <div style={{ flex: 2, padding: '10px', textAlign: 'center',
                      background: WF.accent, color: '#fff', borderRadius: 10, fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${WF.line}` }}>Next: try a quiz →</div>
      </div>
    </Phone>
  );
}

function LearnC() {
  // C — Hub grid: Lessons / Flashcards / Quiz / Trainer / Chart
  return (
    <Phone title="Learn" nav="learn" dark>
      <Card dark style={{ marginBottom: 10 }}>
        <Mono dark>YOUR STREAK</Mono>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontFamily: WF.mono, fontSize: 26, fontWeight: 700, color: WF.d_ink }}>7</div>
          <div style={{ fontSize: 11, color: WF.d_mute }}>days · accuracy 82%</div>
        </div>
        {/* dots */}
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {Array.from({length: 14}).map((_,i)=>(
            <div key={i} style={{
              flex: 1, height: 18, borderRadius: 3,
              background: i < 7 ? WF.accent : WF.d_fill2,
              border: `1px solid ${WF.d_line}`,
            }}/>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { t: 'Lessons',     s: '5 of 12 done',  glyph: '☷', accent: false },
          { t: 'Flashcards',  s: '120 cards',     glyph: '♢', accent: true  },
          { t: 'Quiz',        s: 'last: 8/10',    glyph: '?', accent: false },
          { t: 'Trainer',     s: 'play hands',    glyph: '♠', accent: false },
          { t: 'Strategy',    s: 'reference',     glyph: '▦', accent: false },
          { t: 'Mistakes',    s: '12 to review',  glyph: '!', accent: false },
        ].map(c => (
          <div key={c.t} style={{
            padding: 12, borderRadius: 12, aspectRatio: '1.05',
            border: `1px solid ${WF.d_line}`,
            background: c.accent ? 'rgba(58,109,240,0.12)' : WF.d_fill,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 22, color: c.accent ? WF.accent : WF.d_ink }}>{c.glyph}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: WF.d_ink }}>{c.t}</div>
              <div style={{ fontSize: 9, color: WF.d_mute, marginTop: 2 }}>{c.s}</div>
            </div>
          </div>
        ))}
      </div>
    </Phone>
  );
}

Object.assign(window, { LearnA, LearnB, LearnC });
