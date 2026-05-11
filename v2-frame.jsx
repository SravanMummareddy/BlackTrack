// Gold + black premium wireframe frame
const V = {
  bg:     '#0b0b0d',
  bg2:    '#141416',
  card:   '#17171a',
  card2:  '#1f1f23',
  line:   '#2a2a2e',
  line2:  '#3a3a3f',
  ink:    '#f0ece2',
  ink2:   '#c8c3b8',
  mute:   '#7a7670',
  mute2:  '#54514c',
  gold:   '#d4af6a',
  goldDk: '#a98741',
  goldLt: '#e7c98a',
  pos:    '#7bb98c',
  neg:    '#d77a7a',
  warn:   '#d4af6a',
  hand:   "'Caveat', cursive",
  ui:     "'Inter', system-ui, sans-serif",
  display:"'Fraunces', serif",
  mono:   "'JetBrains Mono', monospace",
};

function Phone({ title, children, nav = 'home', noNav, noStatus, headerRight }) {
  return (
    <div style={{
      width: 320, height: 660, borderRadius: 42,
      background: V.bg, color: V.ink,
      border: `2px solid #1a1a1c`,
      boxShadow: 'inset 0 0 0 4px #050505, 0 0 0 1px #2a2a2e, 6px 10px 0 rgba(0,0,0,.12)',
      position: 'relative', overflow: 'hidden',
      fontFamily: V.ui, fontSize: 12,
    }}>
      {!noStatus && (
        <div style={{
          height: 32, display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', padding: '0 26px 6px',
          fontFamily: V.mono, fontSize: 10, color: V.mute,
        }}>
          <span>9:41</span>
          <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                        width: 82, height: 20, borderRadius: 14, background: '#000' }} />
          <span style={{ display: 'flex', gap: 4 }}>
            <span>···</span><span>◔</span><span>▮</span>
          </span>
        </div>
      )}

      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: noStatus ? 0 : 32, bottom: noNav ? 0 : 62,
        overflow: 'hidden', padding: '8px 16px 10px',
      }}>
        {title !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 12 }}>
            <div style={{ fontFamily: V.display, fontSize: 22, fontWeight: 500, lineHeight: 1,
                          letterSpacing: -0.3 }}>
              {title}
            </div>
            {headerRight || (
              <div style={{ display: 'flex', gap: 6 }}>
                <IconDot/>
                <IconDot/>
              </div>
            )}
          </div>
        )}
        {children}
      </div>

      {!noNav && <BottomNav active={nav}/>}

      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 4, borderRadius: 3, background: V.line2,
      }} />
    </div>
  );
}

function IconDot() {
  return <span style={{
    width: 24, height: 24, borderRadius: 12,
    border: `1px solid ${V.line2}`,
    display: 'inline-block',
  }}/>;
}

function BottomNav({ active }) {
  const items = [
    { id: 'home',     label: 'Home',  glyph: '◧' },
    { id: 'log',      label: 'Log',   glyph: '☰' },
    { id: 'add',      glyph: '+', fab: true },
    { id: 'learn',    label: 'Learn', glyph: '♤' },
    { id: 'me',       label: 'Me',    glyph: '○' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 62,
      borderTop: `1px solid ${V.line}`,
      background: V.bg,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
      padding: '8px 8px 18px',
    }}>
      {items.map(it => it.fab ? (
        <div key={it.id} style={{
          width: 50, height: 50, borderRadius: 25,
          background: `linear-gradient(155deg, ${V.goldLt}, ${V.goldDk})`,
          color: '#1a1207',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 300, marginTop: -18,
          boxShadow: `0 6px 16px rgba(212,175,106,.25), inset 0 1px 0 rgba(255,255,255,.3)`,
        }}>+</div>
      ) : (
        <div key={it.id} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          color: active === it.id ? V.gold : V.mute,
          fontWeight: active === it.id ? 600 : 400,
          fontSize: 10, minWidth: 44,
        }}>
          <span style={{ fontSize: 14 }}>{it.glyph}</span>
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function Card({ children, style, dashed, accent, soft }) {
  return (
    <div style={{
      border: `1px ${dashed ? 'dashed' : 'solid'} ${accent ? V.gold : V.line}`,
      borderRadius: 14, padding: 12,
      background: soft ? 'rgba(212,175,106,0.05)' : V.card,
      ...style,
    }}>{children}</div>
  );
}

function Pill({ children, solid, gold, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 999,
      border: `1px solid ${gold ? V.gold : V.line2}`,
      background: solid ? (gold ? V.gold : V.card2) : 'transparent',
      color: solid && gold ? '#1a1207' : (gold ? V.gold : V.ink2),
      fontSize: 10, fontFamily: V.ui, fontWeight: 500,
      ...style,
    }}>{children}</span>
  );
}

function Mono({ children, size = 10, color, style }) {
  return <span style={{
    fontFamily: V.mono, fontSize: size,
    color: color || V.mute, letterSpacing: 0.4,
    textTransform: 'uppercase',
    ...style,
  }}>{children}</span>;
}

function Hand({ children, size = 14, color }) {
  return <span style={{
    fontFamily: V.hand, fontSize: size, fontWeight: 600,
    color: color || V.ink, lineHeight: 1.1,
  }}>{children}</span>;
}

function Bar({ pct, neg }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: V.card2,
                  border: `1px solid ${V.line}`, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%',
                    background: neg ? V.neg : `linear-gradient(90deg, ${V.goldDk}, ${V.goldLt})` }}/>
    </div>
  );
}

function PeriodTabs({ value, options = ['Week','Month','Year','All'] }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: V.card,
                  border: `1px solid ${V.line}`,
                  borderRadius: 999, padding: 2, marginBottom: 12 }}>
      {options.map(p => (
        <div key={p} style={{
          flex: 1, textAlign: 'center', padding: '6px 8px',
          borderRadius: 999, fontSize: 11,
          background: p === value ? V.gold : 'transparent',
          color: p === value ? '#1a1207' : V.ink2,
          fontWeight: p === value ? 700 : 500,
        }}>{p}</div>
      ))}
    </div>
  );
}

Object.assign(window, { V, Phone, Card, Pill, Mono, Hand, Bar, PeriodTabs, IconDot });
