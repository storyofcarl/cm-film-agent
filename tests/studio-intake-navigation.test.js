import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Studio from "../apps/studio/components/Studio";
import { sampleProject } from "../apps/studio/lib/sample";
import { resolveProjectResponse } from "../apps/studio/lib/projectTransfer";
import {
  importSummary,
  suppliedDocumentGroups,
} from "../apps/studio/lib/intakeSummary";

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));
jest.mock("../utils/supabase/browser", () => ({
  getBrowserSupabase: jest.fn(),
}));
jest.mock("../apps/studio/lib/projectTransfer", () => ({
  resolveProjectResponse: jest.fn(),
  uploadProjectFile: jest.fn(),
}));

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

test.each(["Scripts", "Audio", null])(
  "a delayed import respects an explicit section (%s) and otherwise resets old object context",
  async (chosenSection) => {
    const original = sampleProject();
    const imported = sampleProject();
    imported.id = "imported-project";
    imported.title = "Imported screenplay";
    imported.artifacts = [
      {
        id: "script-1",
        documentId: "script-1",
        documentArea: "scripts",
        title: "Full screenplay",
        content:
          "INT. OBSERVATORY - NIGHT\nThe complete source remains available.",
        number: 1,
        review: "pending",
        origin: "imported",
      },
    ];
    let finishDownload;
    resolveProjectResponse.mockImplementation((value) =>
      value.transferPending
        ? new Promise((resolve) => {
            finishDownload = resolve;
          })
        : Promise.resolve(value),
    );
    global.fetch = jest.fn(async (url, options) => ({
      ok: true,
      status: options?.method === "POST" ? 201 : 200,
      json: async () =>
        options?.method === "POST"
          ? { transferPending: true }
          : url.includes("config")
            ? { models: {}, catalog: [] }
            : { items: [] },
    }));
    const { container } = render(<Studio initialProject={original} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    fireEvent.click(
      screen.getByRole("button", {
        name: "SH-001 · The last light",
        exact: true,
      }),
    );
    const file = new File(["{}"], "screenplay.studio.json", {
      type: "application/json",
    });
    file.text = async () => "{}";
    fireEvent.change(
      container.querySelector('input[accept^="application/json"]'),
      { target: { files: [file] } },
    );
    await waitFor(() => expect(finishDownload).toBeDefined());
    if (chosenSection) {
      fireEvent.click(
        screen.getByRole("button", { name: chosenSection, exact: true }),
      );
      expect(
        screen.getByRole("heading", { name: chosenSection, exact: true }),
      ).toBeVisible();
    }
    await act(async () => {
      finishDownload({ project: imported, revision: 0, report: {} });
    });
    expect(
      screen.getByRole("heading", { name: "Imported screenplay", exact: true }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Imported 1 document (1 version), 3 assets, 6 shots. Completeness review is pending.",
    );
    if (chosenSection)
      expect(
        screen.getByRole("heading", { name: chosenSection, exact: true }),
      ).toBeVisible();
    if (chosenSection === "Scripts")
      expect(
        screen.getByRole("textbox", { name: "Document text", exact: true }),
      ).toHaveValue(imported.artifacts[0].content);
    expect(
      screen.queryByRole("region", { name: "Manual object controls" }),
    ).not.toBeInTheDocument();
    if (!chosenSection)
      expect(
        screen.getByRole("button", { name: "Add act", exact: true }),
      ).toBeVisible();
  },
);

test("intake counts one screenplay family with forty drafts without treating preserved text as approved", () => {
  const project = sampleProject();
  project.shots = [];
  project.assets = [];
  project.artifacts = Array.from({ length: 40 }, (_, index) => ({
    id: `draft-${index}`,
    documentId: "screenplay",
    documentArea: "scripts",
    origin: "imported",
    number: index + 1,
    title: "Screenplay",
    review: "pending",
  }));
  project.artifacts.push({
    id: "report",
    title: "Intake validation report",
    method: "intake",
  });
  expect(suppliedDocumentGroups(project)).toHaveLength(1);
  expect(importSummary(project)).toBe(
    "Imported 1 document (40 versions). Completeness review is pending.",
  );
});
