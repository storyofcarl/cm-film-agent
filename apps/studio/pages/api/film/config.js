import { withStudioAuth } from "../../../lib/server/auth";
import { modelCatalog } from "../../../lib/server/models";
import { resolveConfig } from "../../../../../utils/film/suiteConfig";
export default withStudioAuth(async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();
  return res.json({ models: resolveConfig().models, catalog: modelCatalog() });
});
