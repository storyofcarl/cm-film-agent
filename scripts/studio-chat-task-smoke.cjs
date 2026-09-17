// Durable task API and browser lifecycle. A deliberately nonexistent context
// fails before routing/model selection, even if the scheduler ticks unexpectedly.
require("dotenv").config({ quiet: true });
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");
const { createServerClient } = require("@supabase/ssr");
const { chromium } = require("@playwright/test");
const cleanup = require("./studio-record-test-cleanup.cjs");
const base = process.env.STUDIO_TEST_URL || "http://localhost:43201";
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
async function main() {
  let user, browser;
  try {
    const password = crypto.randomBytes(24).toString("hex");
    const email = `studio-chat-test-${crypto.randomUUID()}@example.invalid`;
    const account = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { film_agent_access: true },
    });
    if (account.error) throw account.error;
    user = account.data.user;
    const jar = new Map();
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll: () => [...jar].map(([name, value]) => ({ name, value })),
          setAll: (values) =>
            values.forEach(({ name, value }) => jar.set(name, value)),
        },
      },
    );
    const signIn = await client.auth.signInWithPassword({ email, password });
    if (signIn.error) throw signIn.error;
    const call = async (endpoint, body, expected = 200) => {
      const response = await fetch(base + endpoint, {
        method: body ? "POST" : "GET",
        headers: {
          cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json();
      assert.equal(response.status, expected, result.error);
      return result;
    };
    let current = await call(
      "/api/studio/projects",
      {
        action: "create",
        project: {
          title: "Saved chat verification",
          scope: "scene",
          brief: "Nonbillable test",
        },
      },
      201,
    );
    const id = current.project.id;
    const input = {
      id,
      instruction: "Synthetic saved task. No provider may run.",
      method: "film.develop",
      contextId: "intentionally-missing-test-context",
    };
    current = await call("/api/studio/crew", {
      ...input,
      revision: current.revision,
    });
    const taskId = current.project.crewRuns[0].id;
    assert.equal(current.project.crewRuns[0].state, "queued");
    assert.equal(current.project.crewRuns[0].calls.length, 0);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1600, height: 1000 },
    });
    await context.addCookies(
      [...jar].map(([name, value]) => ({
        name,
        value,
        url: base,
        httpOnly: true,
        secure: base.startsWith("https:"),
      })),
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Keep this nonbillable task queued until the director presses Stop, proving
    // the poll protocol without a model. Other actions use the actual API/store.
    await page.route("**/api/studio/crew", async (route) => {
      if (route.request().postDataJSON()?.action === "advance")
        return route.fulfill({ json: current });
      return route.continue();
    });
    await page.goto(base);
    const chat = page.getByRole("region", { name: "Project chat" });
    await chat.getByText("Working · 0 steps saved.", { exact: true }).waitFor();
    await chat
      .getByRole("textbox", { name: "Message", exact: true })
      .fill("A second direction can be drafted while this task runs.");
    assert.equal(
      await chat.getByRole("button", { name: "Send", exact: true }).isEnabled(),
      true,
    );
    await page.reload();
    await chat.getByText("Working · 0 steps saved.", { exact: true }).waitFor();
    await chat.getByRole("button", { name: "Stop", exact: true }).click();
    await chat
      .getByText("Stopped. Completed work is retained.", { exact: true })
      .waitFor();
    current = await call(`/api/studio/projects?id=${id}`);
    assert.equal(current.project.crewRuns[0].state, "cancelled");
    await call("/api/studio/crew", { id, action: "advance", taskId });
    await call(
      "/api/studio/crew",
      { id, action: "advance", taskId: "foreign-task" },
      404,
    );
    current = await call("/api/studio/crew", {
      ...input,
      revision: current.revision,
    });
    const second = current.project.crewRuns.at(-1).id;
    current = await call("/api/studio/crew", {
      id,
      action: "advance",
      taskId: second,
    });
    assert.equal(current.project.crewRuns.at(-1).state, "attention");
    assert.equal(current.project.crewRuns.at(-1).calls.length, 0);
    assert.equal(current.project.batches.length, 0);
    await page.reload();
    await chat
      .getByText(current.project.crewRuns.at(-1).error, { exact: true })
      .waitFor();
    assert.deepEqual(errors, []);
    fs.mkdirSync("artifacts", { recursive: true });
    await page.screenshot({
      path: "artifacts/studio-chat-task.png",
      fullPage: true,
    });
    console.log(
      "Saved task API, reload persistence, available chat controls, Stop, ownership boundary and nonbillable failure state passed. No provider calls.",
    );
  } finally {
    if (browser) await browser.close();
    if (user) {
      await cleanup(admin, user.id);
      const result = await admin.auth.admin.deleteUser(user.id);
      if (result.error) throw result.error;
    }
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
