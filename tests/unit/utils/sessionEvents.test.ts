import { buildNpcEventsFromMemberChanges } from '@/lib/utils/sessionEvents';
import { PartyMember } from '@/lib/types';

const T0 = new Date('2026-01-01T00:00:00Z');
const T1 = new Date('2026-02-01T00:00:00Z');
const T2 = new Date('2026-03-01T00:00:00Z');
const T3 = new Date('2026-04-01T00:00:00Z');

describe('buildNpcEventsFromMemberChanges', () => {
  it('returns npc_joined event for member whose addedAt is after windowStart', () => {
    const members: PartyMember[] = [{ characterId: 'char-1', addedAt: T2 }];
    const events = buildNpcEventsFromMemberChanges(members, T1);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('npc_joined');
    expect(events[0].characterId).toBe('char-1');
  });

  it('returns npc_left event for member whose leftAt is after windowStart', () => {
    const members: PartyMember[] = [{ characterId: 'char-1', addedAt: T0, leftAt: T2 }];
    const events = buildNpcEventsFromMemberChanges(members, T1);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('npc_left');
    expect(events[0].characterId).toBe('char-1');
  });

  it('excludes members whose addedAt is before or equal to windowStart', () => {
    const members: PartyMember[] = [{ characterId: 'char-1', addedAt: T0 }];
    const events = buildNpcEventsFromMemberChanges(members, T1);
    expect(events).toHaveLength(0);
  });

  it('includes only active members as npc_joined when windowStart is null (first session)', () => {
    const members: PartyMember[] = [
      { characterId: 'char-1', addedAt: T1 },
      { characterId: 'char-2', addedAt: T2 },
      { characterId: 'departed', addedAt: T0, leftAt: T1 },
    ];
    const events = buildNpcEventsFromMemberChanges(members, null);
    expect(events).toHaveLength(2);
    expect(events.every(e => e.type === 'npc_joined')).toBe(true);
    expect(events.map(e => e.characterId)).not.toContain('departed');
  });

  it('returns exactly 2 events for mixed party: 1 joined + 1 departed, 1 unchanged', () => {
    const members: PartyMember[] = [
      { characterId: 'unchanged', addedAt: T0 },
      { characterId: 'new-member', addedAt: T2 },
      { characterId: 'departed', addedAt: T0, leftAt: T2 },
    ];
    const events = buildNpcEventsFromMemberChanges(members, T1);
    expect(events).toHaveLength(2);
    const types = events.map(e => e.type);
    expect(types).toContain('npc_joined');
    expect(types).toContain('npc_left');
  });

  it('returns both joined and departed events for a member who joined and left in window', () => {
    const members: PartyMember[] = [{ characterId: 'char-1', addedAt: T2, leftAt: T3 }];
    const events = buildNpcEventsFromMemberChanges(members, T1);
    expect(events).toHaveLength(2);
  });
});
