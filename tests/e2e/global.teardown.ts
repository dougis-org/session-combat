async function globalTeardown() {
  if (global.__MONGOCONTAINER__) {
    await global.__MONGOCONTAINER__.stop();
  }
}

export default globalTeardown;
