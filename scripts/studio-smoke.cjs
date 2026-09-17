// Real authenticated API/UI checks. No provider generation endpoints are called.
require("dotenv").config({ quiet: true });
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");
const { createServerClient } = require("@supabase/ssr");
const { chromium } = require("@playwright/test");
const base = process.env.STUDIO_TEST_URL || "http://127.0.0.1:43189";
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const users = [];
const objects = [];
const findings = [];
async function account(approved) {
  const email = `studio-test-${crypto.randomUUID()}@example.invalid`;
  const password = crypto.randomBytes(24).toString("hex");
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { film_agent_access: approved },
  });
  if (error) throw error;
  users.push(data.user.id);
  const jar = new Map();
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (cookies) =>
          cookies.forEach(({ name, value }) => jar.set(name, value)),
      },
    },
  );
  const signed = await client.auth.signInWithPassword({ email, password });
  if (signed.error) throw signed.error;
  return {
    id: data.user.id,
    client,
    jar,
    cookie: () =>
      [...jar].map(([name, value]) => `${name}=${value}`).join("; "),
  };
}
async function call(user, endpoint, body, expected = 200) {
  const response = await fetch(base + endpoint, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(user ? { cookie: user.cookie() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  assert.equal(
    response.status,
    expected,
    `${endpoint}: ${JSON.stringify(data).slice(0, 350)}`,
  );
  return data;
}
async function main() {
  let browser;
  try {
    await call(null, "/api/studio/projects", null, 401);
    const owner = await account(true);
    const other = await account(true);
    const unapproved = await account(false);
    await call(unapproved, "/api/studio/projects", null, 403);
    const id = "smoke_" + crypto.randomUUID();
    let current = await call(
      owner,
      "/api/studio/projects",
      {
        action: "create",
        project: {
          id,
          title: "Studio validation fixture",
          scope: "scene",
          brief: "Synthetic fixture. No billable provider calls.",
        },
      },
      201,
    );
    await call(other, `/api/studio/projects?id=${id}`, null, 404);
    const denied = await owner.client
      .from("studio_projects")
      .update({ title: "Bypass attempt" })
      .eq("id", id);
    assert.ok(denied.error);
    findings.push(
      "Authentication, invite access, owner isolation and direct-write denial passed.",
    );
    const sceneId = current.project.nodes.find(
      (node) => node.type === "scene",
    ).id;
    const command = async (type, payload) => {
      current = await call(owner, "/api/studio/projects", {
        action: "command",
        id,
        revision: current.revision,
        command: { type, payload },
      });
      return current;
    };
    await command("item.add", {
      kind: "shot",
      sceneId,
      title: "A complete action",
      prompt: "A gray card held still.",
      duration: 2,
    });
    await call(
      owner,
      "/api/studio/projects",
      {
        action: "command",
        id,
        revision: 1,
        command: { type: "project.update", payload: { title: "Stale edit" } },
      },
      409,
    );
    assert.equal(
      (await call(owner, `/api/studio/projects?id=${id}`)).project.title,
      "Studio validation fixture",
    );
    findings.push("Concurrent-save conflict preserved the current project.");
    const config = await call(owner, "/api/film/config");
    const video = config.catalog.find((model) => model.kind === "video");
    assert.ok(video);
    current = await call(owner, "/api/studio/batches", {
      action: "prepare",
      id,
      revision: current.revision,
      kind: "production",
      model: video.id,
    });
    const batchId = current.project.batches[0].id;
    await call(
      owner,
      "/api/studio/batches",
      { action: "run", id, revision: current.revision, batchId },
      400,
    );
    await call(
      owner,
      "/api/studio/projects",
      {
        action: "command",
        id,
        revision: current.revision,
        command: { type: "batch.approve", payload: { id: batchId } },
      },
      400,
    );
    const jobs = await admin
      .from("film_jobs")
      .select("id")
      .eq("owner_id", owner.id);
    assert.equal(jobs.data.length, 0);
    findings.push(
      "Unapproved and unpriced execution blocked before any provider job existed.",
    );
    const bytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4qoAAAAASUVORK5CYII=",
      "base64",
    );
    const key =
      crypto.createHash("sha256").update(bytes).digest("hex").slice(0, 32) +
      ".png";
    const ticket = await call(owner, "/api/film/upload", {
      action: "sign",
      key,
      contentType: "image/png",
      size: bytes.length,
    });
    assert.equal(ticket.path, `${owner.id}/studio/${key}`);
    objects.push(ticket.path);
    const uploaded = await owner.client.storage
      .from("film-media")
      .uploadToSignedUrl(ticket.path, ticket.token, bytes, {
        contentType: "image/png",
      });
    if (uploaded.error) throw uploaded.error;
    const media = await call(owner, "/api/film/upload", {
      action: "complete",
      key,
    });
    const itemId = current.project.shots[0].id;
    await command("version.add", {
      itemId,
      media: { url: media.url, type: "image" },
    });
    await command("version.review", {
      itemId,
      versionId: current.project.shots[0].selectedVersionId,
      review: "approved",
    });
    assert.equal(current.project.shots[0].versions[0].prompt, null);
    findings.push(
      "Studio upload namespace, version review and unknown imported provenance passed.",
    );
    const snapshots = await admin
      .from("studio_project_versions")
      .select("revision")
      .eq("project_id", id);
    assert.equal(snapshots.data.length, current.revision);
    findings.push("Every committed project revision has a retained snapshot.");
    const claimInput = {
      p_project: id,
      p_owner: owner.id,
      p_revision: current.revision,
      p_jobs: current.project.batches[0].jobs.map((job) => ({
        id: job.id,
        batchId,
        request: job.request,
      })),
    };
    const claims = await Promise.all([
      admin.rpc("studio_claim_jobs", claimInput),
      admin.rpc("studio_claim_jobs", claimInput),
    ]);
    assert.equal(
      claims.filter((result) => !result.error && result.data.length > 0).length,
      1,
    );
    assert.equal(
      claims.filter((result) => result.error?.message.includes("STUDIO_STALE"))
        .length,
      1,
    );
    current = await call(owner, `/api/studio/projects?id=${id}`);
    assert.equal(current.project.batches[0].jobs[0].state, "claimed");
    const duplicate = await admin.rpc("studio_claim_jobs", {
      ...claimInput,
      p_revision: current.revision,
    });
    assert.ifError(duplicate.error);
    assert.deepEqual(duplicate.data, []);
    findings.push(
      "Real atomic claim: one concurrent winner, stale loser, no duplicate claim or provider submission.",
    );
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1600, height: 1100 },
    });
    await context.addCookies(
      [...owner.jar].map(([name, value]) => ({
        name,
        value,
        url: base,
        sameSite: "Lax",
      })),
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page
      .getByRole("heading", { name: "Scene 01", exact: true })
      .waitFor();
    await page.getByRole("button", { name: /A complete action/ }).click();
    for (const review of ["revision", "approved"]) {
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().endsWith("/api/studio/projects") &&
            response.request().method() === "POST" &&
            response.request().postDataJSON()?.command?.type ===
              "version.review",
        ),
        page
          .getByRole("combobox", { name: "Approval status", exact: true })
          .selectOption(review),
      ]);
      await page.waitForFunction(
        (value) =>
          document.querySelector('[aria-label="Approval status"]').value ===
          value,
        review,
      );
    }
    await page
      .getByRole("button", { name: /Batches/ })
      .first()
      .click();
    await page
      .getByRole("heading", { name: /versions need attention/ })
      .waitFor();
    fs.mkdirSync("artifacts", { recursive: true });
    await page.screenshot({
      path: "artifacts/studio-authenticated-batches.png",
      fullPage: true,
    });
    await page.goto(base + "/demo");
    await page
      .getByRole("heading", { name: "The observatory", exact: true })
      .waitFor();
    await page.screenshot({
      path: "artifacts/studio-desktop.png",
      fullPage: true,
    });
    await page
      .locator(".project-nav")
      .getByRole("button", { name: "Act I · The signal", exact: true })
      .click();
    await page.getByRole("button", { name: "Edit act", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Title", { exact: true })
      .fill("Act I · Reviewed hierarchy");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await page
      .getByRole("button", { name: "Add sequence", exact: true })
      .click();
    await dialog
      .getByLabel("Title", { exact: true })
      .fill("Sequence · Test addition");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await page
      .getByRole("heading", { name: "Sequence · Test addition", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Edit act", exact: true }).click();
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    findings.push(
      "Hierarchy edits, nested creation and keyboard dialog dismissal passed.",
    );
    await page.getByRole("button", { name: "Assets 3", exact: true }).click();
    await page
      .getByRole("button", { name: "Edit asset intent", exact: true })
      .click();
    await dialog
      .getByRole("textbox", { name: "Design description", exact: true })
      .fill("A keeper in a blue field coat, distinctive silhouette.");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await dialog.waitFor({ state: "hidden" });
    assert.equal(
      await page
        .getByRole("textbox", { name: "Exact prompt", exact: true })
        .inputValue(),
      "Full silhouette, weathered field coat, purposeful posture.",
    );
    findings.push(
      "Asset intent editing preserves the recorded version prompt.",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole("navigation", { name: "Workspace sections" })
      .getByRole("button", { name: "Assets", exact: true })
      .click();
    await page.screenshot({
      path: "artifacts/studio-mobile-assets.png",
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "Mobile page must not overflow horizontally.",
    );
    assert.deepEqual(errors, []);
    findings.push(
      "Desktop and mobile browser navigation/review passed without runtime errors.",
    );
    fs.writeFileSync(
      path.join("artifacts", "studio-smoke-report.json"),
      JSON.stringify({ at: new Date().toISOString(), findings }, null, 2),
    );
    findings.forEach((finding) => console.log(finding));
  } finally {
    if (browser) await browser.close();
    if (objects.length) await admin.storage.from("film-media").remove(objects);
    for (const id of users) await admin.auth.admin.deleteUser(id);
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
