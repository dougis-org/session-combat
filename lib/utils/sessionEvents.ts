import { PartyMember, SessionEvent } from '@/lib/types';

/**
 * Computes auto-populated NPC events from party membership changes in a time window.
 * Returns npc_joined events for members whose addedAt falls after windowStart,
 * and npc_left events for members whose leftAt falls after windowStart.
 * @param members All party members (active and departed)
 * @param windowStart The start of the time window (null = epoch, captures all)
 */
export function buildNpcEventsFromMemberChanges(
  members: PartyMember[],
  windowStart: Date | null
): SessionEvent[] {
  const start = windowStart ?? new Date(0);
  const events: SessionEvent[] = [];

  for (const member of members) {
    const addedAt = new Date(member.addedAt);
    if (addedAt > start) {
      events.push({
        type: 'npc_joined',
        characterId: member.characterId,
        description: `Character (${member.characterId}) joined the party`,
        timestamp: addedAt,
      });
    }
    if (member.leftAt) {
      const leftAt = new Date(member.leftAt);
      if (leftAt > start) {
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
