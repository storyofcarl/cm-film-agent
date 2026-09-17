const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("@playwright/test");

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1000 },
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(
      (process.env.STUDIO_TEST_URL || "http://127.0.0.1:43190") + "/demo",
    );
    const strip = page.getByRole("region", {
      name: "Project strip",
      exact: true,
    });
    await strip.waitFor();
    const sidebar = await page.locator(".project-nav").boundingBox();
    const stripBounds = await strip.boundingBox();
    assert.ok(
      sidebar.x + sidebar.width <= stripBounds.x + 1,
      "Strip belongs to the right of the full-height project sidebar.",
    );
    assert.ok(
      sidebar.y <= stripBounds.y,
      "Sidebar must begin alongside the strip, not below it.",
    );
    const selection = await strip
      .locator('[aria-pressed="true"]')
      .textContent();
    const crumbs = await strip.getByRole("navigation").textContent();
    for (const name of [
      "Assets 3",
      /^Batches \d+$/,
      "History",
      "Review all shots",
      "Production overview",
      "Scene workspace",
    ]) {
      await page.getByRole("button", { name, exact: true }).click();
      assert.equal(await strip.count(), 1);
      assert.ok(await strip.isVisible());
      assert.equal(await strip.getByRole("navigation").textContent(), crumbs);
      assert.equal(
        await strip.locator('[aria-pressed="true"]').textContent(),
        selection,
      );
      const top = await strip.boundingBox();
      const workspace = await page.locator("main.workspace").boundingBox();
      assert.ok(
        top.y + top.height <= workspace.y + 1,
        "Strip must precede every workspace view.",
      );
    }
    await page.getByRole("button", { name: "Assets 3", exact: true }).click();
    await strip.getByRole("navigation").getByRole("button").first().click();
    for (const type of ["act", "sequence", "scene"]) {
      assert.equal(
        await strip.locator(".hierarchy-card small").first().textContent(),
        type,
      );
      await strip.locator(".hierarchy-card").first().click();
      assert.ok(
        await page
          .getByRole("heading", { name: "Assets", exact: true })
          .isVisible(),
        "Hierarchy browsing must not change the active view.",
      );
    }
    await strip.locator(".hierarchy-card").nth(1).click();
    assert.ok(
      (await strip
        .locator(".hierarchy-card")
        .nth(1)
        .getAttribute("aria-pressed")) === "true",
    );
    await page
      .getByRole("heading", { name: "The observatory", exact: true })
      .waitFor();
    fs.mkdirSync("artifacts", { recursive: true });
    await page.screenshot({
      path: "artifacts/studio-desktop.png",
      animations: "disabled",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Assets 3", exact: true }).click();
    await page.screenshot({
      path: "artifacts/studio-assets-top-strip.png",
      animations: "disabled",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    for (const name of [
      "Assets",
      "Batches",
      "History",
      "Review",
      "Overview",
      "Cut",
    ]) {
      await page
        .getByRole("navigation", { name: "Workspace sections" })
        .getByRole("button", { name, exact: true })
        .click();
      assert.ok(await strip.isVisible());
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "No horizontal page overflow.",
      );
    }
    await page.screenshot({
      path: "artifacts/studio-mobile-top-strip.png",
      animations: "disabled",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "Persistent top strip verified across all six desktop/mobile views; hierarchy browsing, shot selection and return from Assets passed.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
