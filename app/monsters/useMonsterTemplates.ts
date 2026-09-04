'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MonsterTemplate } from '@/lib/types';
import { GLOBAL_USER_ID } from '@/lib/constants';

export type LibraryMode = 'user' | 'global';

function blankTemplate(mode: LibraryMode): MonsterTemplate {
  return {
    id: '',
    userId: mode === 'global' ? GLOBAL_USER_ID : '',
    name: 'New Monster',
    size: 'medium',
    type: 'humanoid',
    ac: 10,
    hp: 10,
    maxHp: 10,
    speed: '30 ft.',
    challengeRating: 0,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    isGlobal: mode === 'global',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const endpointFor = (mode: LibraryMode) =>
  mode === 'global' ? '/api/monsters/global' : '/api/monsters';

/**
 * Owns the monster-library data, admin state, and CRUD/editor behavior for the
 * `/monsters` page. The page component is responsible only for filter state and
 * composition.
 */
export function useMonsterTemplates() {
  const [userTemplates, setUserTemplates] = useState<MonsterTemplate[]>([]);
  const [globalTemplates, setGlobalTemplates] = useState<MonsterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MonsterTemplate | null>(null);
  const [editingMode, setEditingMode] = useState<LibraryMode>('user');
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/monsters');
      if (!response.ok) throw new Error('Failed to fetch user templates');
      const data: MonsterTemplate[] = await response.json();
      setUserTemplates(data.filter((t) => t.userId !== GLOBAL_USER_ID));
      setGlobalTemplates(data.filter((t) => t.userId === GLOBAL_USER_ID));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    (async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin === true);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
    })();
  }, [fetchTemplates]);

  const cancelEdit = useCallback(() => {
    setIsAddingTemplate(false);
    setEditingTemplate(null);
  }, []);

  useEffect(() => {
    if (!editingTemplate) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelEdit();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [editingTemplate, cancelEdit]);

  const addTemplate = useCallback(
    (mode: LibraryMode) => {
      if (mode === 'global' && !isAdmin) {
        setError('Only administrators can create global monster templates');
        return;
      }
      setEditingTemplate(blankTemplate(mode));
      setEditingMode(mode);
      setIsAddingTemplate(true);
    },
    [isAdmin],
  );

  const startEdit = useCallback((template: MonsterTemplate, mode: LibraryMode) => {
    setEditingTemplate(template);
    setEditingMode(mode);
    setIsAddingTemplate(false);
  }, []);

  const saveTemplate = useCallback(
    async (template: MonsterTemplate) => {
      try {
        setError(null);
        const base = endpointFor(editingMode);
        const url = isAddingTemplate ? base : `${base}/${template.id}`;
        const response = await fetch(url, {
          method: isAddingTemplate ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save monster template');
        }
        await fetchTemplates();
        setIsAddingTemplate(false);
        setEditingTemplate(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save monster template');
      }
    },
    [editingMode, isAddingTemplate, fetchTemplates],
  );

  const deleteTemplate = useCallback(
    async (id: string, mode: LibraryMode) => {
      if (!confirm('Are you sure you want to delete this monster template?')) return;
      try {
        setError(null);
        const response = await fetch(`${endpointFor(mode)}/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete monster template');
        await fetchTemplates();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete monster template');
      }
    },
    [fetchTemplates],
  );

  const copyTemplate = useCallback(
    async (id: string) => {
      if (copyingId) return; // avoid a race with copyingId state
      try {
        setError(null);
        setCopyingId(id);
        const response = await fetch(`/api/monsters/${id}/duplicate`, { method: 'POST' });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to copy monster');
        }
        await fetchTemplates();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to copy monster');
      } finally {
        setCopyingId(null);
      }
    },
    [copyingId, fetchTemplates],
  );

  return {
    userTemplates,
    globalTemplates,
    loading,
    error,
    isAdmin,
    copyingId,
    editingTemplate,
    editingMode,
    isAddingTemplate,
    fetchTemplates,
    addTemplate,
    startEdit,
    saveTemplate,
    deleteTemplate,
    copyTemplate,
    cancelEdit,
  };
}
