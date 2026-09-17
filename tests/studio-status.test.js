/** @jest-environment node */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ProjectStatus from "../apps/studio/components/ProjectStatus";
import { createProject, sceneSignature } from "../apps/studio/lib/domain";
import { sampleProject } from "../apps/studio/lib/sample";

test("scoped progress isolates the current branch and keeps shot approval separate from scene approval", () => {
  const project = sampleProject();
  const render = (containerId) =>
    renderToStaticMarkup(
      <ProjectStatus project={project} containerId={containerId} />,
    );
  expect(render("sc1")).toContain(
    "Scene status: 2 of 4 shots approved. Scene awaiting approval",
  );
  expect(render("seq2")).toContain("Sequence status: 0 of 1 scenes approved");
  expect(render("act1")).toContain("Act status: 0 of 3 scenes approved");
  project.shots
    .filter((shot) => shot.sceneId === "sc1")
    .forEach((shot) => {
      shot.versions.find(
        (version) => version.id === shot.selectedVersionId,
      ).review = "approved";
    });
  expect(render("sc1")).toContain(
    "Scene status: 4 of 4 shots approved. Scene awaiting approval",
  );
  project.sceneApprovals.push({
    sceneId: "sc1",
    signature: sceneSignature(project, "sc1"),
  });
  expect(render("sc1")).toContain(
    "Scene status: 4 of 4 shots approved. Scene approved",
  );
  expect(render("seq2")).toContain("Sequence status: 0 of 1 scenes approved");
  project.shots[2].selectedVersionId = "sh3v2";
  expect(render("sc1")).toContain(
    "Scene status: 3 of 4 shots approved. Scene awaiting approval",
  );
});

test("the status ring counts current scene approvals and drops a stale selection", () => {
  const project = createProject();
  project.nodes = Array.from({ length: 6 }, (_, index) => ({
    id: `scene-${index}`,
    type: "scene",
    title: `Scene ${index + 1}`,
  }));
  project.shots = project.nodes.map((scene, index) => ({
    id: `shot-${index}`,
    kind: "shot",
    sceneId: scene.id,
    duration: 5,
    selectedVersionId: "v1",
    versions: [
      { id: "v1", review: "approved", media: { url: "fixture" } },
      { id: "v2", review: "pending", media: { url: "replacement" } },
    ],
  }));
  project.sceneApprovals = project.nodes.slice(0, 4).map((scene) => ({
    sceneId: scene.id,
    signature: sceneSignature(project, scene.id),
  }));
  expect(renderToStaticMarkup(<ProjectStatus project={project} />)).toContain(
    "Project status: 4 of 6 scenes approved",
  );
  project.shots[0].selectedVersionId = "v2";
  expect(renderToStaticMarkup(<ProjectStatus project={project} />)).toContain(
    "Project status: 3 of 6 scenes approved",
  );
});
