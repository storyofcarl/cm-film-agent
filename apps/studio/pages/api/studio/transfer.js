import { withStudioAuth } from "../../../lib/server/auth";
import { signProjectImport } from "../../../lib/server/projectRecords";

export const config = { api: { bodyParser: { sizeLimit: "4kb" } } };
export default withStudioAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  return res.json(await signProjectImport(req.body?.size));
});
