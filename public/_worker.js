export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. DISCORD AUTHORIZE
    if (url.pathname === "/api/authorize") {
      const CLIENT_ID = env.DISCORD_CLIENT_ID;
      const REDIRECT_URI = "https://fourhrts.pages.dev/api/callback";
      const DISCORD_OAUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20role_connections.write&prompt=none`;
      return Response.redirect(DISCORD_OAUTH_URL);
    }

    // 2. DISCORD CALLBACK
    if (url.pathname === "/api/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("No code provided", { status: 400 });

      const CLIENT_ID = env.DISCORD_CLIENT_ID;
      const CLIENT_SECRET = env.DISCORD_CLIENT_SECRET;
      const REDIRECT_URI = "https://fourhrts.pages.dev/api/callback";

      // Exchange code for token
      const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
        method: "POST",
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: REDIRECT_URI,
        }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const tokens = await tokenResponse.json();
      if (tokens.error || !tokens.access_token) {
        return new Response(JSON.stringify(tokens), { status: 400 });
      }

      // Push metadata to profile
      const updateResponse = await fetch(`https://discord.com/api/v10/users/@me/applications/${CLIENT_ID}/role-connection`, {
        method: "PUT",
        body: JSON.stringify({
          platform_name: "fourhrts",
          platform_username: "Wonder",
          metadata: { verified: 1 },
        }),
        headers: {
          "Authorization": `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!updateResponse.ok) {
        const errorBody = await updateResponse.text();
        return new Response(`Failed to update connection: ${errorBody}`, { status: 500 });
      }

      return new Response("Success! Refresh Discord now and check your Connections.");
    }

    // 3. DEFAULT: SERVE STATIC ASSETS (Your React App)
    // Cloudflare Pages uses env.ASSETS to serve the static content
    return env.ASSETS.fetch(request);
  },
};
