async function globalTeardown() {
  if (global.__MONGOCONTAINER__) {
    try {
      await global.__MONGOCONTAINER__.stop();
    } catch (error) {
      console.error("Failed to stop MongoDB testcontainer:", error);
    }
  }
}

export default globalTeardown;
