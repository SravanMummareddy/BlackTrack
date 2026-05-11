// Bankroll & Limits — 3 variants

function BankrollA() {
  return (
    <Phone title="Bankroll & limits" nav="settings">
      <Card style={{ marginBottom: 8 }}>
        <Mono>MONTHLY BUDGET · MAY</Mono>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontFamily: WF.mono, fontSize: 22, fontWeight: 700 }}>$300 / $500</span>
          <Mono color={WF.warn} size={11}>60%</Mono>
        </div>
        <div style={{ marginTop: 8 }}><Bar pct={60}/></div>
        <div style={{ fontSize: 10, color: WF.mute, marginTop: 6 }}>
          13 days left · $200 remaining
        </div>
      </Card>

      <H size={14}>Guardrails</H>
      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          ['Max loss per session', '$150', 50],
          ['Max time per session', '120 min', 80],
          ['Cooldown after big loss', '48 hrs', 0],
          ['Bankroll goal',          '$2,000', 64],
        ].map(([k,v,p])=>(
          <Card key={k} style={{ padding: 8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize: 12 }}>{k}</span>
              <Mono size={11}>{v}</Mono>
            </div>
            {p>0 && <div style={{ marginTop: 6 }}><Bar pct={p}/></div>}
          </Card>
        ))}
      </div>

      <Card dashed style={{ marginTop: 10, padding: 8, background: WF.fill }}>
        <div style={{ fontFamily: WF.hand, fontSize: 14, fontWeight: 600 }}>
          Need to step back?
        </div>
        <div style={{ fontSize: 10, color: WF.mute, marginTop: 2 }}>
          Take a 24h / 7d / 30d break · find help →
        </div>
      </Card>
    </Phone>
  );
}

function BankrollB() {
  // Slider-driven setup
  return (
    <Phone title="Set your limits" nav="settings">
      <div style={{ fontFamily: WF.hand, fontSize: 16, color: WF.mute2, marginBottom: 10 }}>
        Drag to adjust. We'll warn you, not block you.
      </div>

      {[
        { k: 'Monthly budget', v: '$500', pct: 50 },
        { k: 'Per-session max loss', v: '$150', pct: 30 },
        { k: 'Per-session max time',  v: '2 hrs', pct: 40 },
        { k: 'Bankroll goal',         v: '$2,000', pct: 65 },
      ].map(s => (
        <div key={s.k} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{s.k}</span>
            <Mono size={12} color={WF.ink}>{s.v}</Mono>
          </div>
          <div style={{ position: 'relative', height: 18 }}>
            <div style={{ position: 'absolute', top: 7, left: 0, right: 0, height: 4,
                          background: WF.fill, borderRadius: 2, border: `1px solid ${WF.line}` }}/>
            <div style={{ position: 'absolute', top: 7, left: 0, width: `${s.pct}%`, height: 4,
                          background: WF.accent, borderRadius: 2 }}/>
            <div style={{ position: 'absolute', top: 0, left: `calc(${s.pct}% - 9px)`,
                          width: 18, height: 18, borderRadius: 9, background: '#fff',
                          border: `1.5px solid ${WF.line}`,
                          boxShadow: '0 1px 0 rgba(26,26,26,.15)' }}/>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 6 }}>
        <Pill>weekly</Pill>
        <Pill solid accent>monthly</Pill>
        <Pill>quarterly</Pill>
      </div>
    </Phone>
  );
}

function BankrollC() {
  // Warning state - dark
  return (
    <Phone title="Limit reached" nav="settings" dark>
      <Card dark style={{ borderColor: WF.warn, background: 'rgba(176,136,56,0.08)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: 16,
                        border: `1.5px solid ${WF.warn}`, color: WF.warn,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 700 }}>!</div>
          <div>
            <div style={{ fontFamily: WF.hand, fontSize: 18, color: WF.d_ink, fontWeight: 600 }}>
              You hit your monthly budget.
            </div>
            <div style={{ fontSize: 10, color: WF.d_mute, marginTop: 2 }}>
              May 24 · $500 of $500 used
            </div>
          </div>
        </div>
      </Card>

      <div style={{ marginTop: 10, fontSize: 11, color: WF.d_ink, lineHeight: 1.5 }}>
        We've paused tracking suggestions. You can keep logging — but here's a moment to think:
      </div>

      <Card dark style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: WF.d_ink, marginBottom: 6 }}>
          Quick reflection
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['Did I follow my limit today?','Am I chasing a loss?','Would tomorrow-me be okay with this?'].map(q=>(
            <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4,
                            border: `1px solid ${WF.d_line}` }}/>
              <span style={{ color: WF.d_ink }}>{q}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div style={{ padding: '10px 0', textAlign: 'center', borderRadius: 8,
                      border: `1px solid ${WF.d_line}`, color: WF.d_ink, fontSize: 12 }}>
          Take 24h break
        </div>
        <div style={{ padding: '10px 0', textAlign: 'center', borderRadius: 8,
                      background: WF.accent, color: '#fff', fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${WF.line}` }}>
          Get help
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: WF.d_mute, textAlign: 'center' }}>
        1-800-GAMBLER · ncpgambling.org
      </div>
    </Phone>
  );
}

Object.assign(window, { BankrollA, BankrollB, BankrollC });
