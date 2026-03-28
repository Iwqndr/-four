export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- AUTHENTICATION HELPERS ---
    const getAdminStatus = () => {
      const clientIp = request.headers.get("CF-Connecting-IP");
      const adminSecret = request.headers.get("X-Admin-Secret");
      // Allowed IPs: User's provided 10.0.0.55/124 (for local dev) + Public IP (future)
      const allowedIps = ["10.0.0.55", "10.0.0.124"]; 
      // Fallback secret if IP changes
      const masterSecret = env.ADMIN_SECRET || "admin123"; 

      return allowedIps.includes(clientIp) || adminSecret === masterSecret;
    };

    // --- 1. ADMIN IP CHECKER ---
    if (url.pathname === "/api/ip") {
      return new Response(request.headers.get("CF-Connecting-IP"), {
        headers: { "Content-Type": "text/plain" }
      });
    }

    // --- 2. DYNAMIC LINKS API (SUPABASE) ---
    if (url.pathname === "/api/links") {
      const SUPABASE_URL = env.SUPABASE_URL;
      const SUPABASE_KEY = env.SUPABASE_ANON_KEY;

      if (request.method === "GET") {
        try {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/links?select=*&order=created_at.asc`, {
            headers: {
              "apikey": SUPABASE_KEY,
              "Authorization": `Bearer ${SUPABASE_KEY}`
            }
          });
          const data = await res.json();
          return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (e) {
          return new Response("[]", { status: 200 });
        }
      }

      if (request.method === "POST") {
        if (!getAdminStatus()) {
          return new Response("Unauthorized", { status: 401 });
        }

        const body = await request.json(); // Array of links
        
        try {
          // 1. Delete all current links to sync the full list (KV style)
          await fetch(`${SUPABASE_URL}/rest/v1/links?id=neq.00000000-0000-0000-0000-000000000000`, {
            method: "DELETE",
            headers: {
              "apikey": SUPABASE_KEY,
              "Authorization": `Bearer ${SUPABASE_KEY}`
            }
          });

          // 2. Insert the new links
          if (body.length > 0) {
            const insertData = body.map((l) => ({
              id: l.id.length > 30 ? l.id : undefined, // Ensure valid UUID or let Supabase generate
              name: l.name,
              url: l.url
            }));

            await fetch(`${SUPABASE_URL}/rest/v1/links`, {
              method: "POST",
              body: JSON.stringify(insertData),
              headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
              }
            });
          }

          return new Response("Updated", { status: 200 });
        } catch (e) {
          return new Response(`Error: ${e.message}`, { status: 500 });
        }
      }
    }

    // --- 3. DISCORD AUTHORIZE (KEEPING) ---
    if (url.pathname === "/api/authorize") {
      const CLIENT_ID = env.DISCORD_CLIENT_ID;
      const REDIRECT_URI = "https://fourhrts.pages.dev/api/callback";
      const DISCORD_OAUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20role_connections.write&prompt=none`;
      return Response.redirect(DISCORD_OAUTH_URL);
    }

    // --- 4. DISCORD CALLBACK (KEEPING) ---
    if (url.pathname === "/api/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("No code provided", { status: 400 });

      const CLIENT_ID = env.DISCORD_CLIENT_ID;
      const CLIENT_SECRET = env.DISCORD_CLIENT_SECRET;
      const REDIRECT_URI = "https://fourhrts.pages.dev/api/callback";

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

    // --- 5. DEFAULT: SERVE STATIC ASSETS ---
    return env.ASSETS.fetch(request);
  },
};
