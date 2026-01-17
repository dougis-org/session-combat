/**
 * Utility functions for offline-first API route handlers
 * Reduces duplication across encounters, parties, characters endpoints
 */

import { NextResponse } from 'next/server';
import { getLocalStore } from '@/lib/sync/LocalStore';
import { getSyncQueue } from '@/lib/sync/SyncQueue';
import { mergeLocalAndRemote } from '@/lib/sync/mergeLocalAndRemote';

const OFFLINE_MODE_ENABLED = process.env.NEXT_PUBLIC_OFFLINE_MODE_ENABLED !== 'false';

/**
 * GET handler for offline-first resource
 */
export async function offlineGet<T>(
  resourceType: string,
  onRemoteFetch: () => Promise<T[]>
): Promise<NextResponse> {
  try {
    // Always attempt to fetch remote data using the provided callback
    const remote = await onRemoteFetch();

    if (!OFFLINE_MODE_ENABLED) {
      return NextResponse.json({ data: remote, source: 'remote' });
    }

    const localStore = getLocalStore();
    const local = await localStore.loadAllEntities(resourceType);

    const merged = mergeLocalAndRemote(local as unknown as any[], remote as unknown as any[], { excludeDeleted: true });
    return NextResponse.json({
      data: merged,
      source: local.length > 0 && remote.length === 0 ? 'local' : 'merged',
      syncStatus: 'synced'
    });
  } catch (error) {
    console.error(`[API] GET /${resourceType} error:`, error);
    return NextResponse.json({ error: `Failed to fetch ${resourceType}` }, { status: 500 });
  }
}

/**
 * POST handler for offline-first resource
 */
export async function offlinePost<T extends { id: string }>(
  resourceType: string,
  payload: T
): Promise<NextResponse> {
  try {
    if (!OFFLINE_MODE_ENABLED) {
      return NextResponse.json(payload);
    }

    const localStore = getLocalStore();
    const syncQueue = getSyncQueue();

    const created = await localStore.saveEntity(resourceType, payload.id, payload);
    await syncQueue.enqueue({
      type: 'POST',
      resource: resourceType,
      payload
    });

    return NextResponse.json({
      ...created,
      _syncPending: true
    });
  } catch (error) {
    console.error(`[API] POST /${resourceType} error:`, error);
    return NextResponse.json({ error: `Failed to create ${resourceType}` }, { status: 500 });
  }
}

/**
 * PUT handler for offline-first resource
 */
export async function offlinePut<T extends { id: string }>(
  resourceType: string,
  payload: T
): Promise<NextResponse> {
  try {
    if (!OFFLINE_MODE_ENABLED) {
      return NextResponse.json(payload);
    }

    const localStore = getLocalStore();
    const syncQueue = getSyncQueue();

    const updated = await localStore.saveEntity(resourceType, payload.id, payload);
    await syncQueue.enqueue({
      type: 'PUT',
      resource: resourceType,
      payload
    });

    return NextResponse.json({
      ...updated,
      _syncPending: true
    });
  } catch (error) {
    console.error(`[API] PUT /${resourceType} error:`, error);
    return NextResponse.json({ error: `Failed to update ${resourceType}` }, { status: 500 });
  }
}

/**
 * DELETE handler for offline-first resource
 */
export async function offlineDelete(
  resourceType: string,
  id: string
): Promise<NextResponse> {
  try {
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    if (!OFFLINE_MODE_ENABLED) {
      return NextResponse.json({ success: true });
    }

    const localStore = getLocalStore();
    const syncQueue = getSyncQueue();

    await localStore.deleteEntity(resourceType, id);
    await syncQueue.enqueue({
      type: 'DELETE',
      resource: resourceType,
      payload: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[API] DELETE /${resourceType} error:`, error);
    return NextResponse.json({ error: `Failed to delete ${resourceType}` }, { status: 500 });
  }
}
