// GitHub OAuth "callback" step for Decap CMS.
// Must match the Authorization callback URL in the GitHub OAuth App:
//   https://galamed.vercel.app/api/callback
import provider from 'netlify-cms-oauth-provider-node';

const { createVercelCompleteHandler } = provider;

export default createVercelCompleteHandler({}, { useEnv: true });
