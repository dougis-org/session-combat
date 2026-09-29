export class StorageError extends Error {
  readonly op: string;
  readonly collection: string;

  constructor(op: string, collection: string, options: { cause: unknown }) {
    super(`Storage operation "${op}" failed on collection "${collection}"`, {
      cause: options.cause,
    });
    this.name = "StorageError";
    this.op = op;
    this.collection = collection;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StorageError);
    }
  }
}

export class PartyCampaignAuthorizationError extends Error {
  readonly campaignId: string;
  readonly userId: string;

  constructor(campaignId: string, userId: string) {
    super(`User "${userId}" is not an active DM of campaign "${campaignId}"`);
    this.name = "PartyCampaignAuthorizationError";
    this.campaignId = campaignId;
    this.userId = userId;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PartyCampaignAuthorizationError);
    }
  }
}
