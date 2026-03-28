export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      const SUPABASE_URL = (env.SUPABASE_URL || "").trim().startsWith("http") 
        ? env.SUPABASE_URL.trim() 
        : `https://${(env.SUPABASE_URL || "").trim()}`;
      const SUPABASE_KEY = (env.SUPABASE_ANON_KEY || "").trim();

      // --- AUTHENTICATION HELPERS ---
      const verifyToken = async (token) => {
        if (!token || !SUPABASE_URL || !SUPABASE_KEY) return false;

        try {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_session?token=eq.${token}&id=eq.1`, {
            headers: {
              "apikey": SUPABASE_KEY,
              "Authorization": `Bearer ${SUPABASE_KEY}`
            }
          });
          const data = await res.json();
          return Array.isArray(data) && data.length > 0;
        } catch (e) {
          console.error("Token verification failed:", e.message);
          return false;
        }
      };

      const generateRandomToken = () => {
        const array = new Uint8Array(24);
        crypto.getRandomValues(array);
        const hex = Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
        return `tk-${hex.substring(0, 16).toUpperCase()}`;
      };

      // --- 1. ADMIN TOKEN GEN/VERIFY ---
      if (url.pathname === "/api/admin/generate") {
        const newToken = generateRandomToken();
        if (!SUPABASE_URL || !SUPABASE_KEY) {
          return new Response(JSON.stringify({ error: "Supabase Keys Missing" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        await fetch(`${SUPABASE_URL}/rest/v1/admin_session?id=eq.1`, {
          method: "PATCH",
          body: JSON.stringify({ token: newToken, updated_at: new Date().toISOString() }),
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json"
          }
        });
        return new Response(JSON.stringify({ status: "generated" }), { headers: { "Content-Type": "application/json" } });
      }

      if (url.pathname === "/api/admin/verify") {
        const body = await request.clone().json().catch(() => ({}));
        const isValid = await verifyToken(body.token);
        return new Response(JSON.stringify({ valid: isValid }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // --- 2. DYNAMIC LINKS API (SUPABASE) ---
      if (url.pathname === "/api/links") {
        if (request.method === "GET") {
          try {
            if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Missing keys");
            const res = await fetch(`${SUPABASE_URL}/rest/v1/links?select=*&order=created_at.asc`, {
              headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
              }
            });
            const data = await res.json();
            return new Response(JSON.stringify(Array.isArray(data) ? data : []), {
              headers: { "Content-Type": "application/json" }
            });
          } catch (e) {
            console.error("Fetch links failed:", e.message);
            return new Response("[]", { headers: { "Content-Type": "application/json" } });
          }
        }

        if (request.method === "POST") {
          const adminToken = request.headers.get("X-Admin-Token");
          if (!(await verifyToken(adminToken))) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const body = await request.json();
          await fetch(`${SUPABASE_URL}/rest/v1/links?id=neq.00000000-0000-0000-0000-000000000000`, {
            method: "DELETE",
            headers: {
              "apikey": SUPABASE_KEY,
              "Authorization": `Bearer ${SUPABASE_KEY}`
            }
          });

          if (body.length > 0) {
            const insertData = body.map((l) => ({
              id: l.id.length > 30 ? l.id : undefined,
              name: l.name,
              url: l.url
            }));

            await fetch(`${SUPABASE_URL}/rest/v1/links`, {
              method: "POST",
              body: JSON.stringify(insertData),
              headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json"
              }
            });
          }
          return new Response(JSON.stringify({ status: "updated" }), { headers: { "Content-Type": "application/json" } });
        }
      }

      // --- 3. DISCORD OAUTH2 ---
      if (url.pathname === "/api/authorize") {
        const CLIENT_ID = env.DISCORD_CLIENT_ID;
        const REDIRECT_URI = `https://${url.hostname}/api/callback`;
        const oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20role_connection.write`;
        return Response.redirect(oauthUrl, 302);
      }

      if (url.pathname === "/api/callback") {
        const code = url.searchParams.get("code");
        if (!code) return new Response("No code provided", { status: 400 });

        const CLIENT_ID = env.DISCORD_CLIENT_ID;
        const CLIENT_SECRET = env.DISCORD_CLIENT_SECRET;
        const REDIRECT_URI = `https://${url.hostname}/api/callback`;

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
          return new Response(JSON.stringify(tokens), { status: 400, headers: { "Content-Type": "application/json" } });
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

    } catch (e) {
      console.error(e);
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // --- 5. DEFAULT: SERVE STATIC ASSETS ---
    return env.ASSETS.fetch(request);
  },
};
