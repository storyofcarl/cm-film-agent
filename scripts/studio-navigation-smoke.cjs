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
    for (const [level, childType] of [
      ["Project", "act"],
      ["Act", "sequence"],
      ["Sequence", "scene"],
      ["Scene", "Shot"],
    ]) {
      await strip.getByRole("button", { name: level, exact: true }).click();
      assert.equal(
        await strip.locator(".strip-levels [aria-pressed=true]").textContent(),
        level,
      );
      assert.equal(
        await strip.locator(".hierarchy-card small").first().textContent(),
        childType,
      );
    }
    await strip.locator(".hierarchy-card").first().click();

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
    const right = await page.locator(".crew-sidebar").boundingBox();
    const centerStrip = await strip.boundingBox();
    assert.ok(centerStrip.x + centerStrip.width <= right.x + 1);
    assert.ok(right.y <= centerStrip.y);
    fs.mkdirSync("artifacts", { recursive: true });
    await page.screenshot({
      path: "artifacts/studio-chat-workspace.png",
      animations: "disabled",
      fullPage: true,
    });
    await page.getByRole("button", { name: /^Project status:/ }).click();
    const header = await page
      .getByRole("banner", { name: "Production header" })
      .boundingBox();
    assert.ok(header.y + header.height <= (await strip.boundingBox()).y + 1);
    assert.equal(
      await page
        .locator("main.workspace")
        .getByRole("button", { name: "Export project" })
        .count(),
      0,
    );
    assert.equal(
      await page.getByRole("button", { name: "Details", exact: true }).count(),
      0,
    );
    const status = page.getByRole("dialog", { name: "Production status" });
    await status
      .getByText("0 of 3 scenes approved for the current selected versions.", {
        exact: true,
      })
      .waitFor();
    await status.getByRole("button", { name: "Close", exact: true }).click();
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
    const level = await strip
      .locator(".strip-levels [aria-pressed=true]")
      .textContent();
    assert.equal(
      await strip.getByRole("navigation").count(),
      0,
      "Level switching does not use breadcrumbs.",
    );
    for (const name of [
      "Assets 3",
      /^Batches \d+$/,
      "History",
      "Review all shots",
      "Production overview",
      "Scene workspace",
    ]) {
      await page.getByRole("button", { name, exact: true }).click();
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
      assert.equal(
        await strip.locator(".strip-levels [aria-pressed=true]").textContent(),
        level,
      );
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
    await strip.getByRole("button", { name: "Project", exact: true }).click();
    const properties = page.getByRole("region", {
      name: "Selected object properties",
    });
    await properties
      .getByRole("heading", { name: "The Last Light", exact: true })
      .waitFor();
    for (const type of ["act", "sequence", "scene"]) {
      assert.equal(
        await strip.locator(".hierarchy-card small").first().textContent(),
        type,
      );
      await strip.locator(".hierarchy-card").first().click();
      assert.ok(
        (await properties.locator(".eyebrow").textContent()).includes(type),
      );
      assert.ok(
        await page
          .getByRole("heading", { name: "Assets", exact: true })
          .isVisible(),
        "Hierarchy browsing must not change the active view.",
      );
      if (type !== "scene") {
        await page
          .getByRole("button", { name: "Scene workspace", exact: true })
          .click();
        await page
          .getByRole("heading", { name: `${type} workspace`, exact: true })
          .waitFor();
        assert.equal(
          await page
            .getByRole("button", { name: "Approve scene", exact: true })
            .count(),
          0,
          "Container selection must not expose approval for a previously selected scene.",
        );
        await page
          .getByRole("button", { name: "Assets 3", exact: true })
          .click();
      }
    }
    await properties
      .getByRole("textbox", { name: "Object prompt / direction", exact: true })
      .fill("Cool dawn light; deliberate camera movement.");
    await properties
      .getByRole("button", { name: "Save object properties" })
      .click();
    await properties.getByRole("status").waitFor();
    await properties
      .getByRole("button", {
        name: "Expand Object prompt / direction",
        exact: true,
      })
      .click();
    const promptDialog = page.getByRole("dialog", {
      name: "Object prompt / direction",
      exact: true,
    });
    const longDirection = "Deliberate camera movement. ".repeat(150);
    await promptDialog
      .getByRole("textbox", { name: "Object prompt / direction expanded" })
      .fill(longDirection);
    await promptDialog
      .getByRole("button", { name: "Close", exact: true })
      .click();
    assert.equal(
      await properties
        .getByRole("textbox", {
          name: "Object prompt / direction",
          exact: true,
        })
        .inputValue(),
      longDirection,
    );
    await properties
      .getByRole("textbox", { name: "Object prompt / direction", exact: true })
      .fill("Cool dawn light; deliberate camera movement.");
    await page.getByRole("button", { name: "History", exact: true }).click();
    assert.equal(await page.locator(".manual-inspector").isVisible(), false);
    await page
      .getByRole("button", { name: "Scene workspace", exact: true })
      .click();
    assert.equal(
      await properties
        .getByRole("textbox", {
          name: "Object prompt / direction",
          exact: true,
        })
        .inputValue(),
      "Cool dawn light; deliberate camera movement.",
    );
    await page
      .getByRole("button", { name: "Scene workspace", exact: true })
      .click();
    await properties
      .getByRole("heading", { name: "The observatory", exact: true })
      .waitFor();
    await strip.locator(".hierarchy-card").nth(1).click();
    await properties
      .getByRole("heading", { name: "Crossing the ridge", exact: true })
      .waitFor();
    await properties.getByText("Inherited direction", { exact: true }).click();
    assert.ok(
      await properties
        .getByText("Cool dawn light; deliberate camera movement.", {
          exact: true,
        })
        .isVisible(),
    );
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
      "Left open/closed toggle, chat-only persistent right bar, central manual controls and direct strip-level switching passed desktop/mobile checks.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
