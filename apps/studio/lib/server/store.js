import { createAdminSupabase } from "../../../../utils/server/supabase";
import { requestContext } from "../../../../utils/server/requestContext";
import { validateProject, stable, ensureProductionIds } from "../domain";
import { fault } from "./errors";
import { packProject, hydrateProject } from "./projectRecords";

export { fault } from "./errors";
export const ownerId = () => requestContext().user.id;
export async function loadProject(id) {
  if (typeof id !== "string" || !/^[\w-]{1,100}$/.test(id))
    throw fault("Choose a production.");
  const { data, error } = await createAdminSupabase()
    .from("studio_projects")
    .select("document,revision")
    .eq("id", id)
    .eq("owner_id", ownerId())
    .maybeSingle();
  if (error) throw fault("Project store unavailable.", 503);
  if (!data) throw fault("Production not found.", 404);
  return {
    project: ensureProductionIds(await hydrateProject(data.document)),
    revision: data.revision,
  };
}
export async function listProjects() {
  const { data, error } = await createAdminSupabase()
    .from("studio_projects")
    .select("id,title,revision,updated_at")
    .eq("owner_id", ownerId())
    .order("updated_at", { ascending: false });
  if (error) throw fault("Project store unavailable.", 503);
  return data;
}
export async function insertProject(project) {
  ensureProductionIds(project);
  validateProject(project);
  const document = await packProject(project);
  const { error } = await createAdminSupabase().from("studio_projects").insert({
    id: project.id,
    owner_id: ownerId(),
    title: project.title,
    document,
  });
  if (error)
    throw fault(
      error.code === "23505"
        ? "A production already uses that identifier."
        : "Project could not be saved.",
      error.code === "23505" ? 409 : 503,
    );
  return { project, revision: 1 };
}
export function assertRevision(actual, expected) {
  if (!Number.isSafeInteger(expected) || actual !== expected)
    throw fault(
      "This production changed in another tab or job. Reload it before saving your change.",
      409,
    );
}
export async function saveProject(project, revision) {
  ensureProductionIds(project);
  validateProject(project);
  const document = await packProject(project);
  const { data, error } = await createAdminSupabase()
    .from("studio_projects")
    .update({
      document,
      title: project.title,
      revision: revision + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", project.id)
    .eq("owner_id", ownerId())
    .eq("revision", revision)
    .select("revision")
    .maybeSingle();
  if (error) throw fault("Project could not be saved.", 503);
  if (!data)
    throw fault(
      "This production changed while saving. Reload it; your change has not overwritten the newer version.",
      409,
    );
  return { project, revision: data.revision };
}
// Provider results merge with the newest edit; a stale tab must never erase them.
export async function mergeProject(id, update) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const loaded = await loadProject(id);
    const before = stable(loaded.project);
    const project = await update(loaded.project);
    if (stable(project) === before) return loaded;
    try {
      return await saveProject(project, loaded.revision);
    } catch (error) {
      if (error.status !== 409 || attempt === 3) throw error;
    }
  }
}
