// Cloudflare Worker function to handle Decap CMS GitHub OAuth
// This file should be placed in: functions/api/auth.ts
// Cloudflare Pages will automatically create an API route at /api/auth

export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // This is a simplified OAuth handler
  // For production, you'll need to implement the full GitHub OAuth flow
  // See: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
  
  // For now, redirect to GitHub OAuth
  const clientId = env.GITHUB_CLIENT_ID;
  const redirectUri = `${url.origin}/api/auth/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo`;
  
  return Response.redirect(githubAuthUrl);
}
