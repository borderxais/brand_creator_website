interface PWReport {
  stats: { expected: number; unexpected: number; flaky: number; skipped: number; duration: number };
  suites: PWSuite[];
}
interface PWSuite {
  title: string;
  specs: PWSpec[];
  suites?: PWSuite[];
}
interface PWSpec {
  title: string;
  tests: { results: PWResult[] }[];
}
interface PWResult {
  status: string;
  error?: { message?: string } | null;
  attachments?: { name: string; path?: string }[];
}

function* walk(suites: PWSuite[]): Generator<{ file: string; spec: PWSpec }> {
  for (const s of suites) {
    for (const spec of s.specs) yield { file: s.title, spec };
    if (s.suites) yield* walk(s.suites);
  }
}

export function buildSummary(report: PWReport, runId: string): string {
  const { expected, unexpected, flaky, skipped } = report.stats;
  const header =
    unexpected === 0
      ? `# E2E run ${runId} — ALL PASS\n\n${expected} passed, ${flaky} flaky, ${skipped} skipped\n`
      : `# E2E run ${runId} — ${unexpected} FAILED\n\n${expected} passed, ${unexpected} failed, ${flaky} flaky, ${skipped} skipped\n`;

  const blocks: string[] = [];
  for (const { file, spec } of walk(report.suites)) {
    const last = spec.tests[0]?.results.at(-1);
    if (!last || last.status === "passed") continue;
    const trace = last.attachments?.find((a) => a.name === "trace")?.path ?? "(no trace)";
    blocks.push(
      [
        `## FAIL ${file} › ${spec.title}`,
        `  status: ${last.status}`,
        `  error:  ${last.error?.message ?? "(no error message)"}`,
        `  trace:  ${trace}`,
        "",
      ].join("\n")
    );
  }
  return header + (blocks.length ? "\n" + blocks.join("\n") : "");
}
