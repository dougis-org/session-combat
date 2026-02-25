import { StartedMongoDbContainer } from '@testcontainers/mongodb';

declare global {
  var __MONGOCONTAINER__: StartedMongoDbContainer | undefined;
}
