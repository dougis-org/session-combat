async function globalTeardown() {
  if ((global as any).__MONGOCONTAINER__) {
    await (global as any).__MONGOCONTAINER__.stop();
  }
}

export default globalTeardown;
