import { createAdminSupabase } from "../../../../utils/server/supabase";
import { requestContext } from "../../../../utils/server/requestContext";
import { validateProject, stable } from "../domain";
import { fault } from "./errors";

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
  return { project: data.document, revision: data.revision };
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
  validateProject(project);
  const { error } = await createAdminSupabase().from("studio_projects").insert({
    id: project.id,
    owner_id: ownerId(),
    title: project.title,
    document: project,
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
  validateProject(project);
  if (JSON.stringify(project).length > 12 * 1024 * 1024)
    throw fault(
      "The project manifest exceeds 12 MB. Archive older batches before adding more.",
    );
  const { data, error } = await createAdminSupabase()
    .from("studio_projects")
    .update({
      document: project,
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
