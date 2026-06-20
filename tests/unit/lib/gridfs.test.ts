/**
 * @jest-environment node
 */
import { ObjectId } from 'mongodb';
import {
  getAttachmentsBucket,
  uploadAttachment,
  openDownloadStream,
  deleteOrphanedAttachments,
  updateAttachmentStatus,
} from '@/lib/gridfs';

function makeBucket(overrides: Record<string, jest.Mock> = {}) {
  return {
    openUploadStreamWithId: jest.fn(),
    openDownloadStream: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  } as any;
}

function makeFile(
  name = 'test.jpg',
  type = 'image/jpeg',
  content = 'fake-image-bytes',
): File {
  return new File([content], name, { type });
}

// ─── getAttachmentsBucket ─────────────────────────────────────────────────────

describe('getAttachmentsBucket', () => {
  it('returns a GridFSBucket with bucketName attachments', () => {
    const { GridFSBucket } = jest.requireActual('mongodb');
    const mockDb = {
      collection: jest.fn().mockReturnValue({}),
    } as any;
    const bucket = getAttachmentsBucket(mockDb);
    expect(bucket).toBeInstanceOf(GridFSBucket);
  });
});

// ─── uploadAttachment ─────────────────────────────────────────────────────────

describe('uploadAttachment', () => {
  it('streams file to GridFS and returns hex ObjectId', async () => {
    const finishListeners: Array<() => void> = [];
    const mockStream = {
      on: jest.fn((event: string, cb: () => void) => {
        if (event === 'finish') finishListeners.push(cb);
        return mockStream;
      }),
      end: jest.fn(() => {
        finishListeners.forEach((cb) => cb());
      }),
    };

    const bucket = makeBucket({
      openUploadStreamWithId: jest.fn().mockReturnValue(mockStream),
    });

    const file = makeFile();
    const result = await uploadAttachment(bucket, file, 'campaign-abc');

    expect(typeof result).toBe('string');
    expect(result).toHaveLength(24);
    expect(bucket.openUploadStreamWithId).toHaveBeenCalledWith(
      expect.any(ObjectId),
      'test.jpg',
      expect.objectContaining({
        metadata: expect.objectContaining({
          campaignId: 'campaign-abc',
          status: 'pending',
          contentType: 'image/jpeg',
          uploadedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('rejects if the upload stream emits an error', async () => {
    const errorListeners: Array<(err: Error) => void> = [];
    const mockStream = {
      on: jest.fn((event: string, cb: (err: Error) => void) => {
        if (event === 'error') errorListeners.push(cb);
        return mockStream;
      }),
      end: jest.fn(() => {
        errorListeners.forEach((cb) => cb(new Error('GridFS error')));
      }),
    };

    const bucket = makeBucket({
      openUploadStreamWithId: jest.fn().mockReturnValue(mockStream),
    });

    await expect(uploadAttachment(bucket, makeFile(), 'campaign-abc')).rejects.toThrow(
      'GridFS error',
    );
  });
});

// ─── openDownloadStream ───────────────────────────────────────────────────────

describe('openDownloadStream', () => {
  const validId = new ObjectId().toHexString();

  it('returns stream, contentType, and campaignId for a valid attachment', async () => {
    const mockStream = { pipe: jest.fn() };
    const bucket = makeBucket({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(validId),
            metadata: { contentType: 'image/jpeg', campaignId: 'camp-1' },
          },
        ]),
      }),
      openDownloadStream: jest.fn().mockReturnValue(mockStream),
    });

    const result = await openDownloadStream(bucket, validId);
    expect(result.stream).toBe(mockStream);
    expect(result.contentType).toBe('image/jpeg');
    expect(result.campaignId).toBe('camp-1');
  });

  it('throws NOT_FOUND for a non-existent attachment', async () => {
    const bucket = makeBucket({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      }),
    });

    await expect(openDownloadStream(bucket, validId)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws INVALID_ID for a malformed attachmentId', async () => {
    const bucket = makeBucket();
    await expect(openDownloadStream(bucket, 'not-a-valid-id')).rejects.toMatchObject({
      code: 'INVALID_ID',
    });
  });
});

// ─── deleteOrphanedAttachments ────────────────────────────────────────────────

describe('deleteOrphanedAttachments', () => {
  it('deletes orphaned pending files older than threshold', async () => {
    const orphanId = new ObjectId();
    const bucket = makeBucket({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{ _id: orphanId }]),
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    });

    await deleteOrphanedAttachments(bucket, 'camp-1');

    expect(bucket.find).toHaveBeenCalledWith(
      expect.objectContaining({
        'metadata.campaignId': 'camp-1',
        'metadata.status': 'pending',
        'metadata.uploadedAt': expect.objectContaining({ $lt: expect.any(Date) }),
      }),
    );
    expect(bucket.delete).toHaveBeenCalledWith(orphanId);
  });

  it('does not call delete when no orphans found', async () => {
    const bucket = makeBucket({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      }),
      delete: jest.fn(),
    });

    await deleteOrphanedAttachments(bucket, 'camp-1');
    expect(bucket.delete).not.toHaveBeenCalled();
  });

  it('swallows errors (best-effort sweep)', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const bucket = makeBucket({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('MongoDB timeout')),
      }),
    });

    await expect(deleteOrphanedAttachments(bucket, 'camp-1')).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('uses custom thresholdMs', async () => {
    const bucket = makeBucket({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      }),
      delete: jest.fn(),
    });

    const before = Date.now();
    await deleteOrphanedAttachments(bucket, 'camp-1', 1000);
    const after = Date.now();

    const callArg = bucket.find.mock.calls[0][0];
    const threshold: Date = callArg['metadata.uploadedAt'].$lt;
    expect(threshold.getTime()).toBeGreaterThanOrEqual(before - 1000 - 500);
    expect(threshold.getTime()).toBeLessThanOrEqual(after - 1000 + 500);
  });
});

// ─── updateAttachmentStatus ───────────────────────────────────────────────────

describe('updateAttachmentStatus', () => {
  function makeDb(updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 })) {
    return {
      collection: jest.fn().mockReturnValue({ updateOne }),
    } as any;
  }

  it('updates status in attachments.files collection', async () => {
    const db = makeDb();
    const id = new ObjectId().toHexString();

    await updateAttachmentStatus(db, id, 'active');

    expect(db.collection).toHaveBeenCalledWith('attachments.files');
    expect(db.collection().updateOne).toHaveBeenCalledWith(
      { _id: expect.any(ObjectId) },
      { $set: { 'metadata.status': 'active' } },
    );
  });

  it('throws INVALID_ID for a non-hex string', async () => {
    const db = makeDb();
    await expect(updateAttachmentStatus(db, 'not-an-id', 'active')).rejects.toMatchObject({
      code: 'INVALID_ID',
    });
  });
});
