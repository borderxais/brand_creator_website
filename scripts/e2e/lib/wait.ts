export interface WaitOpts {
  timeoutMs: number;
  intervalMs: number;
}

export async function waitForHttp(url: string, opts: WaitOpts): Promise<void> {
  const deadline = Date.now() + opts.timeoutMs;
  let lastErr: unknown = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status >= 200 && res.status < 500) return;
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, opts.intervalMs));
  }
  throw new Error(`waitForHttp timeout after ${opts.timeoutMs}ms for ${url}: ${String(lastErr)}`);
}
