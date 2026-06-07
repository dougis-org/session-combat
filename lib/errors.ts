export class DuplicateShareError extends Error {
  constructor(campaignId: string, characterId: string) {
    super(`Character "${characterId}" is already shared into campaign "${campaignId}".`);
    this.name = "DuplicateShareError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DuplicateShareError);
    }
  }
}

export class DuplicateMemberError extends Error {
  constructor(campaignId: string, userId: string) {
    super(`User "${userId}" is already a member of campaign "${campaignId}".`);
    this.name = "DuplicateMemberError";
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DuplicateMemberError);
    }
  }
}
