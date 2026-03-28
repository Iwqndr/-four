export async function onRequest(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  
  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  // Use Environment Variables for security
  const CLIENT_ID = context.env.DISCORD_CLIENT_ID;
  const CLIENT_SECRET = context.env.DISCORD_CLIENT_SECRET; // Ensure this is j7ilc4QL1QFJ6ld3jNMiQrXcma2n7nVq on dashboard!
  const REDIRECT_URI = "https://fourhrts.pages.dev/api/callback";

  // 1. Exchange the code for an access token
  const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const tokens = await tokenResponse.json();
  if (tokens.error || !tokens.access_token) {
    return new Response(JSON.stringify(tokens), { status: 400 });
  }

  // 2. "Push" the metadata (THIS is what makes the icon appear)
  // Matches your exact tutorial logic
  const updateResponse = await fetch(`https://discord.com/api/v10/users/@me/applications/${CLIENT_ID}/role-connection`, {
    method: "PUT",
    body: JSON.stringify({
      platform_name: "fourhrts", // The name that shows next to the icon
      platform_username: "Wonder",  // Your site username/handle
      metadata: {
        verified: 1 // Match the metadata key we registered
      },
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
