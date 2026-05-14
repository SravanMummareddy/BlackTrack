// Blackjack Trainer — 3 variants

function PlayingCard({ r, s, dark, hidden, size = 1 }) {
  const w = 38 * size, h = 54 * size;
  const red = s === '♥' || s === '♦';
  const bg = dark ? '#f6f3ec' : '#fff';
  const ink = red ? WF.neg : '#1a1a1a';
  if (hidden) {
    return <div style={{
      width: w, height: h, borderRadius: 5,
      background: dark ? '#1c1c20' : WF.fill,
      border: `1.2px solid ${dark ? WF.d_line : WF.line}`,
      backgroundImage: `repeating-linear-gradient(45deg, ${dark?'#26262b':WF.fill2} 0 4px, transparent 4px 8px)`,
    }}/>;
  }
  return (
    <div style={{
      width: w, height: h, borderRadius: 5, background: bg,
      border: `1.2px solid ${dark ? '#222' : WF.line}`,
      padding: 4, fontFamily: WF.mono, fontWeight: 700, color: ink,
      position: 'relative',
    }}>
      <div style={{ fontSize: 11*size }}>{r}</div>
      <div style={{ fontSize: 12*size, lineHeight: 1 }}>{s}</div>
      <div style={{ position: 'absolute', bottom: 3, right: 4, fontSize: 11*size,
                    transform: 'rotate(180deg)' }}>{r}{s}</div>
    </div>
  );
}

function TrainerA() {
  // A — Practice hand: dealer up + player two cards, action buttons
  return (
    <Phone title="Trainer" nav="learn">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Pill>Hard hands</Pill>
        <Mono>HAND 24 · ACC 82%</Mono>
      </div>

      {/* table */}
      <div style={{
        background: 'rgba(74,122,74,0.10)',
        border: `1.5px solid ${WF.line}`,
        borderRadius: 14, padding: '14px 10px',
      }}>
        <Mono>DEALER SHOWS</Mono>
        <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'center' }}>
          <PlayingCard r="10" s="♣"/>
          <PlayingCard hidden/>
        </div>

        <div style={{ height: 10 }}/>
        <Mono>YOUR HAND · 16</Mono>
        <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'center' }}>
          <PlayingCard r="9" s="♠"/>
          <PlayingCard r="7" s="♦"/>
        </div>
      </div>

      <div style={{ marginTop: 10, fontFamily: WF.hand, fontSize: 16, textAlign: 'center', fontWeight: 600 }}>
        What's the play?
      </div>

      <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
        {[
          ['HIT', WF.accent],
          ['STAND', null],
          ['DOUBLE', null],
          ['SPLIT', null],
          ['SURR', null],
          ['?', null],
        ].map(([k,c])=>(
          <div key={k} style={{
            padding: '12px 0', textAlign: 'center', borderRadius: 10,
            border: `1px solid ${WF.line}`,
            background: c || 'transparent', color: c ? '#fff' : WF.ink,
            fontSize: 11, fontWeight: 600,
          }}>{k}</div>
        ))}
      </div>
    </Phone>
  );
}

function TrainerB() {
  // B — Feedback state after wrong answer
  return (
    <Phone title="Trainer" nav="learn">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Pill>Soft hands</Pill>
        <Mono>STREAK · 4</Mono>
      </div>

      <div style={{
        background: 'rgba(74,122,74,0.10)',
        border: `1.5px solid ${WF.line}`,
        borderRadius: 14, padding: '10px',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <Mono>DEALER</Mono>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <PlayingCard r="6" s="♥"/>
            </div>
          </div>
          <div>
            <Mono>PLAYER · SOFT 17</Mono>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <PlayingCard r="A" s="♠"/>
              <PlayingCard r="6" s="♣"/>
            </div>
          </div>
        </div>
      </div>

      {/* result */}
      <Card style={{ marginTop: 10, borderColor: WF.warn, background: 'rgba(176,136,56,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <H size={15}>You picked: Stand</H>
          <Mono color={WF.neg}>✕ INCORRECT</Mono>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: WF.ink2, lineHeight: 1.5 }}>
          <strong style={{ color: WF.pos }}>Correct: Double down.</strong>
          {' '}Soft 17 vs. dealer 6 is the textbook double — the Ace protects
          you from busting and dealer 6 is the weakest upcard.
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          <Pill>soft</Pill><Pill>A6</Pill><Pill>dealer 4-6</Pill>
        </div>
      </Card>

      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, padding: '12px', textAlign: 'center',
                      border: `1px solid ${WF.line}`, borderRadius: 10, fontSize: 12 }}>
          Why?
        </div>
        <div style={{ flex: 2, padding: '12px', textAlign: 'center',
                      background: WF.accent, color: '#fff', borderRadius: 10, fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${WF.line}` }}>
          Next hand →
        </div>
      </div>
    </Phone>
  );
}

function TrainerC() {
  // C — Speed drill, dark
  return (
    <Phone title="" nav="learn" dark>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4, marginBottom: 8 }}>
        <span style={{ fontSize: 14, color: WF.d_mute }}>✕</span>
        <Pill dark>Speed drill</Pill>
        <Mono dark>0:42</Mono>
      </div>

      {/* timer bar */}
      <div style={{ height: 4, borderRadius: 2, background: WF.d_fill2,
                    overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: '70%', background: WF.accent }}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        <Card dark style={{ padding: 8, textAlign: 'center' }}>
          <Mono dark size={8}>CORRECT</Mono>
          <div style={{ fontFamily: WF.mono, fontSize: 22, fontWeight: 700, color: WF.pos }}>18</div>
        </Card>
        <Card dark style={{ padding: 8, textAlign: 'center' }}>
          <Mono dark size={8}>MISS</Mono>
          <div style={{ fontFamily: WF.mono, fontSize: 22, fontWeight: 700, color: WF.neg }}>3</div>
        </Card>
      </div>

      <div style={{
        background: '#0a1a0e',
        border: `1.5px solid ${WF.d_line}`,
        borderRadius: 14, padding: '14px 10px', textAlign: 'center',
      }}>
        <Mono dark>YOUR 12 vs DEALER 4</Mono>
        <div style={{ display: 'flex', gap: 14, marginTop: 10, justifyContent: 'center', alignItems: 'center' }}>
          <PlayingCard r="4" s="♣" dark/>
          <span style={{ color: WF.d_mute, fontSize: 16 }}>vs</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <PlayingCard r="5" s="♠" dark/>
            <PlayingCard r="7" s="♥" dark/>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {[
          ['HIT', WF.accent],
          ['STAND', null],
          ['DOUBLE', null],
          ['SPLIT', null],
        ].map(([k,c])=>(
          <div key={k} style={{
            padding: '16px 0', textAlign: 'center', borderRadius: 10,
            border: `1px solid ${WF.d_line}`,
            background: c || WF.d_fill, color: c ? '#fff' : WF.d_ink,
            fontSize: 13, fontWeight: 700, fontFamily: WF.mono,
          }}>{k}</div>
        ))}
      </div>
    </Phone>
  );
}

Object.assign(window, { TrainerA, TrainerB, TrainerC });
