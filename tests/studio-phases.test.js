/** @jest-environment node */
import { projectPhases } from "../apps/studio/lib/phases";
import { createProject, sceneSignature } from "../apps/studio/lib/domain";
import { sampleProject } from "../apps/studio/lib/sample";

test("empty phases are unchecked and newer script drafts supersede prior approval", () => {
  const project = createProject({ title: "Phase test" });
  expect(projectPhases(project).every((phase) => phase.state === "empty")).toBe(
    true,
  );
  project.artifacts = [
    {
      id: "v1",
      documentId: "script",
      documentArea: "scripts",
      number: 1,
      review: "approved",
    },
    {
      id: "v2",
      documentId: "script",
      documentArea: "scripts",
      number: 2,
      review: "pending",
    },
  ];
  expect(projectPhases(project)[0]).toMatchObject({
    state: "pending",
    approved: 0,
    total: 1,
  });
  project.artifacts[1].review = "approved";
  expect(projectPhases(project)[0].state).toBe("approved");
});

test("phase approval follows current asset versions and exact scene approvals", () => {
  const project = sampleProject();
  for (const item of [...project.assets, ...project.shots])
    item.versions.find(
      (version) => version.id === item.selectedVersionId,
    ).review = "approved";
  project.sceneApprovals = project.nodes
    .filter((node) => node.type === "scene")
    .map((node) => ({
      sceneId: node.id,
      signature: sceneSignature(project, node.id),
    }));
  expect(projectPhases(project)[1].state).toBe("approved");
  expect(projectPhases(project)[3]).toMatchObject({
    state: "approved",
    approved: 3,
    total: 3,
  });
  project.shots[0].duration += 1;
  expect(projectPhases(project)[3]).toMatchObject({
    state: "pending",
    approved: 2,
    total: 3,
  });
  project.assets[0].versions.find(
    (version) => version.id === project.assets[0].selectedVersionId,
  ).review = "revision";
  expect(projectPhases(project)[1].state).toBe("revision");
  project.guides = [
    { id: "a", kind: "previs", targetId: "sh1", review: "pending" },
    { id: "b", kind: "previs", targetId: "sh1", review: "approved" },
  ];
  expect(projectPhases(project)[2]).toMatchObject({
    state: "pending",
    approved: 1,
    total: 2,
  });
  project.deliveries = [{ review: "approved", signature: "obsolete" }];
  expect(projectPhases(project)[4].state).toBe("pending");
});
