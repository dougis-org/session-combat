import { StartedMongoDBContainer } from '@testcontainers/mongodb';

declare global {
  var __MONGOCONTAINER__: StartedMongoDBContainer | undefined;
}
