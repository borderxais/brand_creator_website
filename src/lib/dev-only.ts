export class DevOnlyForbiddenError extends Error {
  readonly status = 404;
  constructor() {
    super("dev-only endpoint disabled in production");
    this.name = "DevOnlyForbiddenError";
  }
}

export function assertDevOnly(): void {
  if (process.env.NODE_ENV === "production") {
    throw new DevOnlyForbiddenError();
  }
}
