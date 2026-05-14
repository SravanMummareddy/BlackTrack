// Strategy Chart — 3 variants

const ACTIONS = { H: { c: WF.warn, l: 'H' }, S: { c: WF.pos, l: 'S' },
                  D: { c: WF.accent, l: 'D' }, P: { c: '#7a4aa1', l: 'P' },
                  R: { c: WF.neg, l: 'R' }, Ds: { c: WF.accent, l: 'Ds' } };

const HARD_ROWS = [
  ['17+', 'S','S','S','S','S','S','S','S','S','S'],
  ['16',  'S','S','S','S','S','H','H','H','H','H'],
  ['15',  'S','S','S','S','S','H','H','H','H','H'],
  ['14',  'S','S','S','S','S','H','H','H','H','H'],
  ['13',  'S','S','S','S','S','H','H','H','H','H'],
  ['12',  'H','H','S','S','S','H','H','H','H','H'],
  ['11',  'D','D','D','D','D','D','D','D','D','H'],
  ['10',  'D','D','D','D','D','D','D','D','H','H'],
  ['9',   'H','D','D','D','D','H','H','H','H','H'],
  ['8-',  'H','H','H','H','H','H','H','H','H','H'],
];

const COLS = ['2','3','4','5','6','7','8','9','10','A'];

function ChartA() {
  return (
    <Phone title="Strategy" nav="learn">
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <Pill solid accent>Hard</Pill>
        <Pill>Soft</Pill>
        <Pill>Pairs</Pill>
      </div>
      <div style={{ fontSize: 10, color: WF.mute, marginBottom: 6, fontFamily: WF.hand, fontSize: 12 }}>
        Rows = your hand. Cols = dealer upcard.
      </div>

      <div style={{ display: 'grid',
                    gridTemplateColumns: '24px repeat(10, 1fr)',
                    gap: 2 }}>
        <div/>
        {COLS.map(c=>(
          <div key={c} style={{ textAlign: 'center', fontSize: 9, fontFamily: WF.mono,
                                color: WF.mute, paddingBottom: 2 }}>{c}</div>
        ))}
        {HARD_ROWS.map((row, ri) => (
          <React.Fragment key={ri}>
            <div style={{ fontSize: 9, fontFamily: WF.mono, color: WF.mute,
                          textAlign: 'right', paddingRight: 3,
                          display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {row[0]}
            </div>
            {row.slice(1).map((a, ci) => {
              const act = ACTIONS[a];
              return (
                <div key={ci} style={{
                  aspectRatio: '1',
                  background: act.c, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, fontFamily: WF.mono,
                  borderRadius: 2,
                }}>{act.l}</div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <Legend c={WF.warn}    l="Hit"/>
        <Legend c={WF.pos}     l="Stand"/>
        <Legend c={WF.accent}  l="Double"/>
        <Legend c="#7a4aa1"    l="Split"/>
        <Legend c={WF.neg}     l="Surrender"/>
      </div>
    </Phone>
  );
}

function Legend({ c, l }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
      <span style={{ width: 12, height: 12, background: c, borderRadius: 2 }}/>
      {l}
    </span>
  );
}

function ChartB() {
  // B — Lookup view: pick dealer + player, show single answer big
  return (
    <Phone title="Quick lookup" nav="learn">
      <div style={{ fontFamily: WF.hand, fontSize: 16, color: WF.mute2, marginBottom: 10 }}>
        Look it up fast. Tap your hand and the dealer's upcard.
      </div>

      <Mono>DEALER UPCARD</Mono>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 3, marginTop: 4 }}>
        {COLS.map((c,i)=>(
          <div key={c} style={{
            aspectRatio: '1', borderRadius: 5,
            border: `1px solid ${WF.line}`,
            background: i === 4 ? WF.ink : 'transparent',
            color: i === 4 ? WF.paper : WF.ink,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: WF.mono, fontSize: 11, fontWeight: 700,
          }}>{c}</div>
        ))}
      </div>

      <div style={{ height: 8 }}/>
      <Mono>YOUR HAND</Mono>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
        {['5-8','9','10','11','12','13','14','15','16','17+','A2','A7','5-5','8-8'].map((c,i)=>(
          <div key={c} style={{
            padding: '5px 10px', borderRadius: 999,
            border: `1px solid ${WF.line}`,
            background: c === '16' ? WF.ink : 'transparent',
            color: c === '16' ? WF.paper : WF.ink,
            fontFamily: WF.mono, fontSize: 11, fontWeight: 600,
          }}>{c}</div>
        ))}
      </div>

      <Card style={{ marginTop: 12, padding: 14, textAlign: 'center', background: WF.fill }}>
        <Mono>16 vs 6</Mono>
        <div style={{ fontFamily: WF.hand, fontSize: 40, fontWeight: 700, color: WF.pos, marginTop: 4, lineHeight: 1 }}>
          STAND
        </div>
        <div style={{ fontSize: 11, color: WF.ink2, marginTop: 8, lineHeight: 1.5 }}>
          Dealer 4-6 is bust-prone. Let them draw to the bust.
        </div>
      </Card>
    </Phone>
  );
}

function ChartC() {
  // C — All three charts stacked, dark, compact (reference mode)
  const renderMini = (rows, title) => (
    <div>
      <Mono dark>{title}</Mono>
      <div style={{ display: 'grid', gridTemplateColumns: '14px repeat(10, 1fr)', gap: 1, marginTop: 3 }}>
        <div/>
        {COLS.map(c=>(
          <div key={c} style={{ textAlign:'center', fontSize: 7, fontFamily: WF.mono,
                                color: WF.d_mute }}>{c}</div>
        ))}
        {rows.map((row, ri) => (
          <React.Fragment key={ri}>
            <div style={{ fontSize: 7, fontFamily: WF.mono, color: WF.d_mute,
                          display:'flex',alignItems:'center',justifyContent:'flex-end' }}>
              {row[0]}
            </div>
            {row.slice(1).map((a, ci) => (
              <div key={ci} style={{ aspectRatio: '1', background: ACTIONS[a].c,
                                     borderRadius: 1 }}/>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const SOFT_ROWS = [
    ['A,9','S','S','S','S','S','S','S','S','S','S'],
    ['A,8','S','S','S','S','S','S','S','S','S','S'],
    ['A,7','S','Ds','Ds','Ds','Ds','S','S','H','H','H'],
    ['A,6','H','D','D','D','D','H','H','H','H','H'],
    ['A,5','H','H','D','D','D','H','H','H','H','H'],
    ['A,2','H','H','H','D','D','H','H','H','H','H'],
  ];
  const PAIR_ROWS = [
    ['A,A','P','P','P','P','P','P','P','P','P','P'],
    ['10,10','S','S','S','S','S','S','S','S','S','S'],
    ['9,9','P','P','P','P','P','S','P','P','S','S'],
    ['8,8','P','P','P','P','P','P','P','P','P','P'],
    ['7,7','P','P','P','P','P','P','H','H','H','H'],
    ['5,5','D','D','D','D','D','D','D','D','H','H'],
    ['2,2','P','P','P','P','P','P','H','H','H','H'],
  ];

  return (
    <Phone title="Chart" nav="learn" dark>
      <div style={{ fontSize: 10, color: WF.d_mute, marginBottom: 8, fontFamily: WF.hand, fontSize: 12 }}>
        Full reference · 4–8 deck, dealer stands soft 17
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {renderMini(HARD_ROWS, 'HARD')}
        {renderMini(SOFT_ROWS, 'SOFT')}
        {renderMini(PAIR_ROWS, 'PAIRS')}
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        <Legend c={WF.warn} l="H"/>
        <Legend c={WF.pos} l="S"/>
        <Legend c={WF.accent} l="D"/>
        <Legend c="#7a4aa1" l="P"/>
        <Legend c={WF.neg} l="R"/>
      </div>
    </Phone>
  );
}

Object.assign(window, { ChartA, ChartB, ChartC });
