// Trainer — actual blackjack hand engine + basic-strategy lookup + screen.

const STRAT = {
  // hard hands: total -> [actions for dealer 2..A]
  hard: {
    21:['S','S','S','S','S','S','S','S','S','S'],
    20:['S','S','S','S','S','S','S','S','S','S'],
    19:['S','S','S','S','S','S','S','S','S','S'],
    18:['S','S','S','S','S','S','S','S','S','S'],
    17:['S','S','S','S','S','S','S','S','S','S'],
    16:['S','S','S','S','S','H','H','H','H','H'],
    15:['S','S','S','S','S','H','H','H','H','H'],
    14:['S','S','S','S','S','H','H','H','H','H'],
    13:['S','S','S','S','S','H','H','H','H','H'],
    12:['H','H','S','S','S','H','H','H','H','H'],
    11:['D','D','D','D','D','D','D','D','D','H'],
    10:['D','D','D','D','D','D','D','D','H','H'],
    9: ['H','D','D','D','D','H','H','H','H','H'],
    8: ['H','H','H','H','H','H','H','H','H','H'],
    7: ['H','H','H','H','H','H','H','H','H','H'],
    6: ['H','H','H','H','H','H','H','H','H','H'],
    5: ['H','H','H','H','H','H','H','H','H','H'],
  },
  // soft hands (non-pair, has Ace as 11). key = non-ace card value
  soft: {
    9:['S','S','S','S','S','S','S','S','S','S'], // A,9 = 20
    8:['S','S','S','S','S','S','S','S','S','S'], // A,8 = 19
    7:['S','D','D','D','D','S','S','H','H','H'], // A,7 = 18
    6:['H','D','D','D','D','H','H','H','H','H'], // A,6 = 17
    5:['H','H','D','D','D','H','H','H','H','H'], // A,5 = 16
    4:['H','H','D','D','D','H','H','H','H','H'], // A,4 = 15
    3:['H','H','H','D','D','H','H','H','H','H'], // A,3 = 14
    2:['H','H','H','D','D','H','H','H','H','H'], // A,2 = 13
  },
  pair: {
    'A':['P','P','P','P','P','P','P','P','P','P'],
    '10':['S','S','S','S','S','S','S','S','S','S'],
    '9':['P','P','P','P','P','S','P','P','S','S'],
    '8':['P','P','P','P','P','P','P','P','P','P'],
    '7':['P','P','P','P','P','P','H','H','H','H'],
    '6':['P','P','P','P','P','H','H','H','H','H'],
    '5':['D','D','D','D','D','D','D','D','H','H'],
    '4':['H','H','H','P','P','H','H','H','H','H'],
    '3':['P','P','P','P','P','P','H','H','H','H'],
    '2':['P','P','P','P','P','P','H','H','H','H'],
  },
};

const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUITS = ['♠','♥','♦','♣'];

const cardVal = (r) => r === 'A' ? 11 : ['J','Q','K'].includes(r) ? 10 : +r;

function dealCard() {
  return {
    r: RANKS[Math.floor(Math.random() * RANKS.length)],
    s: SUITS[Math.floor(Math.random() * SUITS.length)],
  };
}

// Generate a deliberately interesting hand (skew to decision points)
function dealHand(category = 'mix') {
  const scenarios = {
    mix: () => {
      const r = Math.random();
      if (r < 0.25) return scenarios.soft();
      if (r < 0.45) return scenarios.pair();
      return scenarios.hard();
    },
    hard: () => {
      const targets = [12,13,14,15,16,10,11,9];
      const t = targets[Math.floor(Math.random() * targets.length)];
      // build a non-pair, non-ace two-card sum of t
      let a, b;
      do {
        a = 2 + Math.floor(Math.random() * 8);
        b = t - a;
      } while (b < 2 || b > 10 || a === b || a === 11 || b === 11);
      return [{ r: a > 9 ? '10' : String(a), s: SUITS[0] },
              { r: b > 9 ? '10' : String(b), s: SUITS[1] }];
    },
    soft: () => {
      const k = 2 + Math.floor(Math.random() * 8);
      return [{ r: 'A', s: SUITS[0] }, { r: k > 9 ? '10' : String(k), s: SUITS[1] }];
    },
    pair: () => {
      const ranks = ['A','7','8','9','2','3','4','5','6','10'];
      const r = ranks[Math.floor(Math.random() * ranks.length)];
      return [{ r, s: SUITS[0] }, { r, s: SUITS[1] }];
    },
  };
  return scenarios[category]();
}

function dealDealerUp() {
  return { r: RANKS[Math.floor(Math.random() * RANKS.length)], s: SUITS[Math.floor(Math.random() * SUITS.length)] };
}

// Lookup correct action for a hand+upcard
function correctAction(hand, up) {
  const upIdx = up.r === 'A' ? 9 : Math.min(cardVal(up), 10) - 2;
  const rA = hand[0].r, rB = hand[1].r;
  // pair
  if (rA === rB) {
    const key = rA === 'J' || rA === 'Q' || rA === 'K' ? '10' : rA;
    return STRAT.pair[key][upIdx];
  }
  // soft (one is Ace, other not Ace)
  if (rA === 'A' || rB === 'A') {
    const other = rA === 'A' ? rB : rA;
    const v = cardVal({ r: other });
    return STRAT.soft[v >= 10 ? null : v]?.[upIdx] ?? 'S';
  }
  const total = cardVal(hand[0]) + cardVal(hand[1]);
  return STRAT.hard[total][upIdx];
}

function handTotal(hand) {
  let sum = 0, aces = 0;
  for (const c of hand) {
    sum += cardVal(c);
    if (c.r === 'A') aces++;
  }
  while (sum > 21 && aces > 0) { sum -= 10; aces--; }
  return sum;
}

function handLabel(hand) {
  if (hand[0].r === hand[1].r) return `Pair of ${hand[0].r}s`;
  if (hand[0].r === 'A' || hand[1].r === 'A') return `Soft ${handTotal(hand)}`;
  return `Hard ${handTotal(hand)}`;
}

// Reasoning text per action+context
function reasonFor(hand, up, action) {
  const label = handLabel(hand);
  const upV = up.r === 'A' ? 'Ace' : up.r;
  const upVal = cardVal(up);
  const T = handTotal(hand);
  const reasons = {
    H: `Your ${label.toLowerCase()} loses to a dealer ${upV} more often than not. You need to improve — and you can't bust on a low total.`,
    S: `Dealer ${upV} is a weak upcard. Stand and let the dealer draw to a likely bust (4, 5, 6 bust ~40% of the time).`,
    D: `Soft hands and totals of 10–11 are doubling spots — you have an edge and want more money on the table.`,
    P: `Splitting unlocks two strong starting hands. ${hand[0].r}-${hand[0].r} is far better played as two separate hands here.`,
    R: `16 vs 9/10/A is the worst spot in BJ. Surrender saves half your bet vs. a ~77% loss rate.`,
  };
  return reasons[action] || reasons.H;
}

function ruleOfThumb(hand, up, action) {
  const T = handTotal(hand);
  if (action === 'D') return 'Double on 10/11. Double soft 13–18 vs. dealer 4–6.';
  if (action === 'P') return 'Always split Aces and 8s. Never split 5s or 10s.';
  if (action === 'S' && T >= 12 && T <= 16) return '12–16 vs. dealer 2–6: stand. Let them bust.';
  if (action === 'H' && T <= 11) return 'Can\'t bust on a hit. Always take a card on 8 or less.';
  return 'Trust the chart — basic strategy is the lowest house edge possible.';
}

// === Card render ==========================================================
function PlayingCard({ card, hidden, size = 1, dealDelay = 0, key: k }) {
  const w = 56 * size, h = 78 * size;
  const red = card?.s === '♥' || card?.s === '♦';
  if (hidden) {
    return <div style={{
      width: w, height: h, borderRadius: 8,
      background: V.card2, border: `1.5px solid ${V.goldDk}`,
      backgroundImage: `repeating-linear-gradient(45deg, ${V.card} 0 6px, ${V.bg2} 6px 12px)`,
      boxShadow: '0 4px 12px rgba(0,0,0,.4)',
      animation: `dealIn .45s cubic-bezier(.2,.7,.2,1) ${dealDelay}ms backwards`,
    }}/>;
  }
  return (
    <div style={{
      width: w, height: h, borderRadius: 8,
      background: 'linear-gradient(165deg, #f9f5ec, #ebe3d2)',
      border: `1.5px solid #2a2520`,
      padding: 6, fontFamily: V.mono, fontWeight: 700,
      color: red ? '#a14a4a' : '#1a1a1a', position: 'relative',
      boxShadow: '0 4px 12px rgba(0,0,0,.4)',
      animation: `dealIn .45s cubic-bezier(.2,.7,.2,1) ${dealDelay}ms backwards`,
    }}>
      <div style={{ fontSize: 14*size, lineHeight: 1 }}>{card.r}</div>
      <div style={{ fontSize: 16*size, lineHeight: 1, marginTop: 2 }}>{card.s}</div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 26*size, opacity: 0.18 }}>{card.s}</div>
      <div style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 14*size,
                    lineHeight: 1, transform: 'rotate(180deg)' }}>{card.r}<br/>{card.s}</div>
    </div>
  );
}

// === Trainer screen =======================================================
function TrainerScreen({ stats, onStat, onBack }) {
  const [category, setCategory] = React.useState('mix');
  const [hand, setHand] = React.useState(() => dealHand('mix'));
  const [dealerUp, setDealerUp] = React.useState(() => dealDealerUp());
  const [picked, setPicked] = React.useState(null);
  const [showHint, setShowHint] = React.useState(false);
  const [dealKey, setDealKey] = React.useState(0);

  const correct = correctAction(hand, dealerUp);
  const isCorrect = picked === correct;

  const nextHand = () => {
    setPicked(null);
    setShowHint(false);
    setHand(dealHand(category));
    setDealerUp(dealDealerUp());
    setDealKey(k => k + 1);
  };

  const choose = (action) => {
    if (picked) return;
    setPicked(action);
    onStat(action === correct);
  };

  React.useEffect(() => { nextHand(); }, [category]);

  const acc = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <>
      <Header
        left={<IconBtn onClick={onBack}>‹</IconBtn>}
        title="Trainer"
        right={<Mono size={11}>{stats.streak} 🔥</Mono>}
      />

      <Scrollable style={{ padding: '0 20px' }}>
        {/* category tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
          {[
            ['mix','All hands'],['hard','Hard'],['soft','Soft'],['pair','Pairs'],
          ].map(([k,l]) => (
            <button key={k} onClick={() => setCategory(k)} className="btn-press"
              style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: category === k ? V.gold : 'transparent',
                color: category === k ? '#1a1207' : V.ink2,
                border: `1px solid ${category === k ? V.gold : V.line2}`,
                cursor: 'pointer', fontFamily: V.ui, whiteSpace: 'nowrap',
              }}>{l}</button>
          ))}
        </div>

        {/* stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <StatCell label="HAND" v={stats.total + 1}/>
          <StatCell label="ACC" v={`${acc}%`}/>
          <StatCell label="STREAK" v={stats.streak}/>
        </div>

        {/* table */}
        <div key={dealKey} style={{
          background: 'linear-gradient(180deg, #1a2520 0%, #0e1612 100%)',
          border: `1px solid ${V.line}`,
          borderRadius: 20, padding: '20px 14px', marginBottom: 14,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* table felt texture */}
          <div style={{ position: 'absolute', inset: 0,
                        background: 'radial-gradient(ellipse at top, rgba(212,175,106,.06), transparent 60%)',
                        pointerEvents: 'none' }}/>
          <Mono color={V.mute} style={{ display: 'block', textAlign: 'center' }}>
            DEALER {picked ? `· ${cardVal(dealerUp)}` : 'SHOWS'}
          </Mono>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center',
                        position: 'relative', zIndex: 1 }}>
            <PlayingCard card={dealerUp} dealDelay={0}/>
            <PlayingCard hidden dealDelay={120}/>
          </div>

          <div style={{ height: 16 }}/>
          <Mono color={V.mute} style={{ display: 'block', textAlign: 'center' }}>
            YOUR HAND · {handLabel(hand).toUpperCase()}
          </Mono>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center',
                        position: 'relative', zIndex: 1 }}>
            <PlayingCard card={hand[0]} dealDelay={240}/>
            <PlayingCard card={hand[1]} dealDelay={360}/>
          </div>
        </div>

        {/* hint or feedback */}
        {!picked && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => setShowHint(s => !s)} className="btn-press"
              style={{
                flex: 1, padding: 10, borderRadius: 10,
                border: `1px dashed ${V.gold}`, background: showHint ? 'rgba(212,175,106,.1)' : 'transparent',
                color: V.gold, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: V.ui,
              }}>💡 {showHint ? 'Hint shown' : 'Show hint'}</button>
            <button onClick={nextHand} className="btn-press"
              style={{
                flex: 1, padding: 10, borderRadius: 10,
                border: `1px solid ${V.line2}`, background: 'transparent',
                color: V.ink2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: V.ui,
              }}>↻ Skip hand</button>
          </div>
        )}

        {showHint && !picked && (
          <Card soft accent style={{ marginBottom: 12, padding: 12 }} >
            <Mono color={V.goldLt}>HINT</Mono>
            <div style={{ marginTop: 4, fontSize: 12, color: V.ink2, lineHeight: 1.5 }}>
              {ruleOfThumb(hand, dealerUp, correct)}
            </div>
          </Card>
        )}

        {picked && (
          <FeedbackCard hand={hand} up={dealerUp} picked={picked} correct={correct}
                       isCorrect={isCorrect} onNext={nextHand}/>
        )}

        {/* actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 18 }}>
          {[
            ['HIT','H'],['STAND','S'],['DOUBLE','D'],
            ['SPLIT','P'],['SURR','R'],['INS','I'],
          ].map(([label, code]) => {
            const sel = picked === code;
            const isRight = picked && code === correct;
            return (
              <button key={code} onClick={() => choose(code)} disabled={!!picked}
                className={sel ? (isCorrect ? 'anim-glow-pos' : 'anim-glow-neg') : ''}
                style={{
                  padding: '14px 0', borderRadius: 12, fontFamily: V.mono,
                  fontWeight: 700, fontSize: 12, letterSpacing: 0.5, cursor: picked ? 'default' : 'pointer',
                  background: isRight ? V.pos : sel ? V.neg : V.card,
                  color: (isRight || sel) ? '#fff' : V.ink,
                  border: `1px solid ${isRight ? V.pos : sel ? V.neg : V.line2}`,
                  transition: 'all .25s', opacity: picked && !sel && !isRight ? 0.4 : 1,
                }}>{label}</button>
            );
          })}
        </div>
      </Scrollable>
    </>
  );
}

function FeedbackCard({ hand, up, picked, correct, isCorrect, onNext }) {
  return (
    <Card style={{
      borderColor: isCorrect ? V.pos : V.neg,
      background: isCorrect ? 'rgba(123,185,140,.06)' : 'rgba(215,122,122,.06)',
      marginBottom: 12,
    }} className="anim-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Hand size={18} color={isCorrect ? V.pos : V.neg}>
          {isCorrect ? '✓ Correct!' : `✕ ${picked === correct ? '' : 'Not quite'}`}
        </Hand>
        {!isCorrect && <Mono color={V.gold}>CORRECT: {fullName(correct)}</Mono>}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: V.ink2, lineHeight: 1.55 }}>
        <span style={{ color: V.gold, fontWeight: 600 }}>Why {fullName(correct).toLowerCase()}: </span>
        {reasonFor(hand, up, correct)}
      </div>
      <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: V.card2 }}>
        <Mono size={9} color={V.goldLt}>RULE OF THUMB</Mono>
        <div style={{ fontSize: 12, color: V.ink, marginTop: 3 }}>
          {ruleOfThumb(hand, up, correct)}
        </div>
      </div>
      <button onClick={onNext} className="btn-press"
        style={{
          marginTop: 12, width: '100%', padding: 14, borderRadius: 12,
          background: `linear-gradient(155deg, ${V.goldLt}, ${V.goldDk})`,
          color: '#1a1207', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
          fontFamily: V.ui, letterSpacing: 0.2,
        }}>Next hand →</button>
    </Card>
  );
}

function fullName(code) {
  return { H: 'Hit', S: 'Stand', D: 'Double', P: 'Split', R: 'Surrender' }[code] || code;
}

function StatCell({ label, v }) {
  return (
    <div style={{ padding: 10, background: V.card, borderRadius: 10,
                  border: `1px solid ${V.line}`, textAlign: 'center' }}>
      <Mono size={8}>{label}</Mono>
      <div className="anim-count" key={v}
           style={{ fontFamily: V.mono, fontSize: 18, fontWeight: 700, color: V.ink, marginTop: 2 }}>
        {v}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick }) {
  return (
    <button onClick={onClick} className="btn-press" style={{
      width: 36, height: 36, borderRadius: 18, border: `1px solid ${V.line2}`,
      background: V.card, color: V.ink, cursor: 'pointer',
      fontSize: 18, fontWeight: 600, fontFamily: V.ui,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  );
}

Object.assign(window, { TrainerScreen, PlayingCard, IconBtn, dealHand, dealDealerUp, correctAction, handTotal, handLabel, STRAT });
