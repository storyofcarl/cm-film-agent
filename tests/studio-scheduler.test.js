/** @jest-environment node */
import { createMocks } from "node-mocks-http";
import reconcile from "../apps/studio/pages/api/jobs/reconcile";
import { createAdminSupabase } from "../utils/server/supabase";
import { reconcileBatch, runBatch } from "../apps/studio/lib/server/execute";
import { createProject, batchFingerprint } from "../apps/studio/lib/domain";
jest.mock("../utils/server/supabase", () => ({
  createAdminSupabase: jest.fn(),
}));
jest.mock("../utils/server/withAuth", () => ({
  isApprovedUser: (user) => user?.app_metadata?.film_agent_access === true,
}));
jest.mock("../apps/studio/lib/server/execute", () => ({
  reconcileBatch: jest.fn(),
  runBatch: jest.fn(),
}));
let rows;
let now;
const batch = (id, blocked = false) => {
  const result = {
    id,
    kind: "production",
    state: "approved",
    estimate: { total: 1 },
    jobs: [
      {
        id: id + "_job",
        state: "planned",
        request: { type: "video", model: "video", prompt: "Complete action" },
        preflightErrors: blocked ? ["Review required input."] : [],
      },
    ],
  };
  result.approval = { fingerprint: batchFingerprint(result) };
  return result;
};
beforeEach(() => {
  jest.clearAllMocks();
  process.env.CRON_SECRET = "scheduler-test-secret";
  now = jest.spyOn(Date, "now").mockReturnValue(0);
  rows = [];
  createAdminSupabase.mockReturnValue({
    from: () => {
      const query = {
        select: (_fields, options) =>
          options?.head
            ? Promise.resolve({ count: rows.length, error: null })
            : query,
        order: () => query,
        range: async (first, last) => ({
          data: rows.slice(first, last + 1),
          error: null,
        }),
      };
      return query;
    },
    auth: {
      admin: {
        getUserById: async () => ({
          data: {
            user: { id: "owner", app_metadata: { film_agent_access: true } },
          },
        }),
      },
    },
  });
  const loaded = async (id) => ({
    project: rows.find((row) => row.id === id).document,
    revision: 1,
  });
  reconcileBatch.mockImplementation(loaded);
  runBatch.mockImplementation(loaded);
});
afterEach(() => {
  now.mockRestore();
  delete process.env.CRON_SECRET;
});
async function tick(minute, authorized = true) {
  now.mockReturnValue(minute * 60000);
  const { req, res } = createMocks({
    method: "POST",
    headers: authorized
      ? { authorization: "Bearer scheduler-test-secret" }
      : {},
  });
  await reconcile(req, res);
  return res;
}
test("scheduler rejects missing automation authentication before reading projects", async () => {
  expect((await tick(0, false))._getStatusCode()).toBe(401);
  expect(createAdminSupabase).not.toHaveBeenCalled();
});
test("bounded scans reach productions beyond the first fifty", async () => {
  rows = Array.from({ length: 120 }, (_, index) => {
    const project = createProject({
      id: "project_" + String(index).padStart(3, "0"),
    });
    project.batches = [batch("batch_" + index, true)];
    return { id: project.id, owner_id: "owner", document: project };
  });
  for (let minute = 0; minute < 3; minute++)
    expect((await tick(minute))._getStatusCode()).toBe(200);
  expect(new Set(reconcileBatch.mock.calls.map(([id]) => id)).size).toBe(120);
  expect(runBatch).not.toHaveBeenCalled();
});
test("blocked early batches cannot starve a later approved batch", async () => {
  const project = createProject({ id: "project" });
  project.batches = [
    batch("blocked_a", true),
    batch("blocked_b", true),
    batch("ready"),
  ];
  rows = [{ id: project.id, owner_id: "owner", document: project }];
  await tick(0);
  expect(runBatch).not.toHaveBeenCalled();
  await tick(1);
  expect(runBatch).toHaveBeenCalledTimes(1);
  expect(runBatch).toHaveBeenCalledWith(project.id, "ready");
});
test("paused batches still recover results without releasing new paid jobs", async () => {
  const project = createProject({ id: "project" });
  project.batches = [{ ...batch("paused"), paused: true }];
  rows = [{ id: project.id, owner_id: "owner", document: project }];
  await tick(0);
  expect(reconcileBatch).toHaveBeenCalledWith(project.id, "paused");
  expect(runBatch).not.toHaveBeenCalled();
});
