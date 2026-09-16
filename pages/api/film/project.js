import { withAuth } from '../../../utils/server/withAuth';
export default withAuth(async (req, res) => {
  if (req.method === 'GET' && req.query.action === 'recent') return res.json({ recent: [] });
  return res.status(410).json({ error: 'Server filesystem projects are unavailable. Use cloud projects or browser folder export.' });
});
