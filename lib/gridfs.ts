import { Db, ObjectId, GridFSBucket, GridFSBucketReadStream } from 'mongodb';

export function getAttachmentsBucket(db: Db): GridFSBucket {
  return new GridFSBucket(db, { bucketName: 'attachments' });
}

export async function uploadAttachment(
  bucket: GridFSBucket,
  file: File,
  campaignId: string,
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const id = new ObjectId();

  await new Promise<void>((resolve, reject) => {
    const uploadStream = bucket.openUploadStreamWithId(id, file.name, {
      metadata: {
        campaignId,
        status: 'pending',
        uploadedAt: new Date(),
        contentType: file.type,
      },
    });
    uploadStream.on('error', reject);
    uploadStream.on('finish', resolve);
    uploadStream.end(buffer);
  });

  return id.toHexString();
}

export async function updateAttachmentStatus(
  db: Db,
  attachmentId: string,
  status: string,
): Promise<void> {
  if (!ObjectId.isValid(attachmentId)) {
    throw Object.assign(new Error('Invalid attachmentId'), { code: 'INVALID_ID' });
  }
  await db
    .collection('attachments.files')
    .updateOne({ _id: new ObjectId(attachmentId) }, { $set: { 'metadata.status': status } });
}

export async function openDownloadStream(
  bucket: GridFSBucket,
  attachmentId: string,
): Promise<{ stream: GridFSBucketReadStream; contentType: string; campaignId: string }> {
  if (!ObjectId.isValid(attachmentId)) {
    throw Object.assign(new Error('Invalid attachmentId'), { code: 'INVALID_ID' });
  }

  const oid = new ObjectId(attachmentId);
  const files = await bucket.find({ _id: oid }).toArray();

  if (files.length === 0) {
    throw Object.assign(new Error('Attachment not found'), { code: 'NOT_FOUND' });
  }

  const file = files[0];
  const contentType = (file.metadata?.contentType as string) ?? 'application/octet-stream';
  const campaignId = file.metadata?.campaignId as string;

  const stream = bucket.openDownloadStream(oid);
  return { stream, contentType, campaignId };
}

export async function deleteOrphanedAttachments(
  bucket: GridFSBucket,
  campaignId: string,
  thresholdMs: number = 24 * 60 * 60 * 1000,
): Promise<void> {
  try {
    const threshold = new Date(Date.now() - thresholdMs);
    const orphans = await bucket
      .find({
        'metadata.campaignId': campaignId,
        'metadata.status': 'pending',
        'metadata.uploadedAt': { $lt: threshold },
      })
      .toArray();

    await Promise.all(orphans.map((f) => bucket.delete(f._id)));
  } catch (err) {
    console.error('deleteOrphanedAttachments error:', err);
  }
}
