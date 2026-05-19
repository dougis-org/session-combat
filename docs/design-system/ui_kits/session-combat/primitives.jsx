// SessionCombat UI kit — primitives + tokens
// Tailwind-default-equivalent classes baked as inline styles so
// this works with no build step.
//
// Color tokens (mirrors colors_and_type.css):
const sc = {
  bg:        '#0a0a0a',
  surface0:  '#111827',
  surface1:  '#1f2937',
  surface2:  '#374151',
  surface3:  '#4b5563',
  border:    '#374151',
  borderFoc: '#3b82f6',
  fg1:       '#ffffff',
  fg2:       '#d1d5db',
  fg3:       '#9ca3af',
  fg4:       '#6b7280',
  party:        '#60a5fa',
  partyStrong:  '#2563eb',
  partyHover:   '#1d4ed8',
  partyDeep:    '#172554',
  enemy:        '#f87171',
  enemyStrong:  '#dc2626',
  enemyHover:   '#b91c1c',
  enemyDeep:    '#7f1d1d',
  lair:         '#c084fc',
  lairStrong:   '#9333ea',
  lairHover:    '#7e22ce',
  go:           '#16a34a',
  goHover:      '#15803d',
  initiative:   '#facc15',
  hpFull:       '#22c55e',
  hpHalf:       '#eab308',
  hpLow:        '#ef4444',
  hpKO:         '#6b7280',
};
const SANS = '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const SERIF = '"IBM Plex Serif", Georgia, "Times New Roman", serif';

// ── Button ───────────────────────────────────────────────────────
function Button({ variant = 'ghost', size = 'md', disabled, children, onClick, style, title }) {
  const [hover, setHover] = React.useState(false);
  const palettes = {
    party: [sc.partyStrong, sc.partyHover],
    enemy: [sc.enemyStrong, sc.enemyHover],
    lair:  [sc.lairStrong,  sc.lairHover],
    go:    [sc.go,          sc.goHover],
    ghost: [sc.surface2,    sc.surface3],
    flat:  [sc.partyHover,  '#1e40af'],
  };
  const [bg, bgH] = palettes[variant] || palettes.ghost;
  const sizes = {
    xs: { padding: '4px 10px', fontSize: 12 },
    sm: { padding: '4px 12px', fontSize: 13 },
    md: { padding: '8px 16px', fontSize: 14 },
    lg: { padding: '12px 22px', fontSize: 16 },
  };
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: disabled ? sc.surface3 : (hover ? bgH : bg),
        color: '#fff',
        border: 0,
        borderRadius: 4,
        fontFamily: SANS,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 120ms ease',
        ...sizes[size],
        ...style,
      }}
    >{children}</button>
  );
}

// ── Pill / role tag ──────────────────────────────────────────────
function Pill({ tone = 'party', children, style }) {
  const bg = {
    party: sc.partyStrong, enemy: sc.enemyStrong, lair: sc.lairStrong,
    library: sc.lairHover, character: sc.partyHover, monster: sc.enemyHover,
    initiative: sc.initiative, legendary: '#a16207',
    muted: sc.surface2,
  }[tone] || sc.surface2;
  const fg = tone === 'initiative' ? sc.bg : (tone === 'legendary' ? '#fef3c7' : '#fff');
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 600, color: fg, background: bg,
      fontFamily: SANS, lineHeight: 1.4, ...style,
    }}>{children}</span>
  );
}

// ── Input ────────────────────────────────────────────────────────
function Input({ value, onChange, type = 'text', placeholder, style, disabled, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={onChange}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: '100%', background: sc.surface2, color: '#fff',
        border: `1px solid ${focus ? sc.borderFoc : 'transparent'}`,
        borderRadius: 4, padding: '8px 12px',
        fontSize: 14, fontFamily: SANS, outline: 'none', ...style,
      }}
      {...rest}
    />
  );
}
function Label({ children, htmlFor }) {
  return <label htmlFor={htmlFor} style={{
    display: 'block', fontSize: 13, fontWeight: 600, color: sc.fg2, marginBottom: 6,
  }}>{children}</label>;
}

// ── Card ─────────────────────────────────────────────────────────
function Card({ children, padded = true, accent, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: sc.surface1, borderRadius: 8,
      border: accent ? `2px solid ${accent}` : 'none',
      padding: padded ? 20 : 0,
      transition: 'background 120ms ease',
      ...style,
    }}>{children}</div>
  );
}

// ── HP Bar ───────────────────────────────────────────────────────
function HpBar({ hp, max, w = 140 }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, hp / max)) : 0;
  const color = pct > 0.5 ? sc.hpFull : (pct > 0.25 ? sc.hpHalf : (pct > 0 ? sc.hpLow : sc.hpKO));
  return (
    <div style={{
      width: w, height: 8, background: sc.surface0,
      borderRadius: 4, overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{ width: `${pct * 100}%`, height: '100%', background: color, transition: 'width 200ms ease' }}></div>
    </div>
  );
}

// ── Initiative chip ─────────────────────────────────────────────
function InitChip({ value, lair = false }) {
  return (
    <div style={{
      width: 54, height: 54, borderRadius: 8,
      background: lair ? sc.lairStrong : sc.initiative,
      color: lair ? '#fff' : sc.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontFamily: MONO, flexShrink: 0,
    }}>
      <div style={{ fontSize: 22, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, letterSpacing: '.1em' }}>{lair ? 'LAIR' : 'INIT'}</div>
    </div>
  );
}

// ── Ability score block ─────────────────────────────────────────
function AbilityScores({ scores, compact = false }) {
  const keys = [
    ['STR', 'strength'], ['DEX', 'dexterity'], ['CON', 'constitution'],
    ['INT', 'intelligence'], ['WIS', 'wisdom'], ['CHA', 'charisma'],
  ];
  const mod = (v) => {
    const m = Math.floor((v - 10) / 2);
    return (m >= 0 ? '+' : '') + m;
  };
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6,
    }}>
      {keys.map(([abbr, k]) => (
        <div key={abbr} style={{
          background: sc.surface2, borderRadius: 4, padding: compact ? '6px 4px' : '10px 6px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: compact ? 14 : 18, fontWeight: 700, lineHeight: 1 }}>{scores[k]}</div>
          <div style={{ fontSize: 11, color: sc.fg3, marginTop: 2, fontFamily: MONO }}>{mod(scores[k])}</div>
          <div style={{ fontSize: 9, color: sc.fg4, marginTop: 2, fontWeight: 700, letterSpacing: '.05em' }}>{abbr}</div>
        </div>
      ))}
    </div>
  );
}

// ── Logo + brand ─────────────────────────────────────────────────
function Logo({ size = 40 }) {
  return <img src="../../assets/logo.svg" width={size} height={size} alt="Session Combat" style={{ display: 'block' }} />;
}

// ── Page chrome ──────────────────────────────────────────────────
function PageHeader({ title, right, sub }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, gap: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h1>
        {sub && <p style={{ margin: '4px 0 0', color: sc.fg3, fontSize: 14 }}>{sub}</p>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{right}</div>
    </div>
  );
}
function Footer({ version = '0.4.2', date = 'May 18, 2026, 11:24 AM' }) {
  return (
    <footer style={{
      background: sc.bg, borderTop: `1px solid ${sc.surface1}`,
      padding: '8px 16px', textAlign: 'center',
      fontSize: 12, color: sc.fg4, display: 'flex',
      justifyContent: 'center', gap: 10,
    }}>
      <span>v{version}</span><span>•</span><span>{date}</span>
    </footer>
  );
}

Object.assign(window, {
  sc, SANS, MONO, SERIF,
  Button, Pill, Input, Label, Card, HpBar, InitChip,
  AbilityScores, Logo, PageHeader, Footer,
});
