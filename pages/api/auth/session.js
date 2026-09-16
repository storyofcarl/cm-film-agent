import { withAuth } from '../../../utils/server/withAuth';
import { requestContext } from '../../../utils/server/requestContext';

export default withAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();
  const { user } = requestContext();
  return res.status(200).json({ user: { id: user.id, email: user.email } });
});
