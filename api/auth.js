// GitHub OAuth "begin" step for Decap CMS (/admin → Login with GitHub).
// Env vars (Vercel → Settings → Environment Variables):
//   OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET,
//   ORIGIN=https://galamed.vercel.app,
//   COMPLETE_URL=https://galamed.vercel.app/api/callback
import provider from 'netlify-cms-oauth-provider-node';

const { createVercelBeginHandler } = provider;

export default createVercelBeginHandler({}, { useEnv: true });
