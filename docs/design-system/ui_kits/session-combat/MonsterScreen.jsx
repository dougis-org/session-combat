// SessionCombat — Monster stat block detail screen
function MonsterScreen({ onBack }) {
  const m = {
    name: 'Adult Red Dragon',
    cr: '17',
    type: 'Huge dragon, chaotic evil',
    ac: 19, acNote: 'natural armor',
    hp: 256, max: 256, hd: '19d12 + 133',
    speed: '40 ft., climb 40 ft., fly 80 ft.',
    scores: { strength: 27, dexterity: 10, constitution: 25, intelligence: 16, wisdom: 13, charisma: 21 },
    saves: { dexterity: 6, constitution: 13, wisdom: 7, charisma: 11 },
    skills: { perception: 13, stealth: 6 },
    immunities: 'fire',
    senses: 'blindsight 60 ft., darkvision 120 ft., passive Perception 23',
    languages: 'Common, Draconic',
    traits: [
      { name: 'Legendary Resistance (3/Day)', desc: 'If the dragon fails a saving throw, it can choose to succeed instead.' },
    ],
    actions: [
      { name: 'Multiattack', desc: 'The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws.' },
      { name: 'Bite', desc: 'Melee Weapon Attack. Reach 10 ft., one target.', atk: '+14', dmg: '2d10+8 piercing + 4d6 fire' },
      { name: 'Claw', desc: 'Melee Weapon Attack. Reach 5 ft., one target.', atk: '+14', dmg: '2d6+8 slashing' },
      { name: 'Fire Breath (Recharge 5–6)', desc: 'The dragon exhales fire in a 60-ft. cone.', save: 'DC 21 DEX', dmg: '18d6 fire (half on save)' },
    ],
    legendary: [
      { name: 'Detect', desc: 'The dragon makes a Wisdom (Perception) check.' },
      { name: 'Tail Attack', desc: 'The dragon makes a tail attack.' },
      { name: 'Wing Attack (2)', desc: 'The dragon beats its wings; each creature within 15 ft. must make a DC 22 DEX save.' },
    ],
  };
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
      <PageHeader
        title="Monster Library"
        sub="Adult Red Dragon · CR 17 · SRD"
        right={<>
          <Button variant="party" size="sm">Add to Encounter</Button>
          <Button variant="ghost" onClick={onBack}>Back to Home</Button>
        </>}
      />

      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `1px solid ${sc.border}`, paddingBottom: 14, marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{m.name}</h2>
            <p style={{ margin: '4px 0 0', color: sc.fg3, fontSize: 13, fontStyle: 'italic' }}>{m.type}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Pill tone="library">SRD</Pill>
            <Pill tone="muted">CR {m.cr}</Pill>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          <KV label="Armor Class" value={`${m.ac} (${m.acNote})`} />
          <KV label="Hit Points"  value={`${m.hp} (${m.hd})`} />
          <KV label="Speed"       value={m.speed} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <SubLabel>Ability Scores</SubLabel>
          <AbilityScores scores={m.scores} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 13 }}>
          <Meta label="Saving Throws" value="DEX +6, CON +13, WIS +7, CHA +11" />
          <Meta label="Skills"        value="Perception +13, Stealth +6" />
          <Meta label="Damage Immunities" value={m.immunities} />
          <Meta label="Senses"        value={m.senses} />
          <Meta label="Languages"     value={m.languages} />
        </div>

        <Section title="Traits"            items={m.traits} />
        <Section title="Actions"           items={m.actions} />
        <Section title="Legendary Actions" items={m.legendary} desc="The dragon can take 3 legendary actions at the end of each other creature's turn." />
      </Card>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div style={{ background: sc.surface2, borderRadius: 4, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: sc.fg3, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}
function Meta({ label, value }) {
  return (
    <div style={{ fontSize: 12, color: sc.fg2 }}>
      <span style={{ fontWeight: 700, color: sc.fg2 }}>{label}: </span>
      <span style={{ color: sc.fg3 }}>{value}</span>
    </div>
  );
}
function SubLabel({ children }) {
  return <div style={{
    fontSize: 11, fontWeight: 700, color: sc.fg2,
    textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8,
  }}>{children}</div>;
}
function Section({ title, items, desc }) {
  if (!items || !items.length) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <SubLabel>{title}</SubLabel>
      {desc && <div style={{ fontSize: 12, color: sc.fg3, marginBottom: 8, fontStyle: 'italic' }}>{desc}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: sc.surface2, borderRadius: 4, padding: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{it.name}</div>
            <div style={{ fontSize: 12, color: sc.fg2, marginTop: 4, lineHeight: 1.5 }}>{it.desc}</div>
            {(it.atk || it.dmg || it.save) && (
              <div style={{ fontSize: 11, color: sc.fg3, marginTop: 6, fontFamily: MONO, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {it.atk && <span><b>Attack:</b> {it.atk}</span>}
                {it.dmg && <span><b>Damage:</b> {it.dmg}</span>}
                {it.save && <span><b>Save:</b> {it.save}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { MonsterScreen, KV, Meta, SubLabel, Section });
