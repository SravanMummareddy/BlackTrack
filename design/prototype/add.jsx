// Add Session sheet — multi-game ledger

function AddSheet({ open, onClose }) {
  const [casino, setCasino] = React.useState('MGM Grand · Las Vegas');
  const [games, setGames] = React.useState([
    { name: 'Blackjack', buyIn: 200, cashOut: 320, expanded: false },
    { name: 'Poker',     buyIn: 100, cashOut: 60,  expanded: false },
  ]);
  const [advanced, setAdvanced] = React.useState(false);
  const [savedFlash, setSavedFlash] = React.useState(false);

  const total = games.reduce((a,g) => a + (g.cashOut - g.buyIn), 0);
  const totalIn = games.reduce((a,g) => a + g.buyIn, 0);
  const totalOut = games.reduce((a,g) => a + g.cashOut, 0);

  const addGame = () => {
    setGames(g => [...g, { name: 'New game', buyIn: 0, cashOut: 0, expanded: true }]);
  };

  const updateGame = (i, patch) => {
    setGames(g => g.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  };

  const removeGame = (i) => {
    setGames(g => g.filter((_, idx) => idx !== i));
  };

  const save = () => {
    setSavedFlash(true);
    setTimeout(() => { setSavedFlash(false); onClose(); }, 700);
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{ padding: '4px 20px 14px', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onClose}
          style={{ background: 'none', border: 'none', color: V.mute, fontSize: 13,
                   cursor: 'pointer', fontFamily: V.ui }}>Cancel</button>
        <div style={{ fontFamily: V.display, fontSize: 17, fontWeight: 600 }}>
          New session
        </div>
        <button onClick={save} disabled={savedFlash}
          style={{ background: 'none', border: 'none',
                   color: savedFlash ? V.pos : V.gold,
                   fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: V.ui }}>
          {savedFlash ? '✓ Saved' : 'Save'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        <Field label="Casino" value={casino} onChange={setCasino}/>
        <Field label="Date" value="Sat May 10 · 8:14 PM"/>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      margin: '14px 0 8px' }}>
          <Mono>GAMES PLAYED</Mono>
          <button onClick={addGame} className="btn-press"
            style={{ background: 'none', border: 'none', color: V.gold,
                     fontSize: 11, fontWeight: 700, cursor: 'pointer',
                     fontFamily: V.mono, letterSpacing: 0.4 }}>
            + ADD GAME
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {games.map((g, i) => (
            <GameRow key={i} game={g}
              onToggle={() => updateGame(i, { expanded: !g.expanded })}
              onChange={(p) => updateGame(i, p)}
              onRemove={() => removeGame(i)}/>
          ))}
        </div>

        <Card soft accent style={{ marginTop: 14, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Mono color={V.goldLt}>SESSION NET</Mono>
            <span style={{ fontFamily: V.display, fontSize: 30, fontWeight: 600,
                           color: total >= 0 ? V.pos : V.neg }}>
              {total >= 0 ? '+' : ''}${total}
            </span>
          </div>
          <Mono size={10} style={{ marginTop: 4, display: 'block' }}>
            ${totalIn} in · ${totalOut} out · {games.length} game{games.length !== 1 ? 's' : ''}
          </Mono>
        </Card>

        <button onClick={() => setAdvanced(a => !a)} className="btn-press"
          style={{ marginTop: 14, background: 'transparent', border: 'none',
                   color: V.mute, fontSize: 12, cursor: 'pointer',
                   display: 'flex', alignItems: 'center', gap: 6,
                   fontFamily: V.ui }}>
          <span style={{ transition: 'transform .25s', display: 'inline-block',
                         transform: advanced ? 'rotate(0)' : 'rotate(-90deg)' }}>▾</span>
          More: mood, tags, notes, alcohol
        </button>

        {advanced && (
          <div className="anim-fade" style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 12 }}>
              <Mono>MOOD BEFORE → AFTER</Mono>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {['😊','😐','😤','😴'].map((m,i) => (
                  <button key={i} className="btn-press" style={{
                    flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 18,
                    border: `1px solid ${i === 0 ? V.gold : V.line2}`,
                    background: i === 0 ? 'rgba(212,175,106,.1)' : V.card,
                    cursor: 'pointer',
                  }}>{m}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Mono>TAGS</Mono>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {['fun','disciplined','tilted','tired','lucky','learning','chasing'].map((t,i) => (
                  <button key={t} className="btn-press" style={{
                    padding: '5px 12px', borderRadius: 999, fontSize: 11,
                    border: `1px solid ${i < 2 ? V.gold : V.line2}`,
                    background: i < 2 ? V.gold : 'transparent',
                    color: i < 2 ? '#1a1207' : V.ink2,
                    fontWeight: 600, cursor: 'pointer', fontFamily: V.ui,
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <Mono>NOTES</Mono>
              <div style={{ marginTop: 6, padding: 12, borderRadius: 10,
                            background: V.card, border: `1px solid ${V.line}`,
                            minHeight: 70, fontSize: 13, color: V.ink2,
                            fontStyle: 'italic' }}>
                Tap to add notes…
              </div>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function GameRow({ game, onToggle, onChange, onRemove }) {
  const net = game.cashOut - game.buyIn;
  return (
    <Card style={{ padding: game.expanded ? 14 : 12,
                   borderColor: game.expanded ? V.gold : V.line,
                   transition: 'border-color .25s' }}>
      <button onClick={onToggle} className="tap-surface"
        style={{ width: '100%', background: 'none', border: 'none', padding: 0,
                 textAlign: 'left', color: V.ink, cursor: 'pointer', fontFamily: V.ui,
                 display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 26, height: 26, borderRadius: 13, background: V.card2,
                         border: `1px solid ${V.line2}`,
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         fontSize: 13, color: V.gold }}>{gameGlyph(game.name)}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{game.name}</span>
        </div>
        <span style={{ fontFamily: V.mono, fontSize: 14, fontWeight: 700,
                       color: net >= 0 ? V.pos : V.neg }}>
          {net >= 0 ? '+' : ''}${net}
        </span>
      </button>
      {!game.expanded && (
        <Mono size={10} style={{ marginTop: 6, display: 'block' }}>
          ${game.buyIn} → ${game.cashOut}
        </Mono>
      )}
      {game.expanded && (
        <div className="anim-fade" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {['Blackjack','Poker','Roulette','Slots','Baccarat','Other'].map(n => (
              <button key={n} onClick={() => onChange({ name: n })} className="btn-press" style={{
                padding: '5px 11px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                border: `1px solid ${game.name === n ? V.gold : V.line2}`,
                background: game.name === n ? V.gold : 'transparent',
                color: game.name === n ? '#1a1207' : V.ink2,
                cursor: 'pointer', fontFamily: V.ui,
              }}>{n}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <NumInput label="Buy-in" value={game.buyIn} onChange={(v) => onChange({ buyIn: v })}/>
            <NumInput label="Cash-out" value={game.cashOut} onChange={(v) => onChange({ cashOut: v })}/>
          </div>
          <button onClick={onRemove} style={{
            marginTop: 10, background: 'transparent', border: 'none',
            color: V.neg, fontSize: 11, cursor: 'pointer', fontFamily: V.ui,
          }}>Remove game</button>
        </div>
      )}
    </Card>
  );
}

function gameGlyph(n) {
  return { Blackjack: '♠', Poker: '♣', Roulette: '◉', Slots: '◫',
           Baccarat: '♦', Other: '◦' }[n] || '◦';
}

function Field({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <Mono>{label}</Mono>
      <input value={value} readOnly={!onChange}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: '100%', marginTop: 4, padding: '11px 13px', borderRadius: 10,
          background: V.card, border: `1px solid ${V.line}`,
          fontSize: 13, fontWeight: 500, color: V.ink, fontFamily: V.ui,
          outline: 'none',
        }}/>
    </div>
  );
}

function NumInput({ label, value, onChange }) {
  return (
    <div style={{ padding: 10, borderRadius: 10, background: V.bg2,
                  border: `1px solid ${V.line}` }}>
      <Mono size={9}>{label.toUpperCase()}</Mono>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
        <span style={{ fontFamily: V.mono, color: V.mute, fontSize: 14 }}>$</span>
        <input type="number" value={value}
          onChange={(e) => onChange(+e.target.value || 0)}
          style={{
            flex: 1, minWidth: 0, background: 'transparent', border: 'none',
            fontFamily: V.mono, fontSize: 16, fontWeight: 600, color: V.ink,
            outline: 'none', padding: 0,
          }}/>
      </div>
    </div>
  );
}

Object.assign(window, { AddSheet });
