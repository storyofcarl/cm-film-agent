import { withStudioAuth } from "../../../lib/server/auth";
import {
  KEY_RE,
  checkInUrl,
  signedMediaUrl,
} from "../../../../../utils/server/mediaStore";
export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };
export default withStudioAuth(async (req, res) => {
  if (req.method === "GET") {
    if (!KEY_RE.test(String(req.query.key || "")))
      return res.status(400).json({ error: "Invalid media key." });
    return res.redirect(307, await signedMediaUrl(req.query.key));
  }
  if (req.method === "POST") return res.json(await checkInUrl(req.body?.url));
  return res.status(405).end();
});
