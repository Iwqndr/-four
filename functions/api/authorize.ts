export async function onRequest(context) {
  const CLIENT_ID = "1487396450634567762";
  const REDIRECT_URI = "https://fourhrts.pages.dev/api/callback";
  
  const DISCORD_OAUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20role_connections.write&prompt=none`;
  
  return Response.redirect(DISCORD_OAUTH_URL);
}
