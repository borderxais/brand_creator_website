type Probe = () => Promise<{ name: string; ok: boolean; detail?: string }>;
const REGISTRY = new Map<string, Probe[]>();

export function registerProbe(specFile: string, probe: Probe): void {
  const list = REGISTRY.get(specFile) ?? [];
  list.push(probe);
  REGISTRY.set(specFile, list);
}

export function getProbes(specFile: string): Probe[] {
  return REGISTRY.get(specFile) ?? [];
}
