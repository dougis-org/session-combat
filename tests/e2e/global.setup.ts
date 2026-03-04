async function globalSetup() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. E2E tests require a running MongoDB instance.\n" +
      "Set MONGODB_URI before running: MONGODB_URI=mongodb://localhost:27017 npm run test:regression",
    );
  }
}

export default globalSetup;
