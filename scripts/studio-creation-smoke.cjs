// Manual creation in the illustrated demo; no saved account data or provider calls.
const assert = require("node:assert/strict");
const { chromium, expect } = require("@playwright/test");

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(
      (process.env.STUDIO_TEST_URL || "http://localhost:43201") + "/demo",
    );
    const strip = page.getByRole("region", {
      name: "Project strip",
      exact: true,
    });
    const dialog = page.getByRole("dialog");
    const add = async (kind, title) => {
      await page
        .getByRole("button", { name: `Add ${kind}`, exact: true })
        .click();
      await dialog.getByLabel("Title", { exact: true }).fill(title);
      await dialog
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      await expect(dialog).toHaveCount(0);
    };
    const open = (title) =>
      page
        .locator(".review-grid")
        .getByRole("button", { name: title, exact: true })
        .click();
    await page
      .locator(".project-nav")
      .getByRole("button", { name: "The Last Light", exact: true })
      .click();
    await add("act", "Empty act");
    await open("Empty act");
    await add("sequence", "Empty sequence");
    await open("Empty sequence");
    await add("scene", "Empty scene");
    await open("Empty scene");
    await expect(page.locator(".review-card")).toHaveCount(0);
    await page.getByRole("button", { name: "Add shot", exact: true }).click();
    const scene = dialog.getByLabel("Scene", { exact: true });
    const emptySceneId = await scene.inputValue();
    expect(emptySceneId).toBeTruthy();
    expect(await scene.locator("option:checked").textContent()).toContain(
      "Empty scene",
    );
    await dialog
      .getByLabel("Title", { exact: true })
      .fill("Manual destination check");
    await dialog
      .getByRole("textbox", { name: "Shot intent / prompt", exact: true })
      .fill("A deliberate new shot in the chosen scene.");
    await scene.selectOption("sc2");
    await dialog.getByLabel("Used duration (seconds)").fill("7");
    await dialog
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    const shot = strip.getByRole("button", {
      name: /Manual destination check/,
    });
    await expect(shot).toHaveAttribute("aria-pressed", "true");
    await expect(
      strip
        .locator('[data-range-id="sc2"]')
        .getByRole("button", { name: /Manual destination check/ }),
    ).toHaveCount(1);
    await expect(
      strip.locator(`[data-range-id="${emptySceneId}"]`),
    ).toHaveCount(0);
    await expect(strip.locator(".hierarchy-card")).toHaveCount(35);
    // Rollup grids are reached through their strip labels, not a single-shot grid toggle.
    await strip
      .locator('[data-range-id="sc2"]')
      .getByRole("button", { name: /^View scene/ })
      .click();
    await expect(
      page.getByRole("button", { name: "Add shot", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add act", exact: true }),
    ).toHaveCount(0);
    // Creating a project from another work area must open a root grid, not stale scope.
    await page.getByTitle("History", { exact: true }).click();
    await page.getByTitle("New project", { exact: true }).click();
    await dialog
      .getByLabel("Title", { exact: true })
      .fill("Fresh manual project");
    await dialog
      .getByRole("button", { name: "Create production", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(strip.locator("h1")).toHaveText("Fresh manual project");
    await add("act", "Correct root parent");
    await expect(
      page
        .locator(".review-grid")
        .getByRole("button", { name: "Correct root parent", exact: true }),
    ).toBeVisible();
    await strip
      .getByRole("button", { name: "Add a shot in an empty slot" })
      .first()
      .click();
    await expect(dialog.getByLabel("Scene", { exact: true })).toHaveValue("");
    assert.equal(
      await dialog
        .getByLabel("Scene", { exact: true })
        .evaluate((node) => node.checkValidity()),
      false,
    );
    await page.keyboard.press("Escape");
    await expect(strip.locator(".hierarchy-card")).toHaveCount(0);
    assert.deepEqual(errors, []);
    console.log(
      "Empty hierarchy navigation, explicit shot destination, creation focus, correct grid actions and clean new-project scope passed. No provider calls.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
