module.exports = {
  async onSuccess({ utils }) {
    const url = process.env.DEPLOY_PRIME_URL;
    if (!url) {
      console.log("[smoke-e2e] DEPLOY_PRIME_URL not set; skipping (production deploy).");
      return;
    }

    try {
      await utils.run.command("npx playwright install --with-deps chromium");
      await utils.run.command(
        `PLAYWRIGHT_BASE_URL=${url} npx playwright test e2e/smoke --reporter=list`
      );
    } catch (err) {
      utils.build.failPlugin(
        "Smoke E2E failed against preview. See docs/deployment.md#preview-gates",
        { error: err }
      );
    }
  },
};
