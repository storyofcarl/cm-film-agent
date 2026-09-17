// Disposable authenticated large-project verification. No model calls or media generation.
require("dotenv").config({ quiet: true });
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");
const { createServerClient } = require("@supabase/ssr");
const { chromium } = require("@playwright/test");
const base = process.env.STUDIO_TEST_URL || "http://localhost:43201";
const filmScale = process.env.STUDIO_FILM_SCALE === "1";
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const users = [];
async function account() {
  const password = crypto.randomBytes(24).toString("hex");
  const email = `studio-scale-${crypto.randomUUID()}@example.invalid`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { film_agent_access: true },
  });
  assert.ifError(created.error);
  users.push(created.data.user.id);
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
  assert.ifError(
    (await client.auth.signInWithPassword({ email, password })).error,
  );
  return {
    id: created.data.user.id,
    jar,
    client,
    cookie: () => [...jar].map(([key, value]) => `${key}=${value}`).join("; "),
  };
}
async function decode(data) {
  if (!data.$studioTransfer) return data;
  const { parts, bytes, sha256 } = data.$studioTransfer;
  const buffers = [];
  for (const part of parts) {
    assert.equal(
      new URL(part.url).origin,
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin,
    );
    const response = await fetch(part.url);
    assert.equal(response.status, 200);
    const buffer = Buffer.from(await response.arrayBuffer());
    assert.equal(buffer.length, part.bytes);
    assert.equal(
      crypto.createHash("sha256").update(buffer).digest("hex"),
      part.sha256,
    );
    buffers.push(buffer);
  }
  const value = Buffer.concat(buffers);
  assert.equal(value.length, bytes);
  assert.equal(crypto.createHash("sha256").update(value).digest("hex"), sha256);
  return JSON.parse(value.toString("utf8"));
}
async function call(user, body, expected = 200, id = null) {
  const response = await fetch(
    base + "/api/studio/projects" + (id ? `?id=${id}` : ""),
    {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", cookie: user.cookie() },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  const raw = await response.json();
  assert.equal(
    response.status,
    expected,
    raw.error || "Project request status",
  );
  return { raw, data: await decode(raw) };
}
async function removeOwnRecords(owner) {
  async function files(prefix) {
    const result = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await admin.storage
        .from("studio-records")
        .list(prefix, { limit: 1000, offset });
      assert.ifError(error);
      for (const entry of data) {
        const path = `${prefix}/${entry.name}`;
        assert.ok(path.startsWith(owner + "/"));
        if (entry.id) result.push(path);
        else result.push(...(await files(path)));
      }
      if (data.length < 1000) return result;
    }
  }
  const paths = await files(owner);
  for (let index = 0; index < paths.length; index += 100)
    assert.ifError(
      (
        await admin.storage
          .from("studio-records")
          .remove(paths.slice(index, index + 100))
      ).error,
    );
}
async function main() {
  let browser;
  const started = Date.now();
  try {
    const owner = await account();
    const other = await account();
    const created = (
      await call(
        owner,
        {
          action: "create",
          project: { title: "Large history fixture", scope: "film" },
        },
        201,
      )
    ).data;
    const manifest = structuredClone(created.project);
    const common =
      "INT. OBSERVATORY - NIGHT\nThe keeper studies the complete signal.\n".repeat(
        5700,
      );
    manifest.artifacts = Array.from({ length: 40 }, (_, index) => ({
      id: `draft-${index + 1}`,
      documentId: "draft-1",
      documentArea: "scripts",
      code: "DOC-041",
      number: index + 1,
      revisesId: index ? `draft-${index}` : null,
      title: "Feature screenplay history",
      content: `DRAFT ${index + 1}\n${common}END DRAFT ${index + 1}`,
      prompt: "Complete source prompt. ".repeat(250),
      review: index === 39 ? "approved" : "pending",
    }));
    if (filmScale) {
      manifest.nodes = [];
      manifest.shots = [];
      for (let act = 0; act < 3; act++) {
        const actId = `scale-act-${act}`;
        manifest.nodes.push({
          id: actId,
          type: "act",
          parentId: null,
          title: `Act ${act + 1}`,
          order: act,
        });
        for (let sequence = 0; sequence < 4; sequence++) {
          const sequenceId = `${actId}-sequence-${sequence}`;
          manifest.nodes.push({
            id: sequenceId,
            type: "sequence",
            parentId: actId,
            title: `Sequence ${sequence + 1}`,
            order: sequence,
          });
          for (let scene = 0; scene < 5; scene++) {
            const sceneId = `${sequenceId}-scene-${scene}`;
            manifest.nodes.push({
              id: sceneId,
              type: "scene",
              parentId: sequenceId,
              title: `Scene ${manifest.nodes.filter((node) => node.type === "scene").length + 1}`,
              order: scene,
            });
            const prompt =
              `Scene ${sceneId}.\n` +
              "Preserve screen direction, geography, natural light and exact dialogue 🎬.\n".repeat(
                54,
              );
            for (let shot = 0; shot < 20; shot++) {
              const number = manifest.shots.length + 1;
              const id = `scale-shot-${number}`;
              manifest.shots.push({
                id,
                code: `SH-${String(number).padStart(4, "0")}`,
                kind: "shot",
                title: `Scale shot ${number}`,
                sceneId,
                order: shot,
                duration: 6,
                prompt,
                assetIds: [],
                versions: Array.from({ length: 4 }, (_, version) => ({
                  id: `${id}-v${version + 1}`,
                  number: version + 1,
                  prompt: `${prompt}Take ${version + 1}.`,
                  seed: number * 10 + version,
                  review: "pending",
                  media: null,
                  origin: "fixture",
                })),
              });
            }
          }
        }
      }
    }
    const source = Buffer.from(JSON.stringify(manifest));
    assert.ok(source.length > 12 * 1024 * 1024);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1600, height: 1000 },
    });
    await context.addCookies(
      [...owner.jar].map(([name, value]) => ({
        name,
        value,
        domain: new URL(base).hostname,
        path: "/",
        httpOnly: false,
        secure: base.startsWith("https:"),
        sameSite: "Lax",
      })),
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page
      .getByRole("button", { name: "Export project", exact: true })
      .waitFor();
    const importedResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/studio/projects") &&
        response.request().method() === "POST" &&
        response.request().postDataJSON()?.action === "import",
      { timeout: 180000 },
    );
    await page
      .locator('input[type="file"][accept^="application/json"]')
      .setInputFiles({
        name: "feature.studio.json",
        mimeType: "application/json",
        buffer: source,
      });
    const response = await importedResponse;
    assert.equal(response.status(), 201);
    const raw = await response.json();
    assert.ok(raw.$studioTransfer);
    assert.ok(JSON.stringify(raw).length < 50000);
    const imported = await decode(raw);
    const projectId = imported.project.id;
    if (filmScale) {
      assert.equal(imported.project.shots.length, 1200);
      assert.equal(
        imported.project.shots.reduce((sum, shot) => sum + shot.duration, 0),
        7200,
      );
      assert.equal(
        imported.project.nodes.filter((node) => node.type === "scene").length,
        60,
      );
      assert.deepEqual(
        imported.project.shots.map((shot) =>
          shot.versions.map((version) => ({
            prompt: version.prompt,
            seed: version.seed,
          })),
        ),
        manifest.shots.map((shot) =>
          shot.versions.map((version) => ({
            prompt: version.prompt,
            seed: version.seed,
          })),
        ),
      );
      await page
        .locator(".project-strip h1")
        .filter({ hasText: manifest.title })
        .waitFor({ timeout: 180000 });
      await page.waitForFunction(
        () =>
          document.querySelectorAll(".project-strip .hierarchy-card").length ===
          1200,
        null,
        { timeout: 180000 },
      );
      assert.equal(
        await page.locator(".project-strip .hierarchy-card").count(),
        1200,
      );
      await page.locator(".project-strip .hierarchy-card").last().click();
      assert.equal(
        await page
          .getByRole("combobox", { name: "Reviewing version", exact: true })
          .locator("option")
          .count(),
        4,
      );
    }
    assert.equal(
      imported.project.artifacts.filter((entry) => entry.code === "DOC-041")
        .length,
      40,
    );
    await page.getByTitle("Scripts", { exact: true }).click();
    const card = page.getByRole("article", {
      name: "Feature screenplay history document",
      exact: true,
    });
    await card
      .getByRole("combobox", { name: "Document version" })
      .waitFor({ timeout: 180000 });
    assert.equal(
      await card
        .getByRole("textbox", { name: "Document text", exact: true })
        .inputValue(),
      manifest.artifacts[39].content,
    );
    const originalVersion = imported.project.artifacts.find(
      (entry) => entry.code === "DOC-041" && entry.number === 1,
    );
    await card
      .getByRole("combobox", { name: "Document version" })
      .selectOption(originalVersion.id);
    assert.equal(
      await card
        .getByRole("textbox", { name: "Document text", exact: true })
        .inputValue(),
      manifest.artifacts[0].content,
    );
    await call(other, null, 404, projectId);
    const stored = await admin
      .from("studio_projects")
      .select("document,revision")
      .eq("id", projectId)
      .single();
    assert.ifError(stored.error);
    const textReference = stored.data.document.artifacts.find(
      (entry) => entry.code === "DOC-041",
    ).content;
    assert.equal(typeof textReference.$studioText, "string");
    assert.ok(
      JSON.stringify(stored.data.document).length <
        (filmScale ? 5 * 1024 * 1024 : 200000),
    );
    const recordPath = `${owner.id}/${projectId}/text/${textReference.$studioText}.json`;
    assert.ok(
      (await owner.client.storage.from("studio-records").download(recordPath))
        .error,
      "Even the owner cannot bypass the server to read private records.",
    );
    assert.ok(
      (
        await owner.client.storage
          .from("studio-records")
          .upload(recordPath, Buffer.from("forged"), {
            contentType: "application/json",
            upsert: true,
          })
      ).error,
      "Direct overwrites are denied.",
    );
    const revised = (
      await call(owner, {
        action: "command",
        id: projectId,
        revision: imported.revision,
        command: {
          type: "document.revise",
          payload: {
            id: originalVersion.id,
            content: "New manual draft, with history preserved.",
          },
        },
      })
    ).data;
    assert.ok(revised.revision > imported.revision);
    const reloaded = (await call(owner, null, 200, projectId)).data;
    assert.equal(
      reloaded.project.artifacts.find(
        (entry) => entry.id === originalVersion.id,
      ).content,
      manifest.artifacts[0].content,
    );
    assert.equal(
      reloaded.project.artifacts.filter((entry) => entry.code === "DOC-041")
        .length,
      41,
    );
    await call(
      owner,
      {
        action: "command",
        id: projectId,
        revision: imported.revision,
        command: {
          type: "project.update",
          payload: { title: "Stale overwrite" },
        },
      },
      409,
    );
    const snapshot = await admin
      .from("studio_project_versions")
      .select("document")
      .eq("project_id", projectId)
      .eq("revision", imported.revision)
      .single();
    assert.ifError(snapshot.error);
    assert.deepEqual(
      snapshot.data.document.artifacts.find(
        (entry) => entry.id === originalVersion.id,
      ).content,
      textReference,
    );
    assert.equal(
      snapshot.data.document.artifacts.filter(
        (entry) => entry.code === "DOC-041",
      ).length,
      40,
    );
    await page.reload();
    await page.getByTitle("Scripts", { exact: true }).click();
    await card
      .getByRole("combobox", { name: "Document version" })
      .waitFor({ timeout: 180000 });
    assert.equal(
      await card
        .getByRole("combobox", { name: "Document version" })
        .locator("option")
        .count(),
      41,
    );
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export project", exact: true })
      .click();
    const exported = JSON.parse(
      fs.readFileSync(await (await download).path(), "utf8"),
    );
    if (filmScale) assert.deepEqual(exported.shots, reloaded.project.shots);
    assert.equal(
      exported.artifacts.find((entry) => entry.id === originalVersion.id)
        .content,
      manifest.artifacts[0].content,
    );
    assert.equal(
      exported.artifacts.find((entry) => entry.id === originalVersion.id)
        .content.$studioText,
      undefined,
    );
    assert.deepEqual(errors, []);
    fs.mkdirSync("artifacts", { recursive: true });
    await page.screenshot({
      path: "artifacts/studio-large-project.png",
      fullPage: true,
    });
    fs.writeFileSync(
      "artifacts/studio-large-project-report.json",
      JSON.stringify(
        {
          at: new Date().toISOString(),
          base,
          filmScale,
          sourceBytes: source.length,
          storedIndexBytes: Buffer.byteLength(
            JSON.stringify(stored.data.document),
          ),
          shots: manifest.shots.length,
          shotVersions: manifest.shots.reduce(
            (sum, shot) => sum + shot.versions.length,
            0,
          ),
          scriptVersions: 40,
          appendedScriptVersions: 1,
          plannedSeconds: manifest.shots.reduce(
            (sum, shot) => sum + shot.duration,
            0,
          ),
          elapsedSeconds: Math.round((Date.now() - started) / 1000),
          providerCalls: 0,
        },
        null,
        2,
      ),
    );
    console.log(
      `Large-project verification passed: ${source.length} bytes, ${manifest.shots.length} shots, ${manifest.shots.reduce((sum, shot) => sum + shot.versions.length, 0)} shot versions, 40 original script versions, browser multipart import/download/export, exact text, private immutable records, revision 41 appended, retained snapshots, owner isolation and stale-write protection. No paid calls.`,
    );
  } finally {
    if (browser) await browser.close();
    for (const id of users) {
      await removeOwnRecords(id);
      await admin.auth.admin.deleteUser(id);
    }
  }
}
main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
