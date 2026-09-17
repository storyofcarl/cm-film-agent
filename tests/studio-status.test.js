/** @jest-environment node */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ProjectStatus from "../apps/studio/components/ProjectStatus";
import { createProject, sceneSignature } from "../apps/studio/lib/domain";

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
  project.sceneApprovals = project.nodes
    .slice(0, 4)
    .map((scene) => ({
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
