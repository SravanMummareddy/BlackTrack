// Add Session flow — 3 variants of the entry experience.

function AddA() {
  // A — Full form, scrollable; basics + advanced collapsed
  return (
    <Phone title="Add session" nav="add" noNav>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: -4, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: WF.mute }}>Cancel</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: WF.accent }}>Save</span>
      </div>

      <Field label="Date" value="Sat, May 10 · 8:14 PM" />
      <Field label="Casino" value="MGM Grand · Las Vegas" />

      <div style={{ marginBottom: 10 }}>
        <Mono>GAME</Mono>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {['Blackjack','Slots','Poker','Roulette','Bacc','Other'].map((g,i) => (
            <Pill key={g} solid={i===0} accent={i===0}>{g}</Pill>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="Buy-in" value="$200" mono />
        <Field label="Cash-out" value="$320" mono />
      </div>

      <Card style={{ marginTop: 4, background: WF.fill, borderStyle: 'dashed' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Mono>NET</Mono>
          <span style={{ fontFamily: WF.mono, fontSize: 20, fontWeight: 700, color: WF.pos }}>+$120</span>
        </div>
      </Card>

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
                    color: WF.mute, fontSize: 11 }}>
        <span>▾</span> More details (mood, alcohol, tags, notes)
      </div>
    </Phone>
  );
}

function AddB() {
  // B — Step wizard, big touch numpad style
  return (
    <Phone title="" nav="add" noNav>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: -4, marginBottom: 14 }}>
        <span style={{ fontSize: 14 }}>✕</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              width: 24, height: 4, borderRadius: 2,
              background: i <= 1 ? WF.accent : WF.fill,
            }}/>
          ))}
        </div>
        <span style={{ fontSize: 11, color: WF.mute }}>Skip</span>
      </div>

      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <Mono>STEP 2 OF 5</Mono>
        <div style={{ fontFamily: WF.hand, fontSize: 26, fontWeight: 600, marginTop: 8, lineHeight: 1.2 }}>
          How much did you<br/>buy in for?
        </div>
      </div>

      <div style={{
        margin: '18px 0 14px', padding: '20px 0',
        textAlign: 'center', border: `2px solid ${WF.line}`, borderRadius: 14,
        fontFamily: WF.mono, fontSize: 36, fontWeight: 700,
      }}>
        $200<span style={{ color: WF.accent, marginLeft: 2 }}>|</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        {['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k => (
          <div key={k} style={{
            aspectRatio: '1.6', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${WF.line}`, borderRadius: 10,
            fontSize: 18, fontFamily: WF.mono, fontWeight: 500,
          }}>{k}</div>
        ))}
      </div>

      <div style={{
        marginTop: 10, padding: '10px', borderRadius: 12,
        background: WF.accent, color: '#fff', textAlign: 'center',
        fontWeight: 600, fontSize: 13,
        border: `1.5px solid ${WF.line}`,
      }}>Next →</div>
    </Phone>
  );
}

function AddC() {
  // C — Live timer + during-session entry
  return (
    <Phone title="Live session" nav="add" noNav dark>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: -4, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: WF.d_mute }}>End session</span>
        <Pill dark><span style={{ width: 6, height: 6, borderRadius: 3, background: WF.neg }} />REC</Pill>
      </div>

      <Card dark style={{ textAlign: 'center', padding: '14px 0' }}>
        <Mono dark>ELAPSED</Mono>
        <div style={{ fontFamily: WF.mono, fontSize: 36, fontWeight: 700,
                      color: WF.d_ink, lineHeight: 1, marginTop: 6 }}>
          01:42:18
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: WF.warn }}>
          ⚠ approaching your 2hr limit
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        <Card dark>
          <Mono dark>BUY-IN</Mono>
          <div style={{ fontFamily: WF.mono, fontSize: 18, fontWeight: 700, color: WF.d_ink }}>$200</div>
        </Card>
        <Card dark>
          <Mono dark>CURRENT</Mono>
          <div style={{ fontFamily: WF.mono, fontSize: 18, fontWeight: 700, color: WF.pos }}>$285</div>
        </Card>
      </div>

      <div style={{ marginTop: 10 }}>
        <Mono dark>QUICK ADJUST</Mono>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {['+$25','+$50','+$100','-$25','-$50'].map(b => (
            <div key={b} style={{
              flex: 1, textAlign: 'center', padding: '8px 0',
              border: `1px solid ${WF.d_line}`, borderRadius: 8,
              fontFamily: WF.mono, fontSize: 11,
              color: b.startsWith('-') ? WF.neg : WF.d_ink,
            }}>{b}</div>
          ))}
        </div>
      </div>

      <Card dark dashed style={{ marginTop: 10, padding: 8 }}>
        <div style={{ fontSize: 10, color: WF.d_mute, fontFamily: WF.hand, fontSize: 13 }}>
          ⏸ Reality check in 18 min — how are you feeling?
        </div>
      </Card>
    </Phone>
  );
}

function Field({ label, value, mono }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <Mono>{label.toUpperCase()}</Mono>
      <div style={{
        marginTop: 4, padding: '8px 10px',
        border: `1px solid ${WF.line}`, borderRadius: 8,
        fontFamily: mono ? WF.mono : WF.ui, fontSize: 13, fontWeight: 500,
      }}>{value}</div>
    </div>
  );
}

Object.assign(window, { AddA, AddB, AddC });
