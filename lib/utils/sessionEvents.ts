import type { PartyMember, SessionEvent } from '@/lib/types';

/**
 * Computes auto-populated NPC events from party membership changes in a time window.
 * Returns npc_joined events for members whose addedAt falls after windowStart,
 * and npc_left events for members whose leftAt falls after windowStart.
 * @param members All party members (active and departed)
 * @param windowStart The start of the time window (null = first session: emit only currently active members as joined)
 */
export function buildNpcEventsFromMemberChanges(
  members: PartyMember[],
  windowStart: Date | null
): SessionEvent[] {
  const events: SessionEvent[] = [];

  if (windowStart === null) {
    // First session: emit npc_joined only for currently active members
    for (const member of members) {
      if (!member.leftAt) {
        events.push({
          type: 'npc_joined',
          characterId: member.characterId,
          description: `Character (${member.characterId}) joined the party`,
          timestamp: new Date(member.addedAt),
        });
      }
    }
    return events;
  }

  for (const member of members) {
    const addedAt = new Date(member.addedAt);
    if (addedAt > windowStart) {
      events.push({
        type: 'npc_joined',
        characterId: member.characterId,
        description: `Character (${member.characterId}) joined the party`,
        timestamp: addedAt,
      });
    }
    if (member.leftAt) {
      const leftAt = new Date(member.leftAt);
      if (leftAt > windowStart) {
        events.push({
          type: 'npc_left',
          characterId: member.characterId,
          description: `Character (${member.characterId}) departed the party`,
          timestamp: leftAt,
        });
      }
    }
  }

  return events;
}
