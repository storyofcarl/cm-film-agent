/** @jest-environment node */
import { applyCommand, inputSignature } from "../apps/studio/lib/domain";
import { sampleProject } from "../apps/studio/lib/sample";
import { shotRanges } from "../apps/studio/components/ProjectStrip";

test("bulk grid edits change future intent atomically and retain version recipes and approvals", () => {
  const project = sampleProject();
  const history = JSON.stringify(project.shots.map((shot) => shot.versions));
  const before = inputSignature(project, [project.shots[0].id]);
  const changed = applyCommand(project, {
    type: "grid.update",
    payload: {
      updates: [
        { id: project.shots[0].id, title: "Updated first shot", duration: "9" },
        { id: project.shots[1].id, duration: "7" },
        { id: project.nodes[0].id, title: "Updated act title" },
      ],
    },
  });
  expect(changed.shots[0].duration).toBe(9);
  expect(changed.shots[1].duration).toBe(7);
  expect(changed.nodes[0].title).toBe("Updated act title");
  expect(JSON.stringify(changed.shots.map((shot) => shot.versions))).toBe(
    history,
  );
  expect(inputSignature(changed, [project.shots[0].id])).not.toBe(before);
  const original = JSON.stringify(project);
  for (const update of [
    { id: project.shots[1].id, duration: -1 },
    { id: "missing", title: "Missing" },
    { id: project.shots[1].id, versions: [] },
    { id: project.nodes[0].id, duration: 10 },
  ])
    expect(() =>
      applyCommand(project, {
        type: "grid.update",
        payload: {
          updates: [
            { id: project.shots[0].id, title: "Must not save" },
            update,
          ],
        },
      }),
    ).toThrow();
  expect(JSON.stringify(project)).toBe(original);
});

test("shot ranges preserve creative hierarchy order and never replace shots with rollup thumbnails", () => {
  const project = sampleProject();
  project.nodes.reverse();
  project.shots.reverse();
  const groups = shotRanges(project);
  const scenes = groups.flatMap((act) =>
    act.sequences.flatMap((sequence) => sequence.scenes),
  );
  expect(groups).toHaveLength(1);
  expect(groups[0].sequences).toHaveLength(2);
  expect(scenes.map((scene) => scene.node.id)).toEqual(["sc1", "sc2", "sc3"]);
  expect(scenes.flatMap((scene) => scene.shots.map((shot) => shot.id))).toEqual(
    ["sh1", "sh2", "sh3", "sh4", "sh5", "sh6"],
  );
});
