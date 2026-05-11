// Wireframe phone frame + shared primitives
// All screens render INTO <Phone>; the frame supplies status bar, notch,
// bottom nav, and the wireframe paper feel.

const WF = {
  // light "paper" wireframe palette (default)
  paper:  '#fdfcf8',
  ink:    '#1a1a1a',
  ink2:   '#3a3a3a',
  mute:   '#9a9a9a',
  mute2:  '#c4c4c4',
  line:   '#1a1a1a',
  fill:   '#ebe9e3',
  fill2:  '#dcd9d1',
  accent: '#3a6df0',
  pos:    '#4a7a4a',
  neg:    '#a14a4a',
  warn:   '#b08838',
  // dark variant
  d_bg:   '#0e0e10',
  d_ink:  '#e8e6e0',
  d_mute: '#6a6a6f',
  d_fill: '#1a1a1d',
  d_fill2:'#26262b',
  d_line: '#3a3a40',
  // type
  hand:   "'Caveat', cursive",
  ui:     "'Inter', system-ui, sans-serif",
  mono:   "'JetBrains Mono', monospace",
};

// Sketchy stroke variants (mild paper wobble via dasharray + skewing borders).
const sketchStyle = (n = 0) => {
  const dashes = ['0','none','1.5 2','2 3','3 1.5'];
  return { borderStyle: 'solid', borderWidth: 1, borderColor: WF.line };
};

// === Phone frame ==========================================================
function Phone({ title, dark, children, nav = 'dashboard', noNav, noStatus, sketch = 1 }) {
  const bg = dark ? WF.d_bg : WF.paper;
  const ink = dark ? WF.d_ink : WF.ink;
  const line = dark ? WF.d_line : WF.line;
  return (
    <div style={{
      width: 300, height: 620, borderRadius: 38,
      background: bg, color: ink,
      border: `1.5px solid ${WF.line}`,
      boxShadow: dark
        ? 'inset 0 0 0 4px #0e0e10, 6px 8px 0 rgba(26,26,26,.08)'
        : '6px 8px 0 rgba(26,26,26,.08)',
      position: 'relative', overflow: 'hidden',
      fontFamily: WF.ui, fontSize: 12,
    }}>
      {/* status bar */}
      {!noStatus && (
        <div style={{
          height: 28, display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', padding: '0 22px 4px',
          fontFamily: WF.mono, fontSize: 10, color: dark ? WF.d_mute : WF.mute,
        }}>
          <span>9:41</span>
          <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
                        width: 78, height: 18, borderRadius: 12, background: dark ? '#000' : '#1a1a1a' }} />
          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span>···</span><span>◔</span><span>▮</span>
          </span>
        </div>
      )}

      {/* content area */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: noStatus ? 0 : 28, bottom: noNav ? 0 : 56,
        overflow: 'hidden', padding: '6px 14px 8px',
      }}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 10 }}>
            <div style={{ fontFamily: WF.hand, fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
              {title}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Dot dark={dark} />
              <Dot dark={dark} />
            </div>
          </div>
        )}
        {children}
      </div>

      {/* bottom nav */}
      {!noNav && <BottomNav active={nav} dark={dark} />}

      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)',
        width: 110, height: 4, borderRadius: 3, background: dark ? '#3a3a40' : '#1a1a1a',
      }} />
    </div>
  );
}

function Dot({ dark }) {
  return <span style={{
    width: 22, height: 22, borderRadius: 11,
    border: `1px solid ${dark ? WF.d_line : WF.line}`,
    display: 'inline-block',
  }} />;
}

function BottomNav({ active, dark }) {
  const items = [
    { id: 'dashboard', label: 'Home',   glyph: '◧' },
    { id: 'history',   label: 'Log',    glyph: '☰' },
    { id: 'add',       label: '',       glyph: '+', fab: true },
    { id: 'learn',     label: 'Learn',  glyph: '♤' },
    { id: 'settings',  label: 'Me',     glyph: '○' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 56,
      borderTop: `1px solid ${dark ? WF.d_line : WF.line}`,
      background: dark ? WF.d_bg : WF.paper,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
      padding: '6px 8px 16px',
    }}>
      {items.map(it => it.fab ? (
        <div key={it.id} style={{
          width: 44, height: 44, borderRadius: 22,
          background: WF.accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 300, marginTop: -14,
          boxShadow: '0 4px 0 rgba(26,26,26,.15)',
          border: `1.5px solid ${WF.line}`,
        }}>+</div>
      ) : (
        <div key={it.id} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          color: active === it.id ? (dark ? WF.d_ink : WF.ink) : (dark ? WF.d_mute : WF.mute),
          fontWeight: active === it.id ? 600 : 400,
          fontSize: 10, minWidth: 40,
        }}>
          <span style={{ fontSize: 14 }}>{it.glyph}</span>
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// === Building blocks ======================================================
function Card({ children, dark, style, dashed, hand }) {
  return (
    <div style={{
      border: `1px ${dashed ? 'dashed' : 'solid'} ${dark ? WF.d_line : WF.line}`,
      borderRadius: 10, padding: 10,
      background: dark ? WF.d_fill : 'transparent',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, dark, accent, sign }) {
  const col = sign === '+' ? WF.pos : sign === '-' ? WF.neg : (dark ? WF.d_ink : WF.ink);
  return (
    <div>
      <div style={{ fontFamily: WF.hand, fontSize: 12, color: dark ? WF.d_mute : WF.mute, lineHeight: 1 }}>{label}</div>
      <div style={{ fontFamily: WF.mono, fontSize: 18, fontWeight: 600, color: col, marginTop: 4, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 9, color: dark ? WF.d_mute : WF.mute, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Pill({ children, dark, solid, accent, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 999,
      border: `1px solid ${dark ? WF.d_line : WF.line}`,
      background: solid ? (accent ? WF.accent : (dark ? WF.d_fill2 : WF.fill)) : 'transparent',
      color: solid && accent ? '#fff' : 'inherit',
      fontSize: 10, fontFamily: WF.ui,
      ...style,
    }}>{children}</span>
  );
}

function Scribble({ w = 60, h = 8, dark }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <path d={`M2 ${h/2} Q ${w*0.25} 2 ${w*0.5} ${h/2} T ${w-2} ${h/2}`}
        fill="none" stroke={dark ? WF.d_mute : WF.mute2} strokeWidth="1" />
    </svg>
  );
}

function Bar({ pct, dark, neg }) {
  return (
    <div style={{
      height: 6, borderRadius: 4,
      background: dark ? WF.d_fill2 : WF.fill,
      border: `1px solid ${dark ? WF.d_line : WF.line}`,
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${pct}%`, height: '100%',
        background: neg ? WF.neg : WF.accent,
      }} />
    </div>
  );
}

// Tiny placeholder line: ▱▱▱▱▱
function Line({ w = '100%', h = 8, dark }) {
  return <div style={{
    width: w, height: h, borderRadius: h/2,
    background: dark ? WF.d_fill2 : WF.fill,
  }} />;
}

// Hand-written label
function H({ children, size = 14, dark, color }) {
  return <span style={{
    fontFamily: WF.hand, fontSize: size, fontWeight: 600,
    color: color || (dark ? WF.d_ink : WF.ink), lineHeight: 1.1,
  }}>{children}</span>;
}

function Mono({ children, size = 10, dark, color }) {
  return <span style={{
    fontFamily: WF.mono, fontSize: size,
    color: color || (dark ? WF.d_mute : WF.mute),
  }}>{children}</span>;
}

Object.assign(window, { WF, Phone, Card, Stat, Pill, Scribble, Bar, Line, H, Mono });
