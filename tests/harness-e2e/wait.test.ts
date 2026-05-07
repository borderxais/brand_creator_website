import { describe, it, expect } from "vitest";
import { waitForHttp } from "../../scripts/e2e/lib/wait";
import http from "node:http";

describe("waitForHttp", () => {
  it("resolves when endpoint returns 200", async () => {
    const srv = http.createServer((_req, res) => {
      res.statusCode = 200;
      res.end("ok");
    });
    await new Promise<void>((r) => srv.listen(0, r));
    const port = (srv.address() as any).port;
    await waitForHttp(`http://localhost:${port}`, { timeoutMs: 2000, intervalMs: 50 });
    srv.close();
  });

  it("rejects after timeoutMs when endpoint never responds", async () => {
    await expect(
      waitForHttp("http://localhost:1", { timeoutMs: 200, intervalMs: 50 })
    ).rejects.toThrow(/timeout/i);
  });
});
