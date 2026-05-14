// Frame — phone shell, screen router with transitions, bottom nav, sheet host

const V = {
  bg:'#0b0b0d', bg2:'#141416', card:'#17171a', card2:'#1f1f23',
  line:'#2a2a2e', line2:'#3a3a3f',
  ink:'#f0ece2', ink2:'#c8c3b8', mute:'#8a857d', mute2:'#54514c',
  gold:'#d4af6a', goldDk:'#a98741', goldLt:'#e7c98a',
  pos:'#7bb98c', neg:'#d77a7a', warn:'#d4af6a',
  hand:"'Caveat', cursive",
  ui:"'Inter', system-ui, sans-serif",
  display:"'Fraunces', serif",
  mono:"'JetBrains Mono', monospace",
};

const TAB_ORDER = ['home','log','add','learn','me'];

// === Phone shell ==========================================================
function PhoneShell({ children }) {
  return (
    <div style={{
      width: 380, height: 800, borderRadius: 50,
      background: V.bg, color: V.ink,
      border: '3px solid #1a1a1c',
      boxShadow: 'inset 0 0 0 5px #050505, 0 0 0 1px #2a2a2e, 0 30px 80px rgba(0,0,0,.6)',
      position: 'relative', overflow: 'hidden',
      fontFamily: V.ui, fontSize: 13,
    }}>
      {/* notch */}
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                    width: 110, height: 28, borderRadius: 18, background: '#000', zIndex: 50 }}/>
      {/* status text */}
      <div style={{ position: 'absolute', top: 14, left: 32, fontFamily: V.mono, fontSize: 12,
                    color: V.ink2, zIndex: 50, fontWeight: 600 }}>9:41</div>
      <div style={{ position: 'absolute', top: 14, right: 32, fontFamily: V.mono, fontSize: 12,
                    color: V.ink2, zIndex: 50, display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>·ıl</span><span>◔</span><span>▮</span>
      </div>
      {children}
      {/* home indicator */}
      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                    width: 130, height: 5, borderRadius: 3, background: V.line2, zIndex: 50 }}/>
    </div>
  );
}

// === Header bar (shared) ==================================================
function Header({ title, left, right, big }) {
  return (
    <div style={{
      padding: '54px 20px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      minHeight: big ? 110 : 88,
    }}>
      <div style={{ minWidth: 32 }}>{left}</div>
      <div style={{ flex: 1, textAlign: 'center', fontFamily: V.display,
                    fontSize: big ? 28 : 18, fontWeight: 600, letterSpacing: -0.3 }}>
        {title}
      </div>
      <div style={{ minWidth: 32, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

// === Bottom Nav ===========================================================
function BottomNav({ active, onChange, onFab }) {
  const items = [
    { id: 'home',  label: 'Home',  glyph: '◧' },
    { id: 'log',   label: 'Log',   glyph: '☰' },
    { id: 'add',   fab: true },
    { id: 'learn', label: 'Learn', glyph: '♤' },
    { id: 'me',    label: 'Me',    glyph: '○' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 78,
      borderTop: `1px solid ${V.line}`,
      background: 'rgba(11,11,13,0.92)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
      padding: '12px 12px 22px', zIndex: 20,
    }}>
      {items.map(it => it.fab ? (
        <button key="fab" onClick={onFab} className="btn-press"
          style={{
            width: 60, height: 60, borderRadius: 30, border: 'none', padding: 0, cursor: 'pointer',
            background: `linear-gradient(155deg, ${V.goldLt}, ${V.goldDk})`,
            color: '#1a1207', fontSize: 30, fontWeight: 300, marginTop: -22,
            boxShadow: `0 8px 22px rgba(212,175,106,.35), inset 0 1px 0 rgba(255,255,255,.4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>+</button>
      ) : (
        <button key={it.id} onClick={() => onChange(it.id)} className="btn-press"
          style={{
            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: active === it.id ? V.gold : V.mute,
            fontWeight: active === it.id ? 600 : 400,
            fontSize: 10, minWidth: 48, fontFamily: V.ui,
          }}>
          <span style={{ fontSize: 18 }}>{it.glyph}</span>
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

// === Screen wrapper with directional transitions ==========================
function ScreenStack({ screen, navStack }) {
  const [shown, setShown] = React.useState(screen);
  const [dir, setDir] = React.useState('R');
  React.useEffect(() => {
    if (shown !== screen) {
      const ai = TAB_ORDER.indexOf(shown);
      const bi = TAB_ORDER.indexOf(screen);
      setDir(bi >= ai ? 'R' : 'L');
      setShown(screen);
    }
  }, [screen]);
  return (
    <div key={shown} className={dir === 'R' ? 'anim-slideR' : 'anim-slideL'}
         style={{ position: 'absolute', inset: 0, paddingBottom: 78,
                  display: 'flex', flexDirection: 'column' }}>
      {navStack[shown]}
    </div>
  );
}

// === Sheet (bottom modal) =================================================
function Sheet({ open, onClose, height = '90%', children }) {
  const [render, setRender] = React.useState(open);
  const [closing, setClosing] = React.useState(false);
  React.useEffect(() => {
    if (open) { setRender(true); setClosing(false); }
    else if (render) {
      setClosing(true);
      const t = setTimeout(() => { setRender(false); setClosing(false); }, 280);
      return () => clearTimeout(t);
    }
  }, [open]);
  if (!render) return null;
  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)',
        backdropFilter: 'blur(2px)', zIndex: 30,
        animation: closing ? 'fadeIn .28s reverse' : 'fadeIn .28s',
        opacity: closing ? 0 : 1,
      }}/>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height, background: V.bg2, zIndex: 40,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        border: `1px solid ${V.line}`, borderBottom: 'none',
        animation: closing ? 'slideUp .28s reverse' : 'slideUp .32s cubic-bezier(.2,.7,.2,1)',
        transform: closing ? 'translateY(100%)' : 'translateY(0)',
        boxShadow: '0 -20px 60px rgba(0,0,0,.6)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 42, height: 4, borderRadius: 2, background: V.line2 }}/>
        </div>
        {children}
      </div>
    </>
  );
}

// === Reusable building blocks =============================================
function Card({ children, style, dashed, accent, soft, onClick, tap }) {
  const C = onClick ? 'button' : 'div';
  return (
    <C onClick={onClick} className={onClick || tap ? 'tap-surface btn-press' : ''}
      style={{
        textAlign: 'left', width: onClick ? '100%' : 'auto',
        border: `1px ${dashed ? 'dashed' : 'solid'} ${accent ? V.gold : V.line}`,
        borderRadius: 16, padding: 14,
        background: soft ? 'rgba(212,175,106,0.06)' : V.card,
        color: V.ink, fontFamily: V.ui, cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}>{children}</C>
  );
}

function Pill({ children, solid, gold, neg, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 999,
      border: `1px solid ${gold ? V.gold : neg ? V.neg : V.line2}`,
      background: solid ? (gold ? V.gold : neg ? V.neg : V.card2) : 'transparent',
      color: solid && gold ? '#1a1207' : solid && neg ? '#fff' : (gold ? V.gold : V.ink2),
      fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
      ...style,
    }}>{children}</span>
  );
}

function Mono({ children, size = 10, color, style }) {
  return <span style={{
    fontFamily: V.mono, fontSize: size,
    color: color || V.mute, letterSpacing: 0.4,
    textTransform: 'uppercase', ...style,
  }}>{children}</span>;
}

function Hand({ children, size = 16, color, style }) {
  return <span style={{
    fontFamily: V.hand, fontSize: size, fontWeight: 600,
    color: color || V.ink, lineHeight: 1.15, ...style,
  }}>{children}</span>;
}

function Bar({ pct, neg, animated }) {
  return (
    <div style={{ height: 7, borderRadius: 4, background: V.card2,
                  border: `1px solid ${V.line}`, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%',
                    background: neg ? V.neg : `linear-gradient(90deg, ${V.goldDk}, ${V.goldLt})`,
                    transition: 'width .6s cubic-bezier(.2,.7,.2,1)' }}/>
    </div>
  );
}

function PeriodTabs({ value, onChange, options = ['Week','Month','Year','All'] }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: V.card,
                  border: `1px solid ${V.line}`,
                  borderRadius: 999, padding: 3, margin: '0 20px 16px',
                  position: 'relative' }}>
      {/* sliding indicator */}
      <div style={{
        position: 'absolute', top: 3, bottom: 3,
        left: `calc(3px + ${options.indexOf(value) * (100 / options.length)}% )`,
        width: `calc(${100 / options.length}% - 3px)`,
        background: V.gold, borderRadius: 999,
        transition: 'left .25s cubic-bezier(.2,.7,.2,1)',
      }}/>
      {options.map(p => (
        <button key={p} onClick={() => onChange?.(p)}
          style={{
            flex: 1, padding: '7px 8px', borderRadius: 999, fontSize: 12,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: p === value ? '#1a1207' : V.ink2,
            fontWeight: p === value ? 700 : 500, fontFamily: V.ui,
            position: 'relative', zIndex: 1,
            transition: 'color .25s',
          }}>{p}</button>
      ))}
    </div>
  );
}

function Scrollable({ children, style }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', ...style }}>
      {children}
    </div>
  );
}

Object.assign(window, {
  V, PhoneShell, Header, BottomNav, ScreenStack, Sheet,
  Card, Pill, Mono, Hand, Bar, PeriodTabs, Scrollable, TAB_ORDER
});
