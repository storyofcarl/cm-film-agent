import { fireEvent, render, screen, within } from "@testing-library/react";
import { ReviewGrid } from "../apps/studio/components/ProductionViews";
import { sampleProject } from "../apps/studio/lib/sample";

test("browsing a candidate preserves production selection and reviews the displayed version", () => {
  const project = sampleProject();
  const shot = project.shots.find((item) => item.versions.length > 1);
  const original = shot.selectedVersionId;
  const candidate = shot.versions.find((version) => version.id !== original);
  const command = jest.fn();
  const selectItem = jest.fn();
  render(
    <ReviewGrid items={[shot]} command={command} selectItem={selectItem} />,
  );
  fireEvent.change(
    screen.getByRole("combobox", { name: `${shot.title} version` }),
    { target: { value: candidate.id } },
  );
  expect(command).not.toHaveBeenCalled();
  expect(shot.selectedVersionId).toBe(original);
  expect(screen.getByRole("img")).toHaveAttribute("src", candidate.media.url);
  fireEvent.change(
    screen.getByRole("combobox", { name: `${shot.title} approval` }),
    { target: { value: "approved" } },
  );
  expect(command).toHaveBeenLastCalledWith("version.review", {
    itemId: shot.id,
    versionId: candidate.id,
    review: "approved",
  });
  fireEvent.click(screen.getByRole("button", { name: shot.title }));
  expect(selectItem).toHaveBeenLastCalledWith(shot, candidate.id);
  fireEvent.click(
    screen.getByRole("button", { name: `Use V${candidate.number} for edit` }),
  );
  expect(command).toHaveBeenLastCalledWith("version.select", {
    itemId: shot.id,
    versionId: candidate.id,
  });
});

test("asset collection can be filtered by type and located by stable ID", () => {
  const project = sampleProject();
  render(
    <ReviewGrid
      items={project.assets}
      assetTypes
      command={jest.fn()}
      selectItem={jest.fn()}
    />,
  );
  const character = project.assets.find((asset) => asset.type === "character");
  fireEvent.change(screen.getByRole("combobox", { name: "Asset type" }), {
    target: { value: "character" },
  });
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(
    within(screen.getByRole("article")).getByRole("button", {
      name: character.title,
    }),
  ).toBeVisible();
  fireEvent.change(screen.getByRole("textbox", { name: "Find an item" }), {
    target: { value: character.code },
  });
  expect(screen.getAllByRole("article")).toHaveLength(1);
  fireEvent.change(screen.getByRole("textbox", { name: "Find an item" }), {
    target: { value: "missing-id" },
  });
  expect(screen.queryByRole("article")).not.toBeInTheDocument();
});
