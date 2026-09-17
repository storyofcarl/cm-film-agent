const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium, expect } = require("@playwright/test");

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
    const phases = page.getByRole("region", { name: "Production phases" });
    await expect(phases.getByRole("checkbox")).toHaveCount(5);
    for (const label of [
      "Scripting",
      "Assets",
      "Previs",
      "Animation",
      "Delivery",
    ])
      await expect(
        phases.getByRole("checkbox", { name: `${label} approved` }),
      ).toBeDisabled();
    const sendBox = await page
      .getByRole("button", { name: "Send", exact: true })
      .boundingBox();
    const phasesBox = await phases.boundingBox();
    assert.ok(phasesBox.y > sendBox.y + sendBox.height);
    assert.ok(phasesBox.y + phasesBox.height <= 1000);
    const thumbs = strip.locator(".hierarchy-card");
    const allIds = await thumbs.evaluateAll((nodes) =>
      nodes.map((node) => node.dataset.shotId),
    );
    assert.equal(allIds.length, 6);
    assert.equal(await strip.getByRole("combobox").count(), 0);
    assert.equal(await strip.locator(".strip-down, .strip-up").count(), 0);
    assert.equal(await strip.locator(".strip-scene-range").count(), 3);
    assert.equal(await strip.locator(".strip-sequence-range").count(), 2);
    assert.equal(
      await page.locator(".review-card").count(),
      4,
      "Scene opens in grid view.",
    );
    const projectTitle = await strip.locator("h1").textContent();
    for (const [name, count] of [
      [/^View act /, 2],
      [/^View sequence .*A final transmission/, 2],
      [/^View scene .*The observatory/, 4],
    ]) {
      await strip.getByRole("button", { name }).click();
      assert.equal(await page.locator(".review-card").count(), count);
      assert.equal(await page.locator(".manual-inspector").isVisible(), false);
      assert.equal(await page.locator(".media-viewer").count(), 0);
      assert.equal(await strip.locator("h1").textContent(), projectTitle);
      assert.deepEqual(
        await thumbs.evaluateAll((nodes) =>
          nodes.map((node) => node.dataset.shotId),
        ),
        allIds,
      );
    }
    await page
      .getByRole("spinbutton", { name: "SH-001 runtime", exact: true })
      .fill("9");
    await page
      .getByRole("spinbutton", { name: "SH-002 runtime", exact: true })
      .fill("7");
    await page
      .getByRole("button", { name: "Save grid changes", exact: true })
      .click();
    assert.ok((await thumbs.first().textContent()).includes("9.0s"));
    assert.ok((await thumbs.nth(1).textContent()).includes("7.0s"));
    await page
      .getByRole("spinbutton", { name: "SH-001 runtime", exact: true })
      .fill("8");
    await page
      .getByRole("spinbutton", { name: "SH-002 runtime", exact: true })
      .fill("8");
    await page
      .getByRole("button", { name: "Save grid changes", exact: true })
      .click();
    fs.mkdirSync("artifacts", { recursive: true });
    await page.screenshot({
      path: "artifacts/studio-rollup-grid.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 1200, height: 1000 });
    const track = strip.locator(".shot-strip-track");
    const left = strip.getByRole("button", {
      name: "Pan shots left",
      exact: true,
    });
    const right = strip.getByRole("button", {
      name: "Pan shots right",
      exact: true,
    });
    assert.equal(
      await track.evaluate((node) => getComputedStyle(node).scrollbarWidth),
      "none",
    );
    await right.click();
    await page.waitForFunction(
      () => document.querySelector(".shot-strip-track").scrollLeft > 0,
    );
    await expect(left).toBeEnabled();
    await left.click();
    await page.waitForFunction(
      () => document.querySelector(".shot-strip-track").scrollLeft === 0,
    );
    const trackBounds = await track.boundingBox();
    await page.mouse.move(trackBounds.x + 50, trackBounds.y + 70);
    await page.mouse.wheel(0, 180);
    await page.waitForFunction(
      () => document.querySelector(".shot-strip-track").scrollLeft > 0,
    );
    const sticky = await strip
      .locator(".strip-range-label.act button")
      .first()
      .boundingBox();
    assert.ok(
      sticky.x >= trackBounds.x - 1,
      "Act label stays readable while panning inside its range.",
    );
    await page
      .locator(".project-nav")
      .getByRole("button", { name: /What we carry/ })
      .click();
    const lastScene = await strip
      .locator('[data-range-id="sc3"]')
      .boundingBox();
    assert.ok(
      lastScene.x >= trackBounds.x - 1 &&
        lastScene.x < trackBounds.x + trackBounds.width,
    );
    assert.deepEqual(
      await thumbs.evaluateAll((nodes) =>
        nodes.map((node) => node.dataset.shotId),
      ),
      allIds,
    );
    await page.setViewportSize({ width: 1600, height: 1000 });
    await thumbs.first().click();
    const media = await page.locator(".media-viewer").boundingBox();
    const details = await page
      .getByRole("region", { name: "Manual object controls" })
      .boundingBox();
    assert.ok(
      details.y >= media.y + media.height,
      "Shot controls sit below the viewer.",
    );
    assert.ok(
      Math.abs(details.x - media.x) <= 1,
      "Shot controls share the viewer column.",
    );
    assert.equal(await page.locator(".project-content > aside").count(), 0);
    assert.ok(
      (await strip.locator(".hierarchy-card").first().boundingBox()).width <=
        114,
    );
    assert.equal(
      await strip.locator(".hierarchy-card h3, .hierarchy-card p").count(),
      0,
    );
    const chat = page.getByRole("region", { name: "Project chat" });
    assert.equal(
      await chat.locator(".crew-context").count(),
      0,
      "Chat must not display a single-object directing banner.",
    );
    await chat
      .getByRole("textbox", { name: "Message", exact: true })
      .fill("Keep this direction while I inspect the production.");
    assert.ok(await chat.isVisible());
    assert.ok(
      await page.locator("main.workspace").isVisible(),
      "The project remains visible while directing the crew.",
    );
    const normalChat = await page.locator(".crew-sidebar").boundingBox();
    const normalWorkspace = await page.locator("main.workspace").boundingBox();
    assert.ok(
      normalWorkspace.width > normalChat.width,
      "The work area is larger than the default chat dock.",
    );
    await page
      .getByRole("button", { name: "Close left bar", exact: true })
      .click();
    assert.ok((await page.locator(".project-nav").boundingBox()).width <= 64);
    assert.ok(await page.getByTitle("Assets", { exact: true }).isVisible());
    assert.ok(await chat.isVisible());
    await page.screenshot({
      path: "artifacts/studio-closed-left-bar.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Open left bar", exact: true })
      .click();
    await chat
      .getByRole("button", { name: "Collapse chat", exact: true })
      .click();
    assert.equal(await chat.isVisible(), false);
    assert.ok(
      await page
        .getByRole("complementary", { name: "Chat sidebar" })
        .isVisible(),
      "The chat rail stays on screen when collapsed.",
    );
    assert.ok((await page.locator(".crew-sidebar").boundingBox()).width <= 56);
    assert.ok(await page.locator("main.workspace").isVisible());
    await page
      .getByRole("button", { name: "Expand chat", exact: true })
      .click();
    assert.equal(
      await chat
        .getByRole("textbox", { name: "Message", exact: true })
        .inputValue(),
      "Keep this direction while I inspect the production.",
    );
    assert.equal(
      await page.locator(".crew-sidebar .inspector-object").count(),
      0,
      "Manual controls must not live in chat.",
    );
    const chatRight = await page.locator(".crew-sidebar").boundingBox();
    const centerStrip = await strip.boundingBox();
    assert.ok(centerStrip.x + centerStrip.width <= chatRight.x + 1);
    assert.ok(chatRight.y <= centerStrip.y);
    fs.mkdirSync("artifacts", { recursive: true });
    await page.screenshot({
      path: "artifacts/studio-chat-workspace.png",
      animations: "disabled",
      fullPage: true,
    });
    assert.equal(await page.locator(".production-header").count(), 0);
    assert.equal(
      await page
        .getByRole("button", { name: "Scene workspace", exact: true })
        .count(),
      0,
    );
    assert.ok(
      (await strip.boundingBox()).height <= 230,
      "Scope and thumbnails form one compact module.",
    );
    assert.ok(
      await page
        .getByRole("complementary", { name: "Project navigation" })
        .getByRole("button", { name: "Export project", exact: true })
        .isVisible(),
    );
    assert.equal(
      await strip
        .getByRole("button", { name: "Export project", exact: true })
        .count(),
      0,
    );
    await strip.getByRole("button", { name: /^Project status:/ }).click();
    const status = page.getByRole("dialog", {
      name: "Production status",
    });
    await status
      .getByText("0 of 3 scenes approved for the current selected versions.", {
        exact: true,
      })
      .waitFor();
    await status.getByRole("button", { name: "Close", exact: true }).click();
    await strip.screenshot({ path: "artifacts/studio-strip-module.png" });
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
      .locator('.hierarchy-card[aria-pressed="true"]')
      .textContent();
    const level = await strip.getAttribute("data-scope");
    assert.equal(
      await strip.getByRole("navigation").count(),
      0,
      "Level switching does not use breadcrumbs.",
    );
    for (const name of [
      "Assets 3",
      /^Batches \d+$/,
      "History",
      "Production overview",
      "Shot view",
      "Shot grid",
    ]) {
      if (name === "Shot view")
        await strip.locator(".hierarchy-card[aria-pressed=true]").click();
      else await page.getByRole("button", { name, exact: true }).click();
      if (name === "Shot grid")
        assert.equal(
          await page.locator(".review-card").count(),
          4,
          "Shot grid follows the scene scope.",
        );
      assert.ok(
        await chat.isVisible(),
        "Crew chat remains visible beside manual views.",
      );
      const chatBounds = await chat.boundingBox();
      const sendBounds = await chat
        .getByRole("button", { name: "Send", exact: true })
        .boundingBox();
      assert.ok(
        sendBounds.y + sendBounds.height <= chatBounds.y + chatBounds.height,
        "Chat send control must not be clipped by the properties panel.",
      );
      assert.equal(
        await chat
          .getByRole("textbox", { name: "Message", exact: true })
          .inputValue(),
        "Keep this direction while I inspect the production.",
      );
      assert.equal(await strip.count(), 1);
      assert.ok(await strip.isVisible());
      assert.equal(await strip.getAttribute("data-scope"), level);
      assert.equal(
        await strip
          .locator('.hierarchy-card[aria-pressed="true"]')
          .textContent(),
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
    await strip.locator(".hierarchy-card").first().click();
    fs.mkdirSync("artifacts", { recursive: true });
    await page.locator(".inspector-object").evaluate((element) => {
      element.scrollTop = 0;
    });
    await page.screenshot({
      path: "artifacts/studio-desktop.png",
      animations: "disabled",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Assets 3", exact: true }).click();
    await page
      .locator(".generation-inline")
      .getByText(
        "This demo version is an illustrated storyboard. No video segment was generated.",
        { exact: true },
      )
      .waitFor();
    await page.screenshot({
      path: "artifacts/studio-assets-top-strip.png",
      animations: "disabled",
      fullPage: true,
    });
    await strip.locator(".hierarchy-card").nth(2).click();
    const versionPicker = page.getByRole("combobox", {
      name: "Reviewing version",
      exact: true,
    });
    const firstPrompt = await page
      .getByRole("textbox", { name: "Exact prompt", exact: true })
      .inputValue();
    await versionPicker.selectOption("sh3v2");
    assert.notEqual(
      await page
        .getByRole("textbox", { name: "Exact prompt", exact: true })
        .inputValue(),
      firstPrompt,
    );
    assert.ok(
      (await page.locator(".viewer-caption").textContent()).includes("V2"),
    );
    assert.equal(
      await page
        .getByRole("combobox", { name: "Approval status", exact: true })
        .inputValue(),
      "pending",
    );
    await versionPicker.selectOption("sh3v1");
    assert.equal(
      await page
        .getByRole("textbox", { name: "Exact prompt", exact: true })
        .inputValue(),
      firstPrompt,
    );
    assert.equal(
      await page
        .getByRole("combobox", { name: "Approval status", exact: true })
        .inputValue(),
      "revision",
    );
    assert.ok(
      await page
        .getByRole("region", { name: "Recorded references" })
        .isVisible(),
    );
    for (const name of ["Footage", "Scripts", "Production docs", "Audio"]) {
      await page.getByTitle(name, { exact: true }).click();
      assert.ok(
        await page
          .getByRole("button", { name: "Upload to " + name, exact: true })
          .isVisible(),
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const name of [
      "Assets",
      "Batches",
      "History",
      "Production overview",
      "Footage",
    ]) {
      await page.getByTitle(name, { exact: true }).click();
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
      "Continuous shot strip, phase checklist, bulk grids, persistent chat, inline versions and desktop/mobile navigation passed.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
