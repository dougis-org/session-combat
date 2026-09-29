# fix-party-campaign-authz

Add DM-authorization gate to party-campaign linking/unlinking and reject non-string (malformed) `campaignId` values in party routes. An empty-string `campaignId` remains a valid, authorized explicit-unlink request.
