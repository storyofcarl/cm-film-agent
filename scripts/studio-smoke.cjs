// Real authenticated API/UI checks. No provider generation endpoints are called.
require("dotenv").config({ quiet: true });
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");
const { createServerClient } = require("@supabase/ssr");
const { chromium } = require("@playwright/test");
const removeStudioTestRecords = require("./studio-record-test-cleanup.cjs");
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
    const pilot = JSON.parse(
      fs.readFileSync(
        "docs/workflow/pilot/last-light-pilot.studio.json",
        "utf8",
      ),
    );
    const portablePrompt = "Synthetic portable direction. ".repeat(150);
    const contextStudyFixture = {
      mode: "indexed",
      coverage: [
        {
          recordId: "synthetic-record",
          required: true,
          totalParts: 2,
          readParts: [0, 1],
        },
      ],
      transcript: [
        {
          prompt: "Synthetic source request one. ".repeat(150),
          response: "Synthetic read request",
          usage: null,
        },
        {
          prompt: "Synthetic source request two. ".repeat(150),
          response: "Synthetic final response",
          usage: null,
        },
      ],
    };
    pilot.artifacts.push(
      {
        id: "portable-v3",
        documentId: "portable-root",
        documentArea: "scripts",
        code: "DOC-902",
        number: 3,
        revisesId: "portable-root",
        title: "Portable writing fixture",
        content: "Synthetic third draft.",
        prompt: portablePrompt,
        contextStudy: contextStudyFixture,
        review: "approved",
      },
      {
        id: "portable-root",
        documentId: "portable-root",
        documentArea: "scripts",
        code: "DOC-902",
        number: 1,
        title: "Portable writing fixture",
        content: "Synthetic first draft.",
        review: "approved",
      },
    );
    const invalidHistory = structuredClone(pilot);
    invalidHistory.artifacts.find(
      (entry) => entry.id === "portable-v3",
    ).number = 1;
    await call(
      owner,
      "/api/studio/projects",
      { action: "import", project: invalidHistory },
      400,
    );
    const importedPilot = await call(
      owner,
      "/api/studio/projects",
      { action: "import", project: pilot },
      201,
    );
    assert.equal(importedPilot.project.shots.length, 5);
    assert.equal(importedPilot.project.assets.length, 3);
    assert.equal(
      importedPilot.project.shots.reduce((sum, shot) => sum + shot.duration, 0),
      68,
    );
    assert.deepEqual(
      importedPilot.project.shots.map((shot) => shot.id),
      pilot.shots.map((shot) => shot.id),
    );
    assert.equal(importedPilot.project.batches.length, 0);
    assert.equal(importedPilot.project.sceneApprovals.length, 0);
    assert.equal(importedPilot.project.lookdev.length, 0);
    assert.equal(importedPilot.project.artifacts[0].review, "pending");
    const portableVersions = importedPilot.project.artifacts
      .filter((entry) => entry.code === "DOC-902")
      .sort((a, b) => a.number - b.number);
    assert.deepEqual(
      portableVersions.map((entry) => entry.number),
      [1, 3],
    );
    assert.equal(portableVersions[1].revisesId, portableVersions[0].id);
    assert.equal(portableVersions[1].suppliedMetadata.prompt, portablePrompt);
    assert.deepEqual(
      portableVersions[1].suppliedMetadata.contextStudy,
      contextStudyFixture,
    );
    await call(
      other,
      `/api/studio/projects?id=${importedPilot.project.id}`,
      null,
      404,
    );
    findings.push(
      "Proposed pilot imported with 68-second timing and stable shot IDs; no jobs, spend authorization or approvals were created.",
    );
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
    const sceneDirection = "Keep the camera locked off in this scene. ".repeat(
      60,
    );
    await command("node.update", {
      id: sceneId,
      prompt: sceneDirection,
      assetIds: [],
    });
    assert.equal(
      (await call(owner, `/api/studio/projects?id=${id}`)).project.nodes.find(
        (node) => node.id === sceneId,
      ).prompt,
      sceneDirection,
    );
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
    assert.ok(
      current.project.batches[0].jobs[0].request.prompt.includes(
        "Keep the camera locked off in this scene.",
      ),
    );
    assert.deepEqual(current.project.batches[0].jobs[0].request.references, []);
    findings.push(
      "Persistent container direction and explicit empty asset scope reach the compiled production request.",
    );
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
    for (const document of await require("./studio-upload-fixtures.cjs").documents()) {
      const documentKey =
        crypto
          .createHash("sha256")
          .update(document.bytes)
          .digest("hex")
          .slice(0, 32) +
        "." +
        document.ext;
      const documentTicket = await call(owner, "/api/film/upload", {
        action: "sign",
        key: documentKey,
        contentType: document.type,
        size: document.bytes.length,
      });
      objects.push(documentTicket.path);
      const stored = await owner.client.storage
        .from("film-media")
        .uploadToSignedUrl(
          documentTicket.path,
          documentTicket.token,
          document.bytes,
          { contentType: document.type },
        );
      if (stored.error) throw stored.error;
      current = await call(owner, "/api/studio/intake", {
        id,
        revision: current.revision,
        key: documentKey,
        name: `Supplied screenplay.${document.ext}`,
        area: document.ext === "docx" ? "documents" : "scripts",
      });
      const entry = current.project.inbox.at(-1);
      assert.equal(
        entry.area,
        document.ext === "docx" ? "documents" : "scripts",
      );
      assert.equal(entry.status, "ready", JSON.stringify(entry.warnings));
      assert.ok(
        current.project.artifacts
          .find((artifact) => artifact.id === entry.artifactId)
          .content.includes("The keeper receives a signal."),
      );
      const duplicate = await call(owner, "/api/studio/intake", {
        id,
        revision: current.revision,
        key: documentKey,
        name: "Repeated upload",
      });
      assert.equal(duplicate.duplicate, true);
      assert.equal(duplicate.revision, current.revision);
      await call(
        other,
        "/api/studio/intake",
        {
          id,
          revision: current.revision,
          key: documentKey,
          name: "Foreign work",
        },
        404,
      );
    }
    current = await call(owner, "/api/studio/intake", {
      id,
      revision: current.revision,
      key,
      name: "Supplied keeper.png",
    });
    const inboxImage = current.project.inbox.at(-1);
    assert.equal(inboxImage.status, "ready");
    assert.equal(inboxImage.area, "assets");
    await command("item.add", {
      kind: "asset",
      title: "Supplied keeper",
      assetType: "character",
    });
    const inboxTarget = current.project.assets.at(-1).id;
    await command("inbox.assign", {
      inboxId: inboxImage.id,
      targetId: inboxTarget,
    });
    assert.equal(current.project.assets.at(-1).versions[0].review, "pending");
    assert.equal(current.project.assets.at(-1).versions[0].prompt, null);
    findings.push(
      "Owned PDF, Word, Markdown and image inbox uploads passed; originals retained, duplicate intake is idempotent, and media assignments stay unapproved.",
    );
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
    if (process.env.STUDIO_RENDER_SMOKE === "1") {
      fs.mkdirSync("artifacts", { recursive: true });
      const fixture = path.resolve("artifacts", "studio-render-fixture.mp4");
      require("node:child_process").execFileSync(
        require("ffmpeg-static"),
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          "color=c=gray:s=320x180:r=24",
          "-t",
          "2",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          fixture,
        ],
        { stdio: "ignore", windowsHide: true },
      );
      const clip = fs.readFileSync(fixture);
      const clipKey =
        crypto.createHash("sha256").update(clip).digest("hex").slice(0, 32) +
        ".mp4";
      const clipTicket = await call(owner, "/api/film/upload", {
        action: "sign",
        key: clipKey,
        contentType: "video/mp4",
        size: clip.length,
      });
      objects.push(clipTicket.path);
      const upload = await owner.client.storage
        .from("film-media")
        .uploadToSignedUrl(clipTicket.path, clipTicket.token, clip, {
          contentType: "video/mp4",
        });
      assert.ifError(upload.error);
      const stored = await call(owner, "/api/film/upload", {
        action: "complete",
        key: clipKey,
      });
      await command("version.add", {
        itemId,
        media: { url: stored.url, type: "video" },
      });
      const clipVersion = current.project.shots[0].versions.at(-1).id;
      await command("version.select", { itemId, versionId: clipVersion });
      current = await call(owner, "/api/studio/delivery", {
        action: "review",
        id,
        sceneId,
      });
      const assembly = current.project.deliveries.at(-1);
      objects.push(`${owner.id}/studio/${assembly.media.key}`);
      assert.equal(assembly.purpose, "scene-review");
      assert.equal(assembly.media.width, 854);
      assert.ok(Math.abs(assembly.media.duration - 2) < 0.1);
      await command("version.review", {
        itemId,
        versionId: clipVersion,
        review: "approved",
      });
      await command("scene.approve", { sceneId });
      const delivery = await call(owner, "/api/studio/delivery", {
        action: "package",
        id,
        sceneId,
      });
      assert.equal(delivery.manifest.clips.length, 1);
      assert.equal(delivery.otio.OTIO_SCHEMA, "Timeline.1");
      findings.push(
        "Hosted synthetic video decoding, 2-second scene assembly and approved editorial/OTIO export passed without AI generation.",
      );
    }
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
    assert.equal(
      current.project.batches[0].jobs[0].request.prompt,
      claimInput.p_jobs[0].request.prompt,
    );
    const claimedDocument = await admin
      .from("studio_projects")
      .select("document")
      .eq("id", id)
      .single();
    assert.ifError(claimedDocument.error);
    assert.equal(
      typeof claimedDocument.data.document.batches[0].jobs[0].request.prompt
        .$studioText,
      "string",
    );
    const duplicate = await admin.rpc("studio_claim_jobs", {
      ...claimInput,
      p_revision: current.revision,
    });
    assert.ifError(duplicate.error);
    assert.deepEqual(duplicate.data, []);
    findings.push(
      "Real atomic claim: one concurrent winner, stale loser, no duplicate claim or provider submission.",
    );
    const inspectedFixtureVersion = current.project.shots[0].versions[0].id;
    await command("version.add", {
      itemId,
      media: { url: media.url, type: "image" },
    });
    const productionFixtureVersion =
      current.project.shots[0].versions.at(-1).id;
    await command("version.select", {
      itemId,
      versionId: productionFixtureVersion,
    });
    // Seed a synthetic chat/document result only in this disposable test project.
    // This checks its UI without invoking a writing model or production account.
    const writingFixtureText =
      "Synthetic writing fixture — no model called.\n".repeat(200);
    current.project.artifacts.push(
      {
        id: "writing_fixture_reply",
        instruction: "Synthetic writing request",
        content: "Synthetic writing draft saved.",
        prompt: "Recorded synthetic source prompt",
        systemPrompt: "Recorded synthetic method",
        contextStudy: contextStudyFixture,
        method: "film.develop",
        documentIds: ["writing_fixture_v1"],
      },
      {
        id: "writing_fixture_v1",
        documentId: "writing_fixture_v1",
        documentArea: "scripts",
        number: 1,
        title: "Mock screenplay",
        content: writingFixtureText,
        review: "pending",
        origin: "generated",
        sourceArtifactId: "writing_fixture_reply",
      },
    );
    const seededWriting = await admin
      .from("studio_projects")
      .update({ document: current.project, revision: current.revision + 1 })
      .eq("id", id)
      .eq("owner_id", owner.id)
      .eq("revision", current.revision)
      .select("id");
    assert.ifError(seededWriting.error);
    assert.equal(seededWriting.data.length, 1);
    current = await call(owner, `/api/studio/projects?id=${id}`);
    current = await call(owner, "/api/studio/batches", {
      action: "prepare",
      id,
      revision: current.revision,
      kind: "lookdev",
    });
    const reusedLookdevId = current.project.batches[0].id;
    assert.equal(current.project.batches[0].samples.length, 1);
    assert.equal(current.project.batches[0].jobs.length, 0);
    assert.equal(current.project.batches[0].estimate.total, 0);
    assert.equal(current.project.lookdev.length, 0);
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
    await page.getByRole("region", { name: "Project chat" }).waitFor();
    await page
      .getByRole("button", { name: /^Supplied work · 4 files/ })
      .click();
    const inboxDialog = page.getByRole("dialog", {
      name: "Supplied work inbox",
    });
    await inboxDialog
      .getByRole("heading", { name: /Supplied screenplay.pdf/ })
      .waitFor();
    assert.equal(
      await inboxDialog.getByRole("link", { name: "Open original" }).count(),
      4,
    );
    fs.mkdirSync("artifacts", { recursive: true });
    await page.screenshot({
      path: "artifacts/studio-upload-inbox.png",
      fullPage: true,
    });
    await inboxDialog
      .getByRole("button", { name: "Close", exact: true })
      .click();
    objects.push(
      `${owner.id}/studio/${crypto.createHash("sha256").update("Preserve the uploaded keeper. Develop only the missing setting.").digest("hex").slice(0, 32)}.md`,
    );
    await page.locator('input[type="file"][multiple]').setInputFiles([
      {
        name: "Director notes.md",
        mimeType: "text/markdown",
        buffer: Buffer.from(
          "Preserve the uploaded keeper. Develop only the missing setting.",
        ),
      },
      {
        name: "Unsupported.bin",
        mimeType: "application/octet-stream",
        buffer: Buffer.from("Unsupported fixture"),
      },
    ]);
    await page
      .getByRole("status")
      .filter({ hasText: "Processed 1 of 2 files" })
      .waitFor();
    await page
      .getByRole("button", { name: /^Supplied work · 5 files/ })
      .waitFor();
    await page.reload();
    await page
      .getByRole("button", { name: /^Supplied work · 5 files/ })
      .waitFor();
    findings.push(
      "Chat upload control, visible intake results, original-file links and inbox persistence across reload passed.",
    );
    await page
      .getByRole("region", { name: "Project strip", exact: true })
      .waitFor();
    await page
      .locator(".project-strip")
      .getByRole("button", { name: /A complete action/ })
      .click();
    await page
      .getByRole("combobox", { name: "Reviewing version", exact: true })
      .selectOption(inspectedFixtureVersion);
    // Intercept this request in the browser. It must never reach the paid chat API.
    let inspectedRequest;
    await page.route("**/api/studio/crew", async (route) => {
      inspectedRequest = route.request().postDataJSON();
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Chat transport checked without a model call.",
        }),
      });
    });
    const chat = page.getByRole("region", { name: "Project chat" });
    await chat
      .getByRole("textbox", { name: "Message", exact: true })
      .fill("Compare this older version with the production selection.");
    await chat.getByRole("button", { name: "Send", exact: true }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "Chat transport checked without a model call." })
      .waitFor();
    assert.equal(inspectedRequest.inspectingVersionId, inspectedFixtureVersion);
    assert.equal(inspectedRequest.contextId, itemId);
    const afterInspection = await call(owner, `/api/studio/projects?id=${id}`);
    assert.equal(
      afterInspection.project.shots[0].selectedVersionId,
      productionFixtureVersion,
    );
    await page.getByTitle("Scripts", { exact: true }).click();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/studio/crew") &&
          response.status() === 400,
      ),
      chat.getByRole("button", { name: "Send", exact: true }).click(),
    ]);
    assert.equal(inspectedRequest.activeFileArea, "scripts");
    assert.equal(inspectedRequest.inspectingVersionId, null);
    await chat
      .getByRole("button", { name: "Mock screenplay · V1", exact: true })
      .click();
    const generatedDocument = page.getByRole("article", {
      name: "Mock screenplay document",
      exact: true,
    });
    assert.equal(
      await generatedDocument
        .getByRole("textbox", { name: "Document text", exact: true })
        .inputValue(),
      writingFixtureText,
    );
    await generatedDocument
      .getByText("Source prompt and method", { exact: true })
      .click();
    assert.equal(
      await generatedDocument
        .getByRole("textbox", { name: "Document source prompt", exact: true })
        .inputValue(),
      "Recorded synthetic source prompt",
    );
    await generatedDocument
      .getByText("Source read history · 2 steps", { exact: true })
      .click();
    assert.equal(
      await generatedDocument
        .getByRole("textbox", { name: "Recorded source request", exact: true })
        .inputValue(),
      contextStudyFixture.transcript[0].prompt,
    );
    await generatedDocument
      .getByRole("combobox", { name: "Source read step" })
      .selectOption("1");
    assert.equal(
      await generatedDocument
        .getByRole("textbox", { name: "Recorded source request", exact: true })
        .inputValue(),
      contextStudyFixture.transcript[1].prompt,
    );
    assert.equal(
      await generatedDocument
        .getByRole("textbox", { name: "Recorded source response", exact: true })
        .inputValue(),
      contextStudyFixture.transcript[1].response,
    );
    await page.screenshot({
      path: "artifacts/studio-source-read-history.png",
      fullPage: true,
    });
    findings.push(
      "Source-read history preserves complete per-step requests/responses, switches steps in the document center, and survives portable import.",
    );
    const suppliedDocument = page.getByRole("article", {
      name: "Supplied screenplay.pdf document",
      exact: true,
    });
    await suppliedDocument
      .getByRole("link", { name: "Open original upload" })
      .waitFor();
    const originalText = await suppliedDocument
      .getByRole("textbox", { name: "Document text", exact: true })
      .inputValue();
    const originalDocumentId = await suppliedDocument
      .getByRole("combobox", { name: "Document version", exact: true })
      .inputValue();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/studio/projects") &&
          response.request().postDataJSON()?.command?.type ===
            "artifact.review",
      ),
      suppliedDocument
        .getByRole("combobox", { name: "Document approval", exact: true })
        .selectOption("approved"),
    ]);
    const editedText =
      originalText + "\nDirector revision: keep the station quiet.";
    await suppliedDocument
      .getByRole("textbox", { name: "Document text", exact: true })
      .fill(editedText);
    assert.equal(
      await suppliedDocument
        .getByRole("combobox", { name: "Document approval", exact: true })
        .isDisabled(),
      true,
    );
    await page.getByTitle("Audio", { exact: true }).click();
    await page.getByTitle("Scripts", { exact: true }).click();
    assert.equal(
      await suppliedDocument
        .getByRole("textbox", { name: "Document text", exact: true })
        .inputValue(),
      editedText,
    );
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/studio/crew") &&
          response.status() === 400,
      ),
      chat.getByRole("button", { name: "Send", exact: true }).click(),
    ]);
    assert.equal(inspectedRequest.inspectingDocumentId, originalDocumentId);
    assert.equal(inspectedRequest.inspectingDocumentDraft, editedText);
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/studio/projects") &&
          response.request().postDataJSON()?.command?.type ===
            "document.revise",
      ),
      suppliedDocument
        .getByRole("button", { name: "Save new version", exact: true })
        .click(),
    ]);
    await suppliedDocument
      .getByRole("button", { name: "Download V2", exact: true })
      .waitFor();
    const revisedDocumentId = await suppliedDocument
      .getByRole("combobox", { name: "Document version", exact: true })
      .inputValue();
    assert.equal(
      await suppliedDocument
        .getByRole("combobox", { name: "Document approval", exact: true })
        .inputValue(),
      "pending",
    );
    await suppliedDocument
      .getByRole("combobox", { name: "Document version", exact: true })
      .selectOption(originalDocumentId);
    assert.equal(
      await suppliedDocument
        .getByRole("textbox", { name: "Document text", exact: true })
        .inputValue(),
      originalText,
    );
    assert.equal(
      await suppliedDocument
        .getByRole("combobox", { name: "Document approval", exact: true })
        .inputValue(),
      "approved",
    );
    await page.reload();
    await chat.waitFor();
    await page.getByTitle("Scripts", { exact: true }).click();
    assert.equal(
      await suppliedDocument
        .getByRole("combobox", { name: "Document version", exact: true })
        .inputValue(),
      revisedDocumentId,
    );
    assert.equal(
      await suppliedDocument
        .getByRole("textbox", { name: "Document text", exact: true })
        .inputValue(),
      editedText,
    );
    await suppliedDocument
      .getByRole("link", { name: "Open original upload" })
      .waitFor();
    const savedWriting = await call(owner, `/api/studio/projects?id=${id}`);
    assert.equal(
      savedWriting.project.artifacts.find(
        (entry) => entry.id === originalDocumentId,
      ).review,
      "approved",
    );
    assert.equal(
      savedWriting.project.artifacts.find(
        (entry) => entry.id === revisedDocumentId,
      ).review,
      "pending",
    );
    await page.screenshot({
      path: "artifacts/studio-versioned-writing.png",
      fullPage: true,
    });
    findings.push(
      "Synthetic chat writing opens in Scripts with full text and source prompts; imported document edits survive navigation, chat receives unsaved edits, and V2 persists without changing approved V1 or its original upload.",
    );
    await page.unroute("**/api/studio/crew");
    await chat.getByRole("textbox", { name: "Message", exact: true }).fill("");
    await page.locator(".project-strip").getByRole("button", { name: /A complete action/ }).click();
    findings.push(
      "Intercepted chat requests carry the inspected version and file area without changing production selection or calling a model.",
    );
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
    const reusedLookdevCard = page.locator(".batch-card").filter({
      has: page.getByRole("heading", {
        name: "Studio validation fixture · lookdev",
        exact: true,
      }),
    });
    await reusedLookdevCard
      .getByRole("region", { name: "Existing lookdev versions" })
      .waitFor();
    assert.equal(
      await reusedLookdevCard
        .getByRole("button", { name: "Run approved jobs", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await reusedLookdevCard
        .getByRole("button", { name: "Record estimate", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await reusedLookdevCard
        .getByRole("textbox", {
          name: "Recorded prompt for Supplied keeper",
          exact: true,
        })
        .inputValue(),
      "Original prompt not recorded.",
    );
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/studio/projects") &&
          response.request().postDataJSON()?.command?.type ===
            "lookdev.approve",
      ),
      reusedLookdevCard
        .getByRole("button", { name: "Approve lookdev results", exact: true })
        .click(),
    ]);
    const afterLookdev = await call(owner, `/api/studio/projects?id=${id}`);
    assert.ok(
      afterLookdev.project.lookdev.some(
        (entry) =>
          entry.batchId === reusedLookdevId &&
          entry.scope === "assets" &&
          entry.review === "approved",
      ),
    );
    assert.equal(
      afterLookdev.project.assets.find((entry) => entry.id === inboxTarget)
        .versions[0].review,
      "pending",
    );
    assert.equal(
      afterLookdev.project.batches.find((entry) => entry.id === reusedLookdevId)
        .jobs.length,
      0,
    );
    await page.screenshot({
      path: "artifacts/studio-reused-lookdev.png",
      fullPage: true,
    });
    findings.push(
      "Existing asset lookdev reused the uploaded version with zero provider jobs, displayed unknown provenance honestly, required a human lookdev action, and retained separate pending asset approval.",
    );
    fs.mkdirSync("artifacts", { recursive: true });
    await page.screenshot({
      path: "artifacts/studio-authenticated-batches.png",
      fullPage: true,
    });
    await page.locator(".project-switch button").click();
    await page
      .getByRole("dialog", { name: "Your productions" })
      .getByRole("button", { name: pilot.title, exact: true })
      .click();
    await page
      .locator(".project-switch button")
      .filter({ hasText: pilot.title })
      .waitFor();
    await page.getByTitle("Scripts", { exact: true }).click();
    const portableCard = page.getByRole("article", {
      name: "Portable writing fixture document",
      exact: true,
    });
    await portableCard
      .getByRole("button", { name: "Download V3", exact: true })
      .waitFor();
    assert.equal(
      await portableCard.locator(".object-code").textContent(),
      "DOC-902",
    );
    assert.equal(
      await portableCard
        .getByRole("textbox", { name: "Document text", exact: true })
        .inputValue(),
      "Synthetic third draft.",
    );
    assert.equal(
      await portableCard
        .getByRole("combobox", { name: "Document approval", exact: true })
        .inputValue(),
      "pending",
    );
    await portableCard.getByText("Import history", { exact: true }).click();
    await portableCard
      .getByText("Source prompt and method", { exact: true })
      .click();
    assert.equal(
      await portableCard
        .getByRole("textbox", { name: "Document source prompt", exact: true })
        .inputValue(),
      portablePrompt,
    );
    assert.ok(
      (await portableCard.textContent()).includes("Approved (supplied status)"),
    );
    await portableCard
      .getByRole("combobox", { name: "Document version", exact: true })
      .selectOption(portableVersions[0].id);
    assert.equal(
      await portableCard
        .getByRole("textbox", { name: "Document text", exact: true })
        .inputValue(),
      "Synthetic first draft.",
    );
    await portableCard
      .getByRole("combobox", { name: "Document version", exact: true })
      .selectOption(portableVersions[1].id);
    findings.push(
      "Portable document import rejected duplicate numbering, preserved DOC-902 with V1/V3 and full prompts, and displayed supplied review history separately from current approval.",
    );
    await portableCard
      .getByText("Import history", { exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: "artifacts/studio-import-history.png",
      fullPage: true,
    });
    await page.goto(base + "/demo");
    await page
      .getByRole("region", { name: "Project strip", exact: true })
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
    const objectProperties = page.getByRole("region", {
      name: "Selected object properties",
    });
    assert.equal(await dialog.count(), 0);
    await objectProperties
      .getByLabel("Object title", { exact: true })
      .fill("Act I · Reviewed hierarchy");
    await objectProperties
      .getByRole("button", { name: "Save object properties" })
      .click();
    await objectProperties.getByRole("status").waitFor();
    await page
      .getByRole("button", { name: "Add sequence", exact: true })
      .click();
    await dialog
      .getByLabel("Title", { exact: true })
      .fill("Sequence · Test addition");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await page
      .getByRole("button", { name: /Sequence · Test addition/ })
      .waitFor();
    await page
      .getByRole("button", { name: "Add sequence", exact: true })
      .click();
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    findings.push(
      "Inline hierarchy edits, nested creation and keyboard dialog dismissal passed.",
    );
    await page.getByRole("button", { name: "Assets 3", exact: true }).click();
    await page.getByRole("button", { name: "The keeper", exact: true }).click();
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
    await page.getByTitle("Assets", { exact: true }).click();
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
      JSON.stringify({ at: new Date().toISOString(), base, findings }, null, 2),
    );
    findings.forEach((finding) => console.log(finding));
  } finally {
    if (browser) await browser.close();
    if (objects.length) await admin.storage.from("film-media").remove(objects);
    for (const id of users) {
      await removeStudioTestRecords(admin, id);
      await admin.auth.admin.deleteUser(id);
    }
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
