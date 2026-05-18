// SessionCombat — high-level screens
// Each screen is a fully-styled mock of a real route in the app.

// ── Home / Dashboard ─────────────────────────────────────────────
function HomeScreen({ onNav, onLogout }) {
  const tiles = [
    { id: 'encounters', title: 'Encounters', desc: 'Manage encounters and monsters' },
    { id: 'monsters',   title: 'Monster Library', desc: 'Create a library of reusable monsters' },
    { id: 'characters', title: 'Characters', desc: 'Manage your characters and stats' },
    { id: 'parties',    title: 'Parties', desc: 'Group characters into parties' },
    { id: 'combat',     title: 'Combat Tracker', desc: 'Run combat sessions with initiative tracking' },
  ];
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px', flex: 1, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo size={64} />
            <h1 style={{ margin: 0, fontSize: 36, fontWeight: 700, letterSpacing: '-0.01em' }}>
              D&amp;D Session Combat Tracker
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: sc.fg2, fontSize: 14 }}>
              Welcome, <span style={{ color: sc.party, fontWeight: 600 }}>dm@stronghold.dev</span>
            </span>
            <Button variant="enemy" onClick={onLogout}>Logout</Button>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18,
          maxWidth: 1000, margin: '0 auto',
        }}>
          {tiles.map((t, i) => (
            <NavTile key={t.id} title={t.title} desc={t.desc}
              span={i === 4 ? 4 : 1}
              onClick={() => onNav(t.id)} />
          ))}
        </div>

        <div style={{ textAlign: 'center', color: sc.fg3, fontSize: 14, marginTop: 40 }}>
          A simple combat tracker for D&amp;D sessions
        </div>
      </div>
      <Footer />
    </div>
  );
}

function NavTile({ title, desc, onClick, span = 1 }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        gridColumn: `span ${span}`,
        background: hover ? sc.surface2 : sc.surface1,
        borderRadius: 8, padding: 24, cursor: 'pointer',
        transition: 'background 120ms ease',
      }}
    >
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 600 }}>{title}</h2>
      <p style={{ margin: 0, color: sc.fg3, fontSize: 14, lineHeight: 1.4 }}>{desc}</p>
    </div>
  );
}

// ── Encounters list ──────────────────────────────────────────────
function EncountersScreen({ onBack, onOpenCombat }) {
  const encounters = [
    { name: 'Cragmaw Hideout — Lower Caves', desc: 'Bugbear lieutenant guards Sildar Hallwinter.', monsters: [
      { name: 'Klarg (Bugbear)', hp: 27, max: 27, ac: 16, dex: 14 },
      { name: 'Goblin Bodyguard', hp: 7, max: 7, ac: 15, dex: 14 },
      { name: 'Goblin Bodyguard', hp: 7, max: 7, ac: 15, dex: 14 },
      { name: 'Wolf', hp: 11, max: 11, ac: 13, dex: 15 },
    ]},
    { name: 'Wave Echo — Forge of Spells', desc: 'The Black Spider and her drow strike from above the catwalk.', monsters: [
      { name: 'Nezznar the Black Spider', hp: 75, max: 75, ac: 15, dex: 14 },
      { name: 'Doppelganger', hp: 52, max: 52, ac: 14, dex: 18 },
      { name: 'Giant Spider', hp: 26, max: 26, ac: 14, dex: 16 },
    ]},
    { name: 'Tomb of Annihilation — Vault', desc: 'Acererak\'s test chamber, plus the soul monger pulse.', monsters: [
      { name: 'Acererak (lich)', hp: 135, max: 135, ac: 17, dex: 16 },
    ]},
  ];
  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <PageHeader
          title="Encounters"
          right={<Button variant="ghost" onClick={onBack}>Back to Home</Button>}
        />
        <div style={{ marginBottom: 24 }}>
          <Button variant="go">Add New Encounter</Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {encounters.map((e, i) => (
            <Card key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{e.name}</h2>
                  <p style={{ margin: '4px 0 0', color: sc.fg3, fontSize: 14 }}>{e.desc}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="party" size="sm" onClick={onOpenCombat}>Run</Button>
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="enemy" size="sm">Delete</Button>
                </div>
              </div>
              <div>
                <h3 style={{ margin: '6px 0 8px', fontSize: 14, fontWeight: 700, color: sc.fg2 }}>Monsters ({e.monsters.length})</h3>
                <div style={{ display: 'grid', gap: 6 }}>
                  {e.monsters.map((m, j) => (
                    <div key={j} style={{
                      background: sc.surface2, borderRadius: 4, padding: '8px 12px',
                      fontSize: 13, display: 'flex', justifyContent: 'space-between',
                    }}>
                      <span style={{ fontWeight: 500 }}>{m.name}</span>
                      <span style={{ color: sc.fg3, fontFamily: MONO, fontSize: 12 }}>
                        HP {m.hp}/{m.max}  ·  AC {m.ac}  ·  DEX {m.dex}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Combat Tracker (the main event) ──────────────────────────────
function CombatScreen({ onBack }) {
  const [round, setRound] = React.useState(2);
  const [turn, setTurn] = React.useState(0);
  const [combatants, setCombatants] = React.useState([
    { id: 'c1', name: 'Lyra Stormcaller',     type: 'player',  init: 24, hp: 38, max: 38, ac: 15, dex: 16, conds: ['Bless · 8r'] },
    { id: 'c2', name: 'Ancient Red Dragon',   type: 'monster', init: 22, hp: 348, max: 546, ac: 22, dex: 10, conds: ['Frightened · 2r','Concentrating'] },
    { id: 'c3', name: 'Sir Gareth',           type: 'player',  init: 18, hp: 22, max: 52, ac: 18, dex: 12, conds: [] },
    { id: 'c4', name: 'Goblin 1',             type: 'monster', init: 14, hp: 0,  max: 7,   ac: 15, dex: 14, conds: ['Unconscious'] },
    { id: 'c5', name: 'Goblin 2',             type: 'monster', init: 12, hp: 5,  max: 7,   ac: 15, dex: 14, conds: ['Prone'] },
    { id: 'c6', name: 'Pip Underfoot',        type: 'player',  init: 9,  hp: 18, max: 18, ac: 14, dex: 18, conds: [] },
    { id: 'lair1', name: 'Lair · Volcano Pulse', type: 'lair', init: 20, hp: 0, max: 0, ac: 0, dex: 0, conds: [], lair: true },
  ]);

  const adjHp = (id, delta) => setCombatants(cs =>
    cs.map(c => c.id === id
      ? { ...c, hp: Math.max(0, Math.min(c.max, c.hp + delta)) }
      : c
    ));
  const advance = () => {
    let next = turn + 1;
    if (next >= combatants.length) { next = 0; setRound(r => r + 1); }
    setTurn(next);
  };

  return (
    <div>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        <PageHeader
          title="Combat Tracker"
          sub={<>Round <b style={{ color: sc.fg1 }}>{round}</b>  ·  6 combatants  ·  Encounter: <i>Wave Echo — Forge of Spells</i></>}
          right={<>
            <Button variant="party" size="sm">+ Add Party Member</Button>
            <Button variant="enemy" size="sm">+ Add Enemy</Button>
            <Button variant="lair"  size="sm">+ Add Lair</Button>
            <Button variant="ghost" size="sm">Restart Round</Button>
            <Button variant="enemy">End Combat</Button>
            <Button variant="ghost" onClick={onBack}>Back to Home</Button>
          </>}
        />

        <h2 style={{
          margin: '0 0 14px', fontSize: 18, fontWeight: 700,
          color: sc.initiative, textTransform: 'uppercase', letterSpacing: '.06em',
        }}>Initiative Order</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {combatants.map((c, i) =>
            <CombatantRow
              key={c.id}
              combatant={c}
              active={i === turn}
              onAdj={(d) => adjHp(c.id, d)}
              onNext={advance}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CombatantRow({ combatant, active, onAdj, onNext }) {
  const c = combatant;
  const dead = c.hp === 0 && c.type === 'monster';
  return (
    <div style={{
      background: sc.surface1,
      border: active ? `2px solid ${sc.initiative}` : `1px solid ${sc.border}`,
      borderRadius: 8, padding: 12,
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center',
      opacity: dead ? 0.6 : 1,
    }}>
      <InitChip value={c.init} lair={c.type === 'lair'} />

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 17, fontWeight: 700, textDecoration: dead ? 'line-through' : 'none' }}>
            {c.name}
          </span>
          <Pill tone={c.type === 'player' ? 'party' : c.type === 'lair' ? 'lair' : 'enemy'}>
            {c.type === 'player' ? 'party' : c.type === 'lair' ? 'lair' : 'enemy'}
          </Pill>
          {active && <Pill tone="initiative">Active turn</Pill>}
        </div>
        {c.type !== 'lair' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: sc.fg3, fontFamily: MONO, marginBottom: 6 }}>
              <span>HP {c.hp}/{c.max}</span>
              <HpBar hp={c.hp} max={c.max} />
              <span>AC {c.ac}</span>
              <span>DEX +{Math.floor((c.dex - 10) / 2)}</span>
            </div>
            {c.conds.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {c.conds.map((s, i) => {
                  const isConc = s.startsWith('Concentrating');
                  const isBless = s.startsWith('Bless');
                  const tone = isConc ? 'initiative' : (isBless ? 'character' : 'library');
                  return <Pill key={i} tone={tone}>{s}</Pill>;
                })}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12, color: sc.fg3 }}>
            Triggers on initiative 20. Sleeping mountain begins to stir.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {c.type !== 'lair' && <>
          <Button variant="enemy" size="xs" onClick={() => onAdj(-5)} style={{ minWidth: 38 }}>−5</Button>
          <Button variant="enemy" size="xs" onClick={() => onAdj(-1)} style={{ minWidth: 38 }}>−1</Button>
          <Button variant="go"    size="xs" onClick={() => onAdj(+1)} style={{ minWidth: 38 }}>+1</Button>
          <Button variant="go"    size="xs" onClick={() => onAdj(+5)} style={{ minWidth: 38 }}>+5</Button>
        </>}
        {active && <Button variant="go" size="sm" onClick={onNext}>Next ▸</Button>}
      </div>
    </div>
  );
}

// ── Login ────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = React.useState('dm@stronghold.dev');
  const [pwd, setPwd]   = React.useState('•••••••••');
  return (
    <div style={{
      minHeight: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 440, background: sc.surface1,
        borderRadius: 8, padding: 36,
        boxShadow: '0 10px 25px -8px rgba(0,0,0,.6)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Logo size={64} />
          <h1 style={{ margin: '10px 0 0', fontSize: 26, fontWeight: 700 }}>Login</h1>
        </div>
        <div style={{ marginBottom: 14 }}>
          <Label>Email Address</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <Label>Password</Label>
          <Input value={pwd} onChange={(e) => setPwd(e.target.value)} type="password" placeholder="••••••••" />
        </div>
        <Button variant="party" onClick={onLogin} style={{ width: '100%' }}>Login</Button>
        <p style={{ textAlign: 'center', color: sc.fg3, fontSize: 13, marginTop: 18 }}>
          Don't have an account?{' '}
          <a style={{ color: sc.party, fontWeight: 600, textDecoration: 'none' }}>Register here</a>
        </p>
      </div>
    </div>
  );
}

Object.assign(window, {
  HomeScreen, EncountersScreen, CombatScreen, LoginScreen,
  NavTile, CombatantRow,
});
