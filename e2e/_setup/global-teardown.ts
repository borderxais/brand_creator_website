export default async function globalTeardown(): Promise<void> {
  // No-op. Compose stack stays up across runs (idempotent).
}
