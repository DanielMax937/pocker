export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const stub = {
      getItem: (_key: string) => null as string | null,
      setItem: (_key: string, _val: string) => {},
      removeItem: (_key: string) => {},
      clear: () => {},
      get length() {
        return 0;
      },
      key: (_i: number) => null as string | null,
    };
    const g = globalThis as unknown as { localStorage: typeof stub };
    if (!g.localStorage || typeof g.localStorage.getItem !== 'function') {
      g.localStorage = stub;
    }
    // Warm Prisma + SQLite so first /api/* request is not blocked on cold connect.
    try {
      const { default: prisma } = await import('./lib/prisma');
      await prisma.$connect();
    } catch (e) {
      console.warn('[instrumentation] prisma warm-up failed:', e);
    }
  }
}
